from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.custom_auth.services.auth_service import AuthService
from utils.permissions import IsAdminOrUser
import jwt
import logging

logger = logging.getLogger(__name__)

# View xử lý đăng nhập bằng email và mật khẩu
class LoginView(APIView):

    def post(self, request):
        # Lấy dữ liệu từ request
        email = request.data.get("email")
        password = request.data.get("password")

        # Kiểm tra dữ liệu bắt buộc
        if not email or not password:
            return Response({
                "success": False,
                "message": "Email và mật khẩu là bắt buộc"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Gọi service đăng nhập
            data = AuthService.login(email, password)

            # Nếu có lỗi, trả về lỗi
            if "error" in data:
                return Response({
                    "success": False,
                    "message": data["error"]
                }, status=status.HTTP_400_BAD_REQUEST)

            # Trả về dữ liệu đăng nhập thành công
            return Response({
                "success": True,
                "message": "Đăng nhập thành công",
                **data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response({
                "success": False,
                "message": "Lỗi hệ thống"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# View xử lý đăng ký tài khoản mới
class RegisterView(APIView):

    def post(self, request):
        # Lấy dữ liệu từ request
        email = request.data.get("email")
        password = request.data.get("password")
        full_name = request.data.get("full_name")

        # Kiểm tra dữ liệu bắt buộc
        if not email or not password or not full_name:
            return Response({
                "success": False,
                "message": "Email, mật khẩu và tên là bắt buộc"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Gọi service đăng ký
            data = AuthService.register(email, password, full_name)

            # Nếu có lỗi, trả về lỗi
            if "error" in data:
                return Response({
                    "success": False,
                    "message": data["error"]
                }, status=status.HTTP_400_BAD_REQUEST)

            # Trả về dữ liệu đăng ký thành công
            return Response({
                "success": True,
                "message": "Đăng ký thành công, vui lòng xác nhận OTP",
                **data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Register error: {str(e)}")
            return Response({
                "success": False,
                "message": "Lỗi hệ thống"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# View xử lý xác nhận OTP để hoàn tất đăng ký
class VerifyOTPView(APIView):

    def post(self, request):
        # Lấy dữ liệu từ request
        email = request.data.get("email")
        otp = request.data.get("otp")

        # Kiểm tra dữ liệu bắt buộc
        if not email or not otp:
            return Response({
                "success": False,
                "message": "Email và OTP là bắt buộc"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Gọi service xác nhận OTP
            data = AuthService.verify_otp_and_complete_register(email, otp)

            # Nếu có lỗi, trả về lỗi
            if "error" in data:
                return Response({
                    "success": False,
                    "message": data["error"]
                }, status=status.HTTP_400_BAD_REQUEST)

            # Trả về dữ liệu xác nhận thành công
            return Response({
                "success": True,
                "message": "Xác nhận OTP thành công",
                **data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Verify OTP error: {str(e)}")
            return Response({
                "success": False,
                "message": "Lỗi hệ thống"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# View xử lý gửi lại OTP
class ResendOTPView(APIView):

    def post(self, request):
        # Lấy dữ liệu từ request
        email = request.data.get("email")

        # Kiểm tra dữ liệu bắt buộc
        if not email:
            return Response({
                "success": False,
                "message": "Email là bắt buộc"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Gọi service gửi lại OTP
            data = AuthService.resend_otp(email)

            # Nếu có lỗi, trả về lỗi
            if "error" in data:
                return Response({
                    "success": False,
                    "message": data["error"]
                }, status=status.HTTP_400_BAD_REQUEST)

            # Trả về thông báo gửi thành công
            return Response({
                "success": True,
                "message": "OTP mới đã được gửi"
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Lỗi khi gữi OTP: {str(e)}")
            return Response({
                "success": False,
                "message": "Lỗi hệ thống"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# View xử lý đăng nhập bằng Google
class GoogleLoginView(APIView):

    def post(self, request):
        # Lấy token từ request
        token = request.data.get("token")
        
        # Kiểm tra token bắt buộc
        if not token:
            return Response({
                "success": False,
                "message": "Token là bắt buộc"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Giải mã JWT token (không verify signature)
            decoded = jwt.decode(token, options={"verify_signature": False})
            email = decoded.get("email")
            full_name = decoded.get("name", "")
            
            # Kiểm tra email hợp lệ
            if not email:
                return Response({
                    "success": False,
                    "message": "Email không hợp lệ"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Gọi service đăng nhập Google
            data = AuthService.google_login(email, full_name)

            # Nếu có lỗi, trả về lỗi
            if "error" in data:
                return Response({
                    "success": False,
                    "message": data["error"]
                }, status=status.HTTP_400_BAD_REQUEST)

            # Trả về dữ liệu đăng nhập thành công
            return Response({
                "success": True,
                "message": "Đăng nhập thành công",
                **data
            }, status=status.HTTP_200_OK)

        except jwt.DecodeError:
            logger.warning("Invalid JWT token attempted for Google login")
            return Response({
                "success": False,
                "message": "Token không hợp lệ"
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Google login error: {str(e)}")
            return Response({
                "success": False,
                "message": "Lỗi hệ thống"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# View xử lý yêu cầu đặt lại mật khẩu
class ForgotPasswordView(APIView):

    def post(self, request):
        # Lấy email từ request
        email = request.data.get("email")

        # Kiểm tra email bắt buộc
        if not email:
            return Response({
                "success": False,
                "message": "Email là bắt buộc"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Gọi service yêu cầu đặt lại mật khẩu
            data = AuthService.request_password_reset(email)

            # Nếu có lỗi, trả về lỗi
            if "error" in data:
                return Response({
                    "success": False,
                    "message": data["error"]
                }, status=status.HTTP_400_BAD_REQUEST)

            # Trả về thông báo gửi OTP thành công
            return Response({
                "success": True,
                "message": "Nếu email tồn tại, bạn sẽ nhận được mã OTP",
                **data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Forgot password error: {str(e)}")
            return Response({
                "success": False,
                "message": "Lỗi hệ thống"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# View xử lý xác nhận OTP để đặt lại mật khẩu
class VerifyResetOTPView(APIView):

    def post(self, request):
        # Lấy dữ liệu từ request
        email = request.data.get("email")
        otp = request.data.get("otp")

        # Kiểm tra dữ liệu bắt buộc
        if not email or not otp:
            return Response({
                "success": False,
                "message": "Email và OTP là bắt buộc"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Gọi service xác nhận OTP đặt lại mật khẩu
            data = AuthService.verify_otp_for_reset(email, otp)

            # Nếu có lỗi, trả về lỗi
            if "error" in data:
                return Response({
                    "success": False,
                    "message": data["error"]
                }, status=status.HTTP_400_BAD_REQUEST)

            # Trả về thông báo xác thực thành công
            return Response({
                "success": True,
                "message": "OTP xác thực thành công",
                **data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Verify reset OTP error: {str(e)}")
            return Response({
                "success": False,
                "message": "Lỗi hệ thống"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# View xử lý đặt lại mật khẩu mới
class ResetPasswordView(APIView):

    def post(self, request):
        # Lấy dữ liệu từ request
        email = request.data.get("email")
        new_password = request.data.get("new_password")

        # Kiểm tra dữ liệu bắt buộc
        if not email or not new_password:
            return Response({
                "success": False,
                "message": "Email và mật khẩu mới là bắt buộc"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Gọi service đặt lại mật khẩu
            data = AuthService.reset_password(email, new_password)

            # Nếu có lỗi, trả về lỗi
            if "error" in data:
                return Response({
                    "success": False,
                    "message": data["error"]
                }, status=status.HTTP_400_BAD_REQUEST)

            # Trả về thông báo đặt lại thành công
            return Response({
                "success": True,
                "message": data.get("message", "Mật khẩu đã được đặt lại")
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Reset password error: {str(e)}")
            return Response({
                "success": False,
                "message": "Lỗi hệ thống"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# View xử lý đăng xuất và xóa cache
class LogoutView(APIView):
    permission_classes = [IsAdminOrUser]

    def post(self, request):
        try:
            # Gọi service đăng xuất
            AuthService.logout(request.user.email)
            return Response({
                "success": True,
                "message": "Đã đăng xuất"
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")
            return Response({
                "success": False,
                "message": "Lỗi hệ thống"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

