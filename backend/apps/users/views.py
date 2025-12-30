from apps.users.models import User, UserProfile
from apps.users.serializers import UserSerializer, UserProfileSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from utils.permissions import IsAdminUser, IsAdminOrUser
from apps.ai.ai_service import get_embedding

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
    
    elif request.method == 'PUT':
        print(2)
        serializer = UserProfileSerializer(profile_instance, data=request.data, partial=True)
        print(2)
        
        if serializer.is_valid():
            updated_profile = serializer.save()
            try:
                interests_qs = user.interests.all()
                print(1)
                interests_str = ", ".join([i.keyword for i in interests_qs])
                print(1)                
                text_content = f"""
                Job Title: {updated_profile.current_job_title or 'Unknown'}
                Education: {updated_profile.get_education_level_display() or 'Unknown'}
                Bio: {updated_profile.bio or ''}
                MBTI: {updated_profile.mbti_result or ''}
                Holland: {updated_profile.holland_result or ''}
                Interests: {interests_str}
                """.strip()
                print(1)  
                vector = get_embedding(text_content, task_type="retrieval_document")
                if vector:
                    updated_profile.profile_vector = vector
                    updated_profile.save(update_fields=['profile_vector'])
                    print(f"Updated vector for user {user.email}")
            except Exception as e:
                print(f"Error updating vector: {e}")
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)