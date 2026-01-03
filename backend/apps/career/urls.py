from django.urls import path
from apps.career.views import (
    IndustrySuggestionAPI, 
    CareerRecommendationAPI, 
    SelectCareerAPI
)

urlpatterns = [
    path('suggest-industries/', IndustrySuggestionAPI.as_view(), name='ai_suggest_industries'),
    path('recommend-careers/', CareerRecommendationAPI.as_view(), name='ai_recommend_careers'),
    path('select-career/', SelectCareerAPI.as_view(), name='ai_select_career'),
]