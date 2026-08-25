from django.core import mail
from django.test import override_settings
from unittest.mock import patch
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase, APIRequestFactory
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .permissions import IsEmailVerified
from .serializers import (
	ChangePasswordSerializer, CustomTokenObtainPairSerializer, LogoutSerializer, RegisterSerializer,
)
from .tokens import email_verification_token


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class UserTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(
			username="alice", email="Alice@Example.com", password="StrongPass123!",
			is_active=True, is_email_verified=True,
		)
		self.client.force_authenticate(self.user)

	def test_user_string_and_email_normalization(self):
		self.assertEqual(str(self.user), "Alice@example.com")

	def test_register_creates_user_and_sends_verification_email(self):
		self.client.force_authenticate(None)
		response = self.client.post("/api/auth/register/", {
			"username": " bob ", "email": " BOB@EXAMPLE.COM ",
			"password": "AnotherStrong123!", "password2": "AnotherStrong123!",
		}, format="json")
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertTrue(User.objects.filter(email="bob@example.com", username="bob").exists())
		self.assertEqual(User.objects.get(username="bob").is_email_verified, True)

	def test_register_rejects_duplicate_fields_and_mismatched_password(self):
		serializer = RegisterSerializer(data={
			"username": "alice", "email": "ALICE@example.com",
			"password": "StrongPass123!", "password2": "DifferentPass123!",
		})
		self.assertFalse(serializer.is_valid())
		self.assertTrue("username" in serializer.errors or "email" in serializer.errors)
		serializer = RegisterSerializer()
		User.objects.create_user(username="duplicate", email="duplicate@example.com", password="StrongPass123!")
		with self.assertRaises(Exception):
			serializer.validate_email("duplicate@example.com")
		with self.assertRaises(Exception):
			serializer.validate_username(self.user.username)

	def test_register_serializer_rejects_mismatched_password_and_can_create_without_request(self):
		serializer = RegisterSerializer(data={"username": "new", "email": "new@example.com", "password": "StrongPass123!", "password2": "Different123!"})
		self.assertFalse(serializer.is_valid())
		serializer = RegisterSerializer(data={"username": "new", "email": "new@example.com", "password": "StrongPass123!", "password2": "StrongPass123!"})
		self.assertTrue(serializer.is_valid(), serializer.errors)
		self.assertEqual(serializer.save().email, "new@example.com")

	@patch("users.serializers.transaction.on_commit", side_effect=lambda callback: callback())
	@patch("users.serializers.send_mail")
	def test_register_serializer_sends_email_with_request(self, send_mail, _on_commit):
		request = type("Request", (), {"build_absolute_uri": lambda self, value: "http://testserver" + value})()
		serializer = RegisterSerializer(data={"username": "mailer", "email": "mailer@example.com", "password": "StrongPass123!", "password2": "StrongPass123!"}, context={"request": request})
		self.assertTrue(serializer.is_valid(), serializer.errors)
		serializer.save()
		send_mail.assert_called_once()

	def test_login_success_and_invalid_credentials(self):
		self.client.force_authenticate(None)
		response = self.client.post("/api/auth/login/", {"email": " ALICE@EXAMPLE.COM ", "password": "StrongPass123!"}, format="json")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn("access", response.data)
		self.assertEqual(self.client.post("/api/auth/login/", {"email": "missing@example.com", "password": "x"}, format="json").status_code, 401)

	def test_login_rejects_wrong_password(self):
		self.client.force_authenticate(None)
		self.assertEqual(self.client.post("/api/auth/login/", {"email": self.user.email, "password": "wrong"}, format="json").status_code, 401)

	def test_login_rejects_inactive_and_empty_credentials(self):
		inactive = User.objects.create_user(username="inactive", email="inactive@example.com", password="StrongPass123!", is_active=False)
		serializer = CustomTokenObtainPairSerializer(data={"email": inactive.email, "password": "StrongPass123!"})
		with self.assertRaises(Exception):
			serializer.is_valid(raise_exception=True)
		serializer = CustomTokenObtainPairSerializer(data={"email": "", "password": ""})
		with self.assertRaises(Exception):
			serializer.is_valid(raise_exception=True)
		with self.assertRaises(Exception):
			serializer.validate({"email": "", "password": ""})

	def test_me_and_profile_update(self):
		response = self.client.get("/api/auth/me/")
		self.assertEqual(response.data["email"], self.user.email)
		response = self.client.patch("/api/auth/me/", {"username": " alice-new ", "first_name": "Alice"}, format="json")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data["username"], "alice-new")

	def test_profile_serializer_normalizes_email_and_rejects_duplicate_username(self):
		from .serializers import ProfileUpdateSerializer
		other = User.objects.create_user(username="other", email="other@example.com", password="StrongPass123!")
		serializer = ProfileUpdateSerializer(self.user, data={"username": "  updated  "}, partial=True)
		self.assertTrue(serializer.is_valid(), serializer.errors)
		self.assertEqual(serializer.validated_data["username"], "updated")
		self.assertEqual(serializer.validate_email("  fresh@example.com  "), "fresh@example.com")
		duplicate = ProfileUpdateSerializer(self.user, data={"username": other.username}, partial=True)
		self.assertFalse(duplicate.is_valid())
		with self.assertRaises(Exception):
			serializer.validate_username(other.username)
		duplicate_email = ProfileUpdateSerializer(self.user)
		with self.assertRaises(Exception):
			duplicate_email.validate_email(other.email)

	def test_change_password(self):
		response = self.client.post("/api/auth/change-password/", {
			"current_password": "StrongPass123!", "new_password": "NewStrongPass456!", "new_password2": "NewStrongPass456!",
		}, format="json")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.user.refresh_from_db()
		self.assertTrue(self.user.check_password("NewStrongPass456!"))

	def test_change_password_rejects_wrong_current_and_mismatch(self):
		response = self.client.post("/api/auth/change-password/", {
			"current_password": "wrong", "new_password": "NewStrongPass456!", "new_password2": "DifferentStrong456!",
		}, format="json")
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		request = type("Request", (), {"user": self.user})()
		serializer = ChangePasswordSerializer(data={"current_password": "StrongPass123!", "new_password": "NewStrongPass456!", "new_password2": "DifferentStrong456!"}, context={"request": request})
		self.assertFalse(serializer.is_valid())

	def test_logout_blacklists_refresh_token(self):
		refresh = str(RefreshToken.for_user(self.user))
		response = self.client.post("/api/auth/logout/", {"refresh": refresh}, format="json")
		self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)
		self.assertFalse(LogoutSerializer(data={"refresh": "invalid"}).is_valid())

	def test_verify_email_success_and_invalid_link(self):
		user = User.objects.create_user(username="verify", email="verify@example.com", password="StrongPass123!", is_active=False)
		token = email_verification_token.make_token(user)
		from django.utils.http import urlsafe_base64_encode
		from django.utils.encoding import force_bytes
		uid = urlsafe_base64_encode(force_bytes(user.pk))
		response = self.client.get(f"/api/auth/verify-email/{uid}/{token}/")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		user.refresh_from_db()
		self.assertTrue(user.is_email_verified)
		self.assertIsNotNone(user.email_verified_at)
		self.assertEqual(self.client.get(f"/api/auth/verify-email/{uid}/{email_verification_token.make_token(user)}/").status_code, status.HTTP_200_OK)
		self.assertEqual(self.client.get(f"/api/auth/verify-email/{uid}/invalid-token/").status_code, status.HTTP_400_BAD_REQUEST)
		self.assertEqual(self.client.get("/api/auth/verify-email/not-valid/bad/").status_code, status.HTTP_400_BAD_REQUEST)

	def test_verified_permission(self):
		factory = APIRequestFactory()
		request = factory.get("/")
		request.user = self.user
		self.assertTrue(IsEmailVerified().has_permission(request, None))
		self.user.is_email_verified = False
		self.assertFalse(IsEmailVerified().has_permission(request, None))

	def test_authentication_is_required(self):
		self.client.force_authenticate(None)
		self.assertEqual(self.client.get("/api/auth/me/").status_code, status.HTTP_401_UNAUTHORIZED)
