from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from apps.users.services.test_service import HollandTestService, MBTITestService, TestResultService
from utils.permissions import IsAdminUser, IsAdminOrUser
from apps.users.models import User
from apps.users.serializers import UserProfileSerializer

@api_view(['DELETE'])
@permission_classes([IsAdminUser])  
def delete_user(request):
    id=request.data.get('id')
    if not id:
        return Response(
            {"success": False, "message": "Vui lòng cung cấp ID người dùng"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    try:
        user=User.objects.get(id=id)
        user.is_active=False
        user.save()
        return Response(
            {"message": f"Đã khóa tài khoản {user.email}"}, 
            status=status.HTTP_200_OK
        )
    except User.DoesNotExist:
        return Response(
            {"success": False, "message": "Người dùng không tồn tại"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"success": False, "message": "Lỗi hệ thống", "error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET', 'PUT'])
@permission_classes([IsAdminOrUser])
def profile(request):
    try:
        user = request.user
    except Exception:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_holland_test_questions(request):
    questions = HollandTestService.get_questions_for_frontend()
    return Response({"questions": questions})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mbti_test_questions(request):
    questions = MBTITestService.get_questions_for_frontend()
    return Response({"questions": questions})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_test(request):
    user = request.user
    test_type = request.data.get("test_type")
    answers = request.data.get("answers")
    if not test_type or not answers:
        return Response({"error": "Thiếu loại bài test hoặc đáp án"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        profile = TestResultService.save_test_result(user, test_type, answers)
        result_code = profile.mbti_result if test_type.upper() == "MBTI" else profile.holland_result
        return Response({"success": True, "result_code": result_code})
    except Exception as e:
        return Response({"error": f"Lỗi hệ thống: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_test_result(request):
    user = request.user
    result = TestResultService.get_user_test_profile(user)
    return Response(result)