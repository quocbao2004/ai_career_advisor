from django.urls import path
from apps.ai import views

urlpatterns = [
    path('chat/', views.chat),
]