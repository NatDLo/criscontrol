from django.conf import settings
from django.contrib.auth.models import update_last_login
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
from django.db import transaction
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .tokens import email_verification_token


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=12)
    password2 = serializers.CharField(write_only=True, min_length=12)

    class Meta:
        model = User
        fields = ("username", "email", "password", "password2")

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ese email ya está registrado.")
        return value

    def validate_username(self, value):
        value = value.strip()
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ese username ya está registrado.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "Las contraseñas no coinciden."})

        # Apply Django password validators configured in settings.py
        temp_user = User(
            username=attrs.get("username", "").strip(),
            email=attrs.get("email", "").lower().strip(),
        )
        validate_password(attrs["password"], user=temp_user)

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        username = validated_data["username"].strip()
        email = validated_data["email"].lower().strip()
        password = validated_data["password"]

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                is_active=False,
                is_email_verified=False,
            )

            if request is not None:

                def send_verification_email():
                    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
                    token = email_verification_token.make_token(user)
                    verify_url = request.build_absolute_uri(
                        reverse(
                            "verify-email",
                            kwargs={"uidb64": uidb64, "token": token},
                        )
                    )
                    send_mail(
                        subject="Verifica tu cuenta",
                        message=f"Hola {user.username}, verifica tu cuenta aquí: {verify_url}",
                        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                        recipient_list=[user.email],
                        fail_silently=False,
                    )

                transaction.on_commit(send_verification_email)

        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        email = (attrs.get(self.username_field) or "").lower().strip()
        password = attrs.get("password") or ""

        if not email or not password:
            raise AuthenticationFailed("Credenciales inválidas.")

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise AuthenticationFailed("Credenciales inválidas.")

        if not user.check_password(password):
            raise AuthenticationFailed("Credenciales inválidas.")

        if not user.is_active or not user.is_email_verified:
            raise AuthenticationFailed("Debes verificar tu email antes de iniciar sesión.")

        refresh = self.get_token(user)
        data = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }

        if api_settings.UPDATE_LAST_LOGIN:
            update_last_login(None, user)

        return data


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        self.token = None
        try:
            self.token = RefreshToken(attrs["refresh"])
        except TokenError:
            raise serializers.ValidationError({"refresh": "Token inválido o expirado."})
        return attrs

    def save(self, **kwargs):
        if self.token is not None:
            self.token.blacklist()


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("username", "first_name", "last_name")

    def validate_email(self, value):
        value = value.lower().strip()
        qs = User.objects.filter(email__iexact=value).exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Ese email ya está en uso.")
        return value

    def validate_username(self, value):
        value = value.strip()
        qs = User.objects.filter(username=value).exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This username is already in use. / Ese username ya está en uso.")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=12)
    new_password2 = serializers.CharField(write_only=True, min_length=12)

    def validate(self, attrs):
        request = self.context.get("request")
        user = request.user

        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError(
                {"current_password": "La contraseña actual no es correcta."}
            )

        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError(
                {"new_password2": "Las contraseñas no coinciden."}
            )

        validate_password(attrs["new_password"], user=user)
        return attrs

    def save(self, **kwargs):
        request = self.context.get("request")
        user = request.user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user