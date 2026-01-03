from apps.users.models import User, UserProfile
from typing import Optional, Dict, Any

class TestRepository:
    "Repository để quản lý kết quả trắc nghiệm trong UserProfile"

    @staticmethod
    def save_test(user: User, test_type: str, summary_code: str, raw_result: Dict[str, Any]) -> UserProfile:
        profile, _ = UserProfile.objects.get_or_create(user=user)
        if test_type.upper() == 'MBTI':
            profile.mbti_result = summary_code
        elif test_type.upper() == 'HOLLAND':
            profile.holland_result = summary_code
        profile.save()
        return profile

    @staticmethod
    def get_test(user: User, test_type: str) -> Optional[str]:
        try:
            profile, created = UserProfile.objects.get_or_create(user=user)
            if test_type.upper() == 'MBTI':
                return profile.mbti_result
            elif test_type.upper() == 'HOLLAND':
                return profile.holland_result
        except Exception:
            return None

    @staticmethod
    def clear_test(user: User, test_type: str) -> bool:
        try:
            profile, created = UserProfile.objects.get_or_create(user=user)
            if test_type.upper() == 'MBTI':
                profile.mbti_result = None
            elif test_type.upper() == 'HOLLAND':
                profile.holland_result = None
            profile.save()
            return True
        except Exception:
            return False