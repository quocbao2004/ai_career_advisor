from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.exceptions import ValidationError

from apps.ai.services.ai_service import (
    suggest_industries_via_ai,
    recommend_careers_in_industry,
    save_user_career_choice
)
from apps.career.models import CareerRecommendation

class IndustrySuggestionAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        if not hasattr(user, 'profile'):
            return Response(
                {"error": "Vui lòng cập nhật hồ sơ cá nhân trước."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.profile.mbti_result or not user.profile.holland_result:
            return Response(
                {"error": "Bạn cần hoàn thành bài test MBTI và Holland trước khi nhận gợi ý."},
                status=status.HTTP_400_BAD_REQUEST
            )

        suggestions = suggest_industries_via_ai(user)

        if not suggestions:
            return Response(
                {"message": "AI chưa tìm thấy ngành phù hợp hoặc có lỗi xảy ra."},
                status=status.HTTP_204_NO_CONTENT
            )

        return Response({
            "success": True,
            "data": suggestions
        }, status=status.HTTP_200_OK)


class CareerRecommendationAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        industry_id = request.query_params.get('industry_id')
        
        if not industry_id:
            return Response(
                {"error": "Thiếu tham số industry_id."},
                status=status.HTTP_400_BAD_REQUEST
            )

        careers = recommend_careers_in_industry(request.user, industry_id)

        return Response({
            "success": True,
            "industry_id": industry_id,
            "data": careers
        }, status=status.HTTP_200_OK)


class SelectCareerAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        career_id = request.data.get('career_id')
        
        if not career_id:
            return Response(
                {"error": "Thiếu career_id."},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = save_user_career_choice(request.user, career_id)

        if result:
            return Response({
                "success": True,
                "message": f"Đã lưu lộ trình với nghề: {result.career.title}",
                "recommendation_id": result.id
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {"error": "Không tìm thấy nghề nghiệp hoặc lỗi hệ thống."},
                status=status.HTTP_400_BAD_REQUEST
            )