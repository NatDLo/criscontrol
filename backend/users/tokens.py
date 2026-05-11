from django.contrib.auth.tokens import PasswordResetTokenGenerator


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        return f"{user.pk}{user.is_active}{user.is_email_verified}{user.email_verified_at}{timestamp}"


email_verification_token = EmailVerificationTokenGenerator()