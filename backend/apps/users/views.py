from apps.users.models import User, UserProfile, UserSkill
from apps.users.serializers import UserProfileSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from apps.users.services.test_service import HollandTestService, MBTITestService, TestResultService
from utils.permissions import IsAdminUser, IsAdminOrUser
from apps.ai.services.ai_service import get_embedding
from apps.custom_auth.services.auth_service import check_user_onboarding_status
from apps.career.models import Career, Industry


# Lấy danh sách nghề nghiệp theo lĩnh vực
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_careers_by_industry(request):
    # Lấy tham số tìm kiếm từ query params
    industry_name = (request.query_params.get('industry') or '').strip()
    industry_id = (request.query_params.get('industry_id') or '').strip()

    # Bắt buộc phải có ít nhất một tham số
    if not industry_name and not industry_id:
        return Response(
            {"success": False, "message": "Thiếu tham số industry hoặc industry_id"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        # Tìm lĩnh vực theo id hoặc tên
        if industry_id:
            industry = Industry.objects.filter(id=industry_id).first()
        else:
            industry = Industry.objects.filter(name__iexact=industry_name).first()

        if not industry:
            return Response(
                {"success": False, "message": "Không tìm thấy lĩnh vực"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Lấy danh sách nghề thuộc lĩnh vực
        qs = (
            Career.objects.filter(industry=industry)
            .order_by('title', 'level')
            .values('id', 'title', 'level')
        )

        # Chuẩn hóa dữ liệu trả về
        careers = [
            {
                "id": str(row.get('id')),
                "title": row.get('title') or '',
                "level": row.get('level'),
            }
            for row in qs
        ]

        return Response(
            {"success": True, "industry": industry.name, "careers": careers},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response(
            {"success": False, "message": "Lỗi hệ thống", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

# Khóa tài khoản người dùng (chỉ admin mới có quyền)
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
        # Không xóa hẳn, chỉ đánh dấu inactive
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

# Lấy và cập nhật thông tin hồ sơ người dùng
@api_view(['GET', 'PUT'])
@permission_classes([IsAdminOrUser])
def profile(request):
    user = request.user
    # Tạo profile mới nếu chưa có
    profile_instance, created = UserProfile.objects.get_or_create(user=user)

    # Lấy thông tin hồ sơ
    if request.method == 'GET':
        serializer = UserProfileSerializer(profile_instance)
        return Response(serializer.data)
    
    # Cập nhật hồ sơ
    elif request.method == 'PUT':
        serializer = UserProfileSerializer(profile_instance, data=request.data, partial=True)
        
        if serializer.is_valid():
            updated_profile = serializer.save()
            
            try:
                # Lấy danh sách sở thích của user
                interests_qs = user.interests.all()
                interests_str = ", ".join([i.keyword for i in interests_qs])

                # Lấy danh sách kỹ năng của user
                skills_qs = UserSkill.objects.filter(user=user)
                skills_str = ", ".join([f"{s.skill_name} (Level {s.proficiency_level}/5)" for s in skills_qs])
                
                # Tạo nội dung để tạo vector embedding
                text_content = f"""
                Job Title: {updated_profile.current_job_title or 'Unknown'}
                Education: {updated_profile.get_education_level_display() or 'Unknown'}
                Bio: {updated_profile.bio or ''}
                Skills: {skills_str} 
                Interests: {interests_str}
                MBTI: {updated_profile.mbti_result or ''}
                Holland Code: {updated_profile.holland_result or ''}
                """.strip()

                print(f"Embedding Content for {user.email}:\n{text_content}")

                # Gọi AI tạo vector embedding
                vector = get_embedding(text_content, task_type="retrieval_document")
                
                # Lưu vector vào profile
                if vector:
                    updated_profile.profile_vector = vector
                    updated_profile.save(update_fields=['profile_vector'])
                    
            except Exception as e:
                print(f"Error updating vector: {e}")

            return Response(serializer.data, status=status.HTTP_200_OK)
        
        else:
            print("Validation Error:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
# Lấy danh sách câu hỏi trắc nghiệm Holland
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_holland_test_questions(request):
    data = HollandTestService.get_questions_for_frontend()
    return Response(data)

# Lấy danh sách câu hỏi trắc nghiệm MBTI
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mbti_test_questions(request):
    questions = MBTITestService.get_questions_for_frontend()
    return Response({"questions": questions})

# Nộp bài trắc nghiệm và lưu kết quả
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_test(request):
    user = request.user
    test_type = request.data.get("test_type")
    answers = request.data.get("answers")
    
    # Kiểm tra dữ liệu bắt buộc
    if not test_type or not answers:
        return Response({"error": "Thiếu loại bài test hoặc đáp án"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        # Lưu kết quả bài test
        calc_result = TestResultService.save_test_result(user, test_type, answers)
        
        # Kiểm tra trạng thái onboarding sau khi làm xong
        has_completed = check_user_onboarding_status(user)
        
        return Response({
            "success": True,
            "result": calc_result,
            "hasCompletedOnboarding": has_completed,
        })
    except Exception as e:
        return Response({"error": f"Lỗi hệ thống: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

# Lấy kết quả bài trắc nghiệm của user
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_test_result(request):
    user = request.user
    result = TestResultService.get_user_test_profile(user)
    return Response(result)


# Kiểm tra trạng thái hoàn thành onboarding
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_onboarding_status(request):
    user = request.user
    has_completed = check_user_onboarding_status(user)
    
    return Response({
        "hasCompletedOnboarding": has_completed,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "fullName": user.full_name,
            "role": user.role
        }
    })