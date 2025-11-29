from django.urls import path
from apps.admin import views

urlpatterns = [
    path('/admin/careers', views.create_careers),
]