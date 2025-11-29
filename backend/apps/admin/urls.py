from django.urls import path
from apps.admin import views

urlpatterns = [
    path('dashboard-stats/',views.dashboard_stats),
]