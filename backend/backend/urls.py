from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import LoginView, LogoutView, RegisterView, VerifyEmailView

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/login/", LoginView.as_view(), name="login"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/logout/", LogoutView.as_view(), name="logout"),
    path(
        "api/auth/verify-email/<str:uidb64>/<str:token>/",
        VerifyEmailView.as_view(),
        name="verify-email",
    ),

    path("api/categories/", include("categories.urls")),
    path("api/transactions/", include("transactions.urls")),
]