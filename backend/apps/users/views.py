from apps.users.models import User, UserProfile, UserSkill
from apps.users.serializers import UserProfileSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from apps.users.services.test_service import HollandTestService, MBTITestService, TestResultService
from utils.permissions import IsAdminUser, IsAdminOrUser
from apps.ai.services.ai_service import get_embedding

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
    user = request.user
    profile_instance, created = UserProfile.objects.get_or_create(user=user)

    # --- METHOD GET ---
    if request.method == 'GET':
        serializer = UserProfileSerializer(profile_instance)
        return Response(serializer.data)
    
    # --- METHOD PUT ---
    elif request.method == 'PUT':
        serializer = UserProfileSerializer(profile_instance, data=request.data, partial=True)
        
        if serializer.is_valid():
            updated_profile = serializer.save()
            
            # === LOGIC TẠO EMBEDDING (RAG) ===
            try:
                # 1. Lấy chuỗi sở thích
                interests_qs = user.interests.all()
                interests_str = ", ".join([i.keyword for i in interests_qs])

                # 2. Lấy chuỗi Kỹ năng (MỚI THÊM)
                skills_qs = UserSkill.objects.filter(user=user)
                skills_str = ", ".join([f"{s.skill_name} (Level {s.proficiency_level}/5)" for s in skills_qs])
                
                # 3. Tạo nội dung để embed
                text_content = f"""
                Job Title: {updated_profile.current_job_title or 'Unknown'}
                Education: {updated_profile.get_education_level_display() or 'Unknown'}
                Bio: {updated_profile.bio or ''}
                Skills: {skills_str} 
                Interests: {interests_str}
                MBTI: {updated_profile.mbti_result or ''}
                Holland Code: {updated_profile.holland_result or ''}
                """.strip()

                print(f"Embedding Content for {user.email}:\n{text_content}") # Debug xem nội dung đúng chưa

                # 4. Gọi AI tạo Vector
                vector = get_embedding(text_content, task_type="retrieval_document")
                
                if vector:
                    updated_profile.profile_vector = vector
                    updated_profile.save(update_fields=['profile_vector'])
                    print(f"Updated vector for user {user.email}")
                    
            except Exception as e:
                print(f"Error updating vector: {e}")

            return Response(serializer.data, status=status.HTTP_200_OK)
        
        else:
            print("Validation Error:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_holland_test_questions(request):
    data = HollandTestService.get_questions_for_frontend()
    return Response(data)

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
        calc_result = TestResultService.save_test_result(user, test_type, answers)
        return Response({"success": True, "result": calc_result})
    except Exception as e:
        return Response({"error": f"Lỗi hệ thống: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_test_result(request):
    user = request.user
    result = TestResultService.get_user_test_profile(user)
    return Response(result)