from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.shortcuts import get_object_or_404
from .models import LearningPath, LearningPathItem
from .serializers import LearningPathSerializer, LearningPathListSerializer
from apps.ai.services.ai_service import create_learning_path_via_ai


# Lấy danh sách lộ trình của user
class LearningPathListAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Lấy tất cả lộ trình, sắp xếp theo thời gian cập nhật mới nhất
        paths = LearningPath.objects.filter(user=request.user).order_by('-updated_at')
        serializer = LearningPathListSerializer(paths, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "count": paths.count()
        })


# Tạo lộ trình mới bằng AI
class GeneratePathAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Lấy career_id từ request
        career_id = request.data.get('career_id')
        if not career_id:
            return Response({"error": "Thiếu career_id"}, status=400)
        
        # Gọi AI service để tạo lộ trình
        result = create_learning_path_via_ai(request.user, career_id)
        
        if result.get("error"):
            return Response(result, status=500)
            
        return Response(result, status=200)


# Lấy chi tiết một lộ trình
class LearningPathDetailAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        # Lấy lộ trình theo id, chỉ cho phép user sở hữu
        path_obj = get_object_or_404(LearningPath, pk=pk, user=request.user)
        serializer = LearningPathSerializer(path_obj)
        return Response(serializer.data)


# Đánh dấu hoàn thành một mục trong lộ trình
class ToggleItemStatusAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, item_id):
        # Lấy item theo id, kiểm tra quyền sở hữu
        item = get_object_or_404(LearningPathItem, pk=item_id, path__user=request.user)
        
        # Đảo trạng thái hoàn thành
        item.is_completed = not item.is_completed
        item.save()
        
        # Trả về trạng thái mới và tiến độ tổng
        return Response({
            "success": True, 
            "is_completed": item.is_completed,
            "new_progress": item.path.progress_percentage
        })