from django.urls import path

from .views import careers_by_industry

urlpatterns = [
    path("industries/<int:industry_id>/careers/", careers_by_industry, name="careers-by-industry"),
]
