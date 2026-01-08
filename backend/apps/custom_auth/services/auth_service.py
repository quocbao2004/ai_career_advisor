from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
from apps.custom_auth.services.email_service import EmailService
from django.core.cache import cache
import logging
from apps.users.models import User, UserProfile

logger = logging.getLogger(__name__)


# Kiểm tra user đã hoàn thành onboarding chưa
def check_user_onboarding_status(user):
    try:
        profile = UserProfile.objects.get(user=user)
        has_completed = bool(profile.mbti_result or profile.holland_result)  # có kq
        return has_completed
    except UserProfile.DoesNotExist:
        return False


class AuthService:

    # Đăng nhập bằng email và mật khẩu
    @staticmethod
    def login(email: str, password: str):
        user = get_user_by_email(email)
        if not user:
            return None, "Email không tồn tại"

        # Kiểm tra tài khoản còn hoạt động không
        if user.is_deleted:
            return None, "Tài khoản đã bị xóa"
        if not user.is_active:
            return None, "Tài khoản đã bị vô hiệu hóa"
        if not check_password(password, user.password_hash):
            return None, "Mật khẩu không đúng"

        refresh = RefreshToken.for_user(user)
        has_completed_onboarding = check_user_onboarding_status(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": str(user.id),
                "email": user.email,
                "fullName": user.full_name,
                "role": user.role or "user",
                "hasCompletedOnboarding": has_completed_onboarding
            }
        }, None

    # Đăng ký tài khoản mới
    @staticmethod
    def register(email: str, password: str, full_name: str):
        # Kiểm tra email đã tồn tại chưa
        if User.objects.filter(email=email).exists():
            return None, "Email này đã được đăng ký"

        if len(password) < 8:
            return None, "Mật khẩu phải có ít nhất 8 ký tự"

        # Tạo user mới
        try:
            User.objects.create_user(
                email=email,
                password=password,
                full_name=full_name
            )
        except Exception as e:
            return None, str(e)

        # Gửi OTP xác thực email
        send_otp(email)

        # Lưu thông tin đăng ký vào cache (10 phút)
        cache.set(f"pending_register_{email}", {
            "email": email,
            "password": password,
            "full_name": full_name
        }, timeout=600)

        return {"email": email}, None

    # Xác thực OTP và hoàn tất đăng ký
    @staticmethod
    def verify_otp_and_complete_register(email: str, otp: str):
        # Kiểm tra OTP có đúng không
        if not EmailService.verify_otp(email, otp):
            return None, "OTP không đúng hoặc đã hết hạn"

        user = get_user_by_email(email)
        if not user:
            return None, "Tài khoản không tồn tại"

        refresh = RefreshToken.for_user(user)

        # Xóa các cache liên quan
        delete_user_cache(email)

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

    # Gửi lại OTP
    @staticmethod
    def resend_otp(email: str):
        # Kiểm tra có phiên đăng ký đang chờ không
        if not cache.get(f"pending_register_{email}"):
            return None, "Không có phiên đăng ký nào cho email này"

        send_otp(email)
        return {"message": "OTP mới đã được gửi"}, None

    # Đăng nhập bằng Google
    @staticmethod
    def google_login(email: str, full_name: str, **extra_fields):
        from django.db import transaction
        from django.utils.crypto import get_random_string
        
        user = None
        is_new_google_user = False
        
        # Tìm user đã tồn tại
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Tạo user mới nếu chưa có
            try:
                with transaction.atomic():
                    # Tạo mật khẩu ngẫu nhiên cho user Google
                    default_password = get_random_string(length=8)
                    user = User.objects.create_user(
                        email=email,
                        password=default_password,
                        full_name=full_name,
                        **extra_fields
                    )
                    
                    # Tạo profile cho user
                    UserProfile.objects.create(user=user)
                    
                    # Gửi email thông báo mật khẩu
                    try:
                        EmailService.send_password_email(email, default_password)
                        logger.info(f"Đã gửi email mật khẩu cho user mới: {email}")
                    except e:
                        pass
                is_new_google_user = True
            except Exception as e:
                return None, f"Lỗi tạo user: {str(e)}"

        refresh = RefreshToken.for_user(user)
        
        # Kiểm tra trạng thái onboarding
        has_completed_onboarding = check_user_onboarding_status(user)
        is_new_google_user = is_new_google_user or not has_completed_onboarding

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
                "isNewGoogleUser": is_new_google_user
            }
        }
    
    # Yêu cầu đặt lại mật khẩu
    @staticmethod
    def request_password_reset(email: str):
        user = get_user_by_email(email)
        if not user:
            return None, "Email không tồn tại"
        
        # Gửi OTP để xác thực
        send_otp(email)
        
        # Lưu phiên đặt lại mật khẩu (10 phút)
        cache.set(f"pending_reset_{email}", email, timeout=600)
        
        return {"email": email}, None

    # Xác thực OTP để đặt lại mật khẩu
    @staticmethod
    def verify_otp_for_reset(email: str, otp: str):
        # Kiểm tra có phiên đặt lại không
        if not cache.get(f"pending_reset_{email}"):
            return {"error": "Email không được tìm thấy trong phiên khôi phục"}
        if not EmailService.verify_otp(email, otp):
            return {"error": "OTP không đúng hoặc đã hết hạn"}
        cache.set(f"reset_verified_{email}", email, timeout=600)
        return {"email": email}

    # Đặt lại mật khẩu mới
    @staticmethod
    def reset_password(email: str, new_password: str):
        if len(new_password) < 8:
            return {"error": "Mật khẩu phải có ít nhất 8 ký tự"}
        if not cache.get(f"reset_verified_{email}"):
            return {"error": "Vui lòng xác nhận OTP trước"}
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return {"error": "Tài khoản không tồn tại"}
        try:
            user.set_password(new_password)
            user.save()
            delete_user_cache(email)
            return {"success": True, "message": "Mật khẩu đã được đặt lại."}
        except Exception as e:
            return {"error": str(e)}

    # Đăng xuất 
    @staticmethod
    def logout(email: str):
        delete_user_cache(email)
        return {"success": True}
    
#lấy user theo email
def get_user_by_email(email):
    try:
        return User.objects.get(email=email)
    except User.DoesNotExist:
        return None
#gữi otp
def send_otp(email):
    EmailService.send_otp(email)
#xóa cache
def delete_user_cache(email):
    cache.delete(f"user_{email}")
    cache.delete(f"otp_{email}")
    cache.delete(f"pending_reset_{email}")
    cache.delete(f"reset_verified_{email}")
    cache.delete(f"pending_register_{email}")