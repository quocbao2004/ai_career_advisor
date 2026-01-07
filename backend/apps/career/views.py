from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from apps.ai.services.ai_service import (
    suggest_industries_via_ai,
    recommend_careers_in_industry,
    save_user_career_choice
)

# API gợi ý ngành nghề dựa trên MBTI và Holland
class IndustrySuggestionAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Lấy thông tin user
        user = request.user
        
        # Kiểm tra có profile không
        if not hasattr(user, 'profile'):
            return Response(
                {"error": "Vui lòng cập nhật hồ sơ cá nhân trước."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Kiểm tra đã hoàn thành test MBTI và Holland chưa
        if not user.profile.mbti_result or not user.profile.holland_result:
            return Response(
                {"error": "Bạn cần hoàn thành bài test MBTI và Holland trước khi nhận gợi ý."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Gọi AI để gợi ý ngành nghề
        suggestions = suggest_industries_via_ai(user)

        # Nếu không có gợi ý, trả về no content
        if not suggestions:
            return Response(
                {"message": "AI chưa tìm thấy ngành phù hợp hoặc có lỗi xảy ra."},
                status=status.HTTP_204_NO_CONTENT
            )

        # Trả về danh sách gợi ý
        return Response({
            "success": True,
            "data": suggestions
        }, status=status.HTTP_200_OK)


# API khuyến nghị nghề nghiệp trong ngành cụ thể
class CareerRecommendationAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Lấy industry_id từ query params
        industry_id = request.query_params.get('industry_id')
        
        # Kiểm tra tham số bắt buộc
        if not industry_id:
            return Response(
                {"error": "Thiếu tham số industry_id."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Gọi service khuyến nghị nghề nghiệp
        careers = recommend_careers_in_industry(request.user, industry_id)

        # Trả về danh sách nghề nghiệp
        return Response({
            "success": True,
            "industry_id": industry_id,
            "data": careers
        }, status=status.HTTP_200_OK)


# API chọn nghề nghiệp và lưu lộ trình
class SelectCareerAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Lấy career_id từ request data
        career_id = request.data.get('career_id')
        
        # Kiểm tra tham số bắt buộc
        if not career_id:
            return Response(
                {"error": "Thiếu career_id."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Gọi service lưu lựa chọn nghề nghiệp
        result = save_user_career_choice(request.user, career_id)

        # Nếu lưu thành công, trả về thông tin
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