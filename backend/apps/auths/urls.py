from django.urls import path
from auths.views import LoginView, RegisterView, VerifyOTPView, ResendOTPView, GoogleLoginView

urlpatterns = [
    path("dang-nhap/", LoginView.as_view(), name="dang-nhap"),
    path("dang-ky/", RegisterView.as_view(), name="dang-ky"),
    path("xac-thuc-otp/", VerifyOTPView.as_view(), name="xac-thuc-otp"),
    path("gui-lai-otp/", ResendOTPView.as_view(), name="gui-lai-otp"),
    path("google-login/", GoogleLoginView.as_view(), name="google-login"),
]
