from apps.users.models import User
from django.core.cache import cache


class AuthRepository:
    @staticmethod
    def get_user_by_email(email: str):
        cache_key = f"user_{email}"
        user = cache.get(cache_key)
        
        if user is None:
            try:
                user = User.objects.get(email=email)
                cache.set(cache_key, user, timeout=300)
            except User.DoesNotExist:
                return None
        
        return user

    @staticmethod
    def create_user(email: str, password: str, full_name: str, **extra_fields):
        if User.objects.filter(email=email).exists():
            return None, "Email đã được đăng ký"
        
        try:
            user = User.objects.create_user(
                email=email,
                password=password if password else None,
                full_name=full_name,
                **extra_fields
            )
            cache.set(f"user_{email}", user, timeout=300)
            return user, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def user_exists(email: str) -> bool:
        cache_key = f"user_{email}"
        if cache.get(cache_key):
            return True
        return User.objects.filter(email=email).exists()

