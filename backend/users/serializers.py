from django.conf import settings
from django.contrib.auth.models import update_last_login
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
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        username = validated_data["username"]
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
        email = attrs.get(self.username_field)
        password = attrs.get("password")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise AuthenticationFailed("Credenciales inválidas.")

        if not user.check_password(password):
            raise AuthenticationFailed("Credenciales inválidas.")

        if not user.is_active or not user.is_email_verified:
            raise AuthenticationFailed("Debes verificar tu email antes de iniciar sesión.")

        data = {}
        refresh = self.get_token(user)
        data["refresh"] = str(refresh)
        data["access"] = str(refresh.access_token)

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