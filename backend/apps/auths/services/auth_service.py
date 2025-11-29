from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
from auths.repositories.auth_repository import AuthRepository
from auths.services.email_service import EmailService
from django.core.cache import cache


class AuthService:

    @staticmethod
    def login(email: str, password: str):
        user = AuthRepository.get_user_by_email(email)

        if not user:
            return None, "Email không tồn tại"

        if not check_password(password, user.password_hash):
            return None, "Mật khẩu không đúng"

        refresh = RefreshToken.for_user(user)

        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": str(user.id),
                "email": user.email,
                "fullName": user.full_name,
                "role": user.role
            }
        }, None

    @staticmethod
    def register(email: str, password: str, full_name: str):
        if AuthRepository.user_exists(email):
            return None, "Email này đã được đăng ký"

        if len(password) < 8:
            return None, "Mật khẩu phải có ít nhất 8 ký tự"

        user, error = AuthRepository.create_user(
            email=email,
            password=password,
            full_name=full_name
        )

        if error:
            return None, error

        EmailService.send_otp(email)

        cache.set(f"pending_register_{email}", {
            "email": email,
            "password": password,
            "full_name": full_name
        }, timeout=600)

        return {"email": email}, None

    @staticmethod
    def verify_otp_and_complete_register(email: str, otp: str):
        if not EmailService.verify_otp(email, otp):
            return None, "OTP không đúng hoặc đã hết hạn"

        user = AuthRepository.get_user_by_email(email)
        if not user:
            return None, "Tài khoản không tồn tại"

        refresh = RefreshToken.for_user(user)

        cache.delete(f"pending_register_{email}")
        cache.delete(f"otp_{email}")

        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": str(user.id),
                "email": user.email,
                "fullName": user.full_name,
                "role": user.role
            }
        }, None

    @staticmethod
    def resend_otp(email: str):
        if not cache.get(f"pending_register_{email}"):
            return None, "Không có phiên đăng ký nào cho email này"

        EmailService.send_otp(email)
        return {"message": "OTP mới đã được gửi"}, None

    @staticmethod
    def google_login(email: str, full_name: str, **extra_fields):
        user = AuthRepository.get_user_by_email(email)
        
        if not user:
            user, error = AuthRepository.create_user(
                email=email,
                password="",
                full_name=full_name,
                **extra_fields
            )
            
            if error:
                return None, error

        refresh = RefreshToken.for_user(user)

        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": str(user.id),
                "email": user.email,
                "fullName": user.full_name,
                "role": user.role
            }
        }, None
