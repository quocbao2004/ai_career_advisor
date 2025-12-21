from django.urls import path
from apps.users import views

urlpatterns = [
    # Profile-related endpoints removed per request
    # Keep only administrative user endpoints
    path('', views.delete_user),
    # path('master-skills', views.get_and_post_master_skill)
]