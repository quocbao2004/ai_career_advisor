from django.urls import path
from apps.users import views

urlpatterns = [
    path('', views.delete_user),
    path('profile/', views.profile),
]