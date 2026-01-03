from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
from apps.custom_auth.services.email_service import EmailService
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


def check_user_onboarding_status(user):
    """
    Kiểm tra xem user đã làm test onboarding chưa
    Sử dụng mbti_result và holland_result có sẵn trong UserProfile
    """
    from apps.users.models import UserProfile
    
    try:
        profile = UserProfile.objects.get(user=user)
        has_completed = bool(profile.mbti_result or profile.holland_result)
        return has_completed
    except UserProfile.DoesNotExist:
        return False


class AuthService:

    @staticmethod
    def login(email: str, password: str):
        # Luôn lấy user fresh từ database, không dùng cache
        from apps.users.models import User
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return None, "Email không tồn tại"

        if user.is_deleted:
            return None, "Tài khoản đã bị xóa"

        if not user.is_active:
            return None, "Tài khoản đã bị vô hiệu hóa"

        if not check_password(password, user.password_hash):
            return None, "Mật khẩu không đúng"

        refresh = RefreshToken.for_user(user)
        
        # Check onboarding status dựa trên test results
        has_completed_onboarding = check_user_onboarding_status(user)

        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": str(user.id),
                "email": user.email,
                "fullName": user.full_name,
                "role": user.role or "user",
                "hasCompletedOnboarding": has_completed_onboarding,
                "needsOnboarding": not has_completed_onboarding
            }
        }, None

    @staticmethod
    def register(email: str, password: str, full_name: str):
        from apps.users.models import User
        
        if User.objects.filter(email=email).exists():
            return None, "Email này đã được đăng ký"

        if len(password) < 8:
            return None, "Mật khẩu phải có ít nhất 8 ký tự"

        try:
            user = User.objects.create_user(
                email=email,
                password=password,
                full_name=full_name
            )
        except Exception as e:
            return None, str(e)

        EmailService.send_otp(email)

        cache.set(f"pending_register_{email}", {
            "email": email,
            "password": password,
            "full_name": full_name
        }, timeout=600)

        return {"email": email}, None

    @staticmethod
    def verify_otp_and_complete_register(email: str, otp: str):
        from apps.users.models import User
        
        if not EmailService.verify_otp(email, otp):
            return None, "OTP không đúng hoặc đã hết hạn"

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return None, "Tài khoản không tồn tại"

        refresh = RefreshToken.for_user(user)

        # Xóa cache để force reload user từ database lần sau
        cache.delete(f"user_{email}")
        cache.delete(f"pending_register_{email}")
        cache.delete(f"otp_{email}")

        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": str(user.id),
                "email": user.email,
                "fullName": user.full_name,
                "role": user.role or "user"
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
        from apps.users.models import User, UserProfile 
        from django.db import transaction
        from django.utils.crypto import get_random_string
        user = None
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            try:
                with transaction.atomic():
                    default_password = get_random_string(length=10)
                    user = User.objects.create_user(
                        email=email,
                        password=default_password,
                        full_name=full_name,
                        **extra_fields
                    )
                    
                    UserProfile.objects.create(user=user)
                    try:
                        EmailService.send_password_email(email, default_password)
                        logger.info(f"Đã gửi email mật khẩu cho user mới: {email}")
                    except e:
                        pass
            except Exception as e:
                return None, f"Lỗi tạo user: {str(e)}"

        refresh = RefreshToken.for_user(user)
        
        # Check onboarding status
        has_completed_onboarding = check_user_onboarding_status(user)

        logger.info(f"Google login successful for {email}")

        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": str(user.id),
                "email": user.email,
                "fullName": user.full_name,
                "role": user.role or "user",
                "hasCompletedOnboarding": has_completed_onboarding,
                "needsOnboarding": not has_completed_onboarding
            }
        }, None
    
    @staticmethod
    def request_password_reset(email: str):
        from apps.users.models import User
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return None, "Email không tồn tại"
        
        EmailService.send_otp(email)
        cache.set(f"pending_reset_{email}", email, timeout=600)
        
        return {"email": email}, None

    @staticmethod
    def verify_otp_for_reset(email: str, otp: str):
        if not cache.get(f"pending_reset_{email}"):
            return None, "Email không được tìm thấy trong phiên khôi phục"
        
        if not EmailService.verify_otp(email, otp):
            return None, "OTP không đúng hoặc đã hết hạn"
        
        cache.set(f"reset_verified_{email}", email, timeout=600)
        return {"email": email}, None

    @staticmethod
    def reset_password(email: str, new_password: str):
        if len(new_password) < 8:
            return None, "Mật khẩu phải có ít nhất 8 ký tự"
        
        if not cache.get(f"reset_verified_{email}"):
            return None, "Vui lòng xác nhận OTP trước"
        
        from apps.users.models import User
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return None, "Tài khoản không tồn tại"
        
        try:
            user.set_password(new_password)
            user.save()
            
            # Xóa cache để force reload user từ database lần sau
            cache.delete(f"user_{email}")
            
            cache.delete(f"reset_verified_{email}")
            cache.delete(f"pending_reset_{email}")
            cache.delete(f"otp_{email}")
            return {"success": True, "message": "Mật khẩu đã được đặt lại."}, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def logout(email: str):
        cache.delete(f"user_{email}")
        cache.delete(f"otp_{email}")
        cache.delete(f"pending_reset_{email}")
        cache.delete(f"reset_verified_{email}")
        cache.delete(f"pending_register_{email}")
        return {"success": True}
