from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from .models import LearningPath, LearningPathItem
from .serializers import LearningPathSerializer
from apps.ai.services.ai_service import create_learning_path_via_ai

class GeneratePathAPI(APIView):
    """ Tạo lộ trình mới (Trigger từ nút 'Tạo lộ trình' ở FE) """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        career_id = request.data.get('career_id')
        if not career_id:
            return Response({"error": "Thiếu career_id"}, status=400)
            
        result = create_learning_path_via_ai(request.user, career_id)
        
        if result.get("error"):
            return Response(result, status=500)
            
        return Response(result, status=200)

class LearningPathDetailAPI(APIView):
    """ Lấy chi tiết lộ trình để hiển thị Tree """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        path_obj = get_object_or_404(LearningPath, pk=pk, user=request.user)
        serializer = LearningPathSerializer(path_obj)
        return Response(serializer.data)

class ToggleItemStatusAPI(APIView):
    """ User tick vào checkbox hoàn thành """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, item_id):
        item = get_object_or_404(LearningPathItem, pk=item_id, path__user=request.user)
        
        item.is_completed = not item.is_completed
        item.save()
        
        return Response({
            "success": True, 
            "is_completed": item.is_completed,
            "new_progress": item.path.progress_percentage
        })