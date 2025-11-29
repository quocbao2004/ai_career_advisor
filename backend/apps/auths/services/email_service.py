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
