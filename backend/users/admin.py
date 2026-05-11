from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ("id", "email", "username", "is_email_verified", "is_active", "is_staff")
    list_filter = ("is_email_verified", "is_active", "is_staff", "is_superuser")
    ordering = ("id",)
    search_fields = ("email", "username")
    fieldsets = UserAdmin.fieldsets + (
        ("Verificacion", {"fields": ("is_email_verified", "email_verified_at")}),
    )