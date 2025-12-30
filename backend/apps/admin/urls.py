from django.urls import path
from apps.admin import views

urlpatterns = [
    path('users/', views.get_users),
    path('courses/', views.course_list_create),
    path('import-data/', views.import_data),
    path('courses/<int:id>/', views.edit_courses),
    path('careers/', views.career_list_create, name='career-list-create'),
    path('careers/<int:id>/', views.delete_or_edit_career),
    path('industries/', views.get_or_post_industry),
    path('industries/<int:id>/', views.delete_or_edit_industry),
    path('dashboard/stats/', views.get_dashboard_stats),
]