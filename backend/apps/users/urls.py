from django.urls import path
from .views import (
    delete_user,
    profile,
    get_holland_test_questions,
    get_mbti_test_questions,
    submit_test,
    get_test_result,
    check_onboarding_status,
    get_careers_by_industry,
)

urlpatterns = [
    path('delete/', delete_user, name='delete-user'),
    path('profile/', profile, name='user-profile'),
    path('onboarding/status/', check_onboarding_status, name='check-onboarding-status'),
    path('test/holland/questions/', get_holland_test_questions, name='holland-test-questions'),
    path('test/mbti/questions/', get_mbti_test_questions, name='mbti-test-questions'),
    path('test/submit/', submit_test, name='submit-test'),
    path('test/result/', get_test_result, name='get-test-result'),
    path('careers/by-industry/', get_careers_by_industry, name='careers-by-industry'),
]