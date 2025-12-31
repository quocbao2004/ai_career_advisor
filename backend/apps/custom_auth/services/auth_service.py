from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
from apps.custom_auth.services.email_service import EmailService
from django.core.cache import cache
import logging
import random

logger = logging.getLogger(__name__)


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
        
        is_new_user = False
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            try:
                # Sử dụng transaction để đảm bảo User và UserProfile được tạo cùng lúc
                with transaction.atomic():
                    # Mật khẩu mặc định cho tài khoản Google
                    default_password = "12345678"
                    
                    user = User.objects.create_user(
                        email=email,
                        password=default_password,
                        full_name=full_name,
                        **extra_fields
                    )
                    # Tạo UserProfile ngay lập tức trong cùng transaction
                    profile, created = UserProfile.objects.get_or_create(user=user)
                    if created:
                        logger.info(f"UserProfile created for new Google user: {email}")
                    
                    is_new_user = True
            except Exception as e:
                logger.error(f"Error creating Google user {email}: {e}")
                return None, str(e)

        # Đảm bảo user có profile trước khi tiếp tục - dùng get_or_create an toàn hơn hasattr
        try:
            profile, created = UserProfile.objects.get_or_create(user=user)
            if created:
                logger.warning(f"Created missing profile for existing user: {email}")
        except Exception as e:
            logger.error(f"Failed to create profile for {email}: {e}")
            return None, f"Không thể tạo profile: {str(e)}"

        # Gửi email mật khẩu mặc định cho user mới
        if is_new_user:
            EmailService.send_password_email(email, "12345678")

        refresh = RefreshToken.for_user(user)

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
