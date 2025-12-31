from django.core.mail import send_mail
from django.core.cache import cache
from django.core.mail import EmailMessage
import random
from threading import Thread

class EmailService:

    @staticmethod
    def send_otp(email):
        otp = random.randint(100000, 999999)

        def send_async():
            try:
                send_mail(
                    subject="Mã xác thực tài khoản",
                    message=f"Mã OTP của bạn là: {otp}",
                    from_email=None,
                    recipient_list=[email],
                    fail_silently=True
                )
            except Exception:
                pass

        thread = Thread(target=send_async)
        thread.daemon = True
        thread.start()

        cache.set(f"otp_{email}", otp, timeout=90)  
        return otp

    @staticmethod
    def verify_otp(email, otp):
        cached_otp = cache.get(f"otp_{email}")
        return str(cached_otp) == str(otp)

    @staticmethod
    def send_password_email(email, password):
        """Gửi email chứa mật khẩu tự động cho đăng ký Google"""
        def send_async():
            try:
                email_message = EmailMessage(
                    subject="Mật khẩu tài khoản AI Career Advisor",
                    body=f"""Xin chào,

Bạn đã đăng ký tài khoản thông qua Google. Dưới đây là mật khẩu tự động của bạn:

Mật khẩu: {password}

Vui lòng đăng nhập và đổi mật khẩu sau khi nhận được email này.

Trân trọng,
AI Career Advisor Team""",
                    from_email=None,
                    to=[email]
                )
                email_message.send(fail_silently=True)
            except Exception as e:
                pass

        thread = Thread(target=send_async)
        thread.daemon = True
        thread.start()
