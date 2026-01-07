from django.urls import path
from .views import GeneratePathAPI, LearningPathDetailAPI, ToggleItemStatusAPI, LearningPathListAPI

urlpatterns = [
    # 0. API Lấy danh sách lộ trình của user
    # Endpoint: GET /api/learning/paths/
    path('paths/', LearningPathListAPI.as_view(), name='learning_path_list'),

    # 1. API Tạo lộ trình mới (Trigger từ nút 'Tạo lộ trình' ở FE)
    # Endpoint: POST /api/learning/generate/
    path('generate/', GeneratePathAPI.as_view(), name='generate_learning_path'),

    # 2. API Lấy chi tiết lộ trình (Hiển thị Tree)
    # Endpoint: GET /api/learning/paths/<uuid>/
    path('paths/<uuid:pk>/', LearningPathDetailAPI.as_view(), name='learning_path_detail'),

    # 3. API Tick hoàn thành task
    # Endpoint: POST /api/learning/items/<id>/toggle/
    path('items/<int:item_id>/toggle/', ToggleItemStatusAPI.as_view(), name='toggle_path_item'),
]