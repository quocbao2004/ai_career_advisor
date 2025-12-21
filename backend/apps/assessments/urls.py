from django.urls import path
from apps.assessments import views

app_name = 'assessments'

urlpatterns = [
    # Lấy danh sách câu hỏi
    path('questions/<str:assessment_type>/', views.AssessmentQuestionsView.as_view(), name='get_questions'),
    
    # Submit câu trả lời
    path('submit/', views.AssessmentSubmitView.as_view(), name='submit_assessment'),
    
    # Lấy chi tiết kết quả
    path('results/<uuid:result_id>/', views.AssessmentResultDetailView.as_view(), name='get_result_detail'),
    
    # Lấy lịch sử trắc nghiệm
    path('history/', views.AssessmentHistoryView.as_view(), name='assessment_history'),
    
    # Lấy hồ sơ trắc nghiệm
    path('profile/', views.UserAssessmentProfileView.as_view(), name='assessment_profile'),
    
    # Lưu vào hồ sơ cá nhân
    path('save-to-profile/', views.SaveAssessmentToProfileView.as_view(), name='save_to_profile'),
]
