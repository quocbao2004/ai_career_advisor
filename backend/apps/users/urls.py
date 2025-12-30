from django.urls import path
from .views import (
    delete_user,
    profile,
    get_holland_test_questions,
    get_mbti_test_questions,
    submit_test,
    get_test_result
)

urlpatterns = [
    path('delete/', delete_user, name='delete-user'),
    path('profile/', profile, name='user-profile'),
    path('test/holland/questions/', get_holland_test_questions, name='holland-test-questions'),
    path('test/mbti/questions/', get_mbti_test_questions, name='mbti-test-questions'),
    path('test/submit/', submit_test, name='submit-test'),
    path('test/result/', get_test_result, name='get-test-result'),
]