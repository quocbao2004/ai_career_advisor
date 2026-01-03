from django.urls import path
from . import views


urlpatterns = [
    # chat
    path('chat/sessions/', views.get_chat_sessions, name='get_chat_sessions'),
    path('chat/sessions/<uuid:session_id>/messages/', views.get_session_messages, name='get_session_messages'),
    path('chat/message/', views.chat_message, name='chat_message'),
    path('chat/sessions/<uuid:session_id>/', views.manage_session, name='manage_session'),

    path('admin/ai-configs/', views.ai_config),
    path('admin/ai-configs/<int:pk>/activate/', views.activate_ai_config, name='ai_config_activate'),
]