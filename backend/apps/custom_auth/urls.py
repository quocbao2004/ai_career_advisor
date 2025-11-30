from django.urls import path
from apps.custom_auth.views import (
    LoginView,
    RegisterView,
    VerifyOTPView,
    ResendOTPView,
    GoogleLoginView,
    ForgotPasswordView,
    VerifyResetOTPView,
    ResetPasswordView,
    LogoutView,
)

urlpatterns = [
    path("dang-nhap/", LoginView.as_view(), name="dang-nhap"),
    path("dang-ky/", RegisterView.as_view(), name="dang-ky"),
    path("xac-thuc-otp/", VerifyOTPView.as_view(), name="xac-thuc-otp"),
    path("gui-lai-otp/", ResendOTPView.as_view(), name="gui-lai-otp"),
    path("google-login/", GoogleLoginView.as_view(), name="google-login"),
    path("quen-mat-khau/", ForgotPasswordView.as_view(), name="quen-mat-khau"),
    path("xac-thuc-otp-reset/", VerifyResetOTPView.as_view(), name="xac-thuc-otp-reset"),
    path("dat-lai-mat-khau/", ResetPasswordView.as_view(), name="dat-lai-mat-khau"),
    path("dang-xuat/", LogoutView.as_view(), name="dang-xuat"),
]
