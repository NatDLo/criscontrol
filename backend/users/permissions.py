from rest_framework.permissions import BasePermission


class IsEmailVerified(BasePermission):
    message = "Debes verificar tu email para acceder."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_email_verified
        )