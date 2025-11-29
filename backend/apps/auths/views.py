from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from auths.services.auth_service import AuthService
import jwt
import logging

logger = logging.getLogger(__name__)


class LoginView(APIView):

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response({
                "success": False,
                "message": "Email và mật khẩu là bắt buộc"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            data, error = AuthService.login(email, password)

            if error:
                return Response({
                    "success": False,
                    "message": error
                }, status=status.HTTP_400_BAD_REQUEST)

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


class RegisterView(APIView):

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        full_name = request.data.get("full_name")

        if not email or not password or not full_name:
            return Response({
                "success": False,
                "message": "Email, mật khẩu và tên là bắt buộc"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            data, error = AuthService.register(email, password, full_name)

            if error:
                return Response({
                    "success": False,
                    "message": error
                }, status=status.HTTP_400_BAD_REQUEST)

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


class VerifyOTPView(APIView):

    def post(self, request):
        email = request.data.get("email")
        otp = request.data.get("otp")

        if not email or not otp:
            return Response({
                "success": False,
                "message": "Email và OTP là bắt buộc"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            data, error = AuthService.verify_otp_and_complete_register(email, otp)

            if error:
                return Response({
                    "success": False,
                    "message": error
                }, status=status.HTTP_400_BAD_REQUEST)

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


class ResendOTPView(APIView):

    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response({
                "success": False,
                "message": "Email là bắt buộc"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            data, error = AuthService.resend_otp(email)

            if error:
                return Response({
                    "success": False,
                    "message": error
                }, status=status.HTTP_400_BAD_REQUEST)

            return Response({
                "success": True,
                "message": "OTP mới đã được gửi"
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Resend OTP error: {str(e)}")
            return Response({
                "success": False,
                "message": "Lỗi hệ thống"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GoogleLoginView(APIView):

    def post(self, request):
        token = request.data.get("token")
        
        if not token:
            return Response({
                "success": False,
                "message": "Token là bắt buộc"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded = jwt.decode(token, options={"verify_signature": False})
            
            email = decoded.get("email")
            full_name = decoded.get("name", "")
            
            if not email:
                return Response({
                    "success": False,
                    "message": "Email không hợp lệ"
                }, status=status.HTTP_400_BAD_REQUEST)

            data, error = AuthService.google_login(email, full_name)

            if error:
                return Response({
                    "success": False,
                    "message": error
                }, status=status.HTTP_400_BAD_REQUEST)

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

