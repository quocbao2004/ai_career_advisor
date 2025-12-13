from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from utils.permissions import IsAdminUser, IsAdminOrUser
from apps.users.models import User, MasterSkill
from apps.courses.models import Course
from apps.career.models import Career, Industry
from apps.users.serializers import UserSerializer, MasterSkillSerializer
from apps.courses.serializers import CourseSerializer
from apps.career.serializers import IndustrySerializer, CareerSerializer
from rest_framework.response import Response
from django.db import transaction

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_users(request):
    try:
        users = User.objects.get_all_users()
        serializer = UserSerializer(users, many=True)
        return Response({
            "message": "Lấy danh sách thành công",
            "data": serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            "message": "Lỗi hệ thống",
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET', 'POST'])
@permission_classes([IsAdminOrUser])
def course_list_create(request):
    try:
        if request.method == 'GET':
            courses = Course.objects.all()
            serializer = CourseSerializer(courses, many=True)
            return Response({
                "message": "Lấy danh sách thành công",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        elif request.method == 'POST':
            serializer = CourseSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "message": "Tạo khóa học thành công",
                    "data": serializer.data
                }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            "message": "Lỗi hệ thống",
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['DELETE', 'PUT'])
@permission_classes([IsAdminOrUser])
def edit_courses(request, id):
    try:
        course = Course.objects.get(id=id)
        if request.method == 'DELETE':
            if not id:
                return Response({
                    "message": "Không tìm thấy id",
                }, status=status.HTTP_400_BAD_REQUEST)
            if not course:
                return Response({
                    "message": "ID không hợp lệ",
                }, status=status.HTTP_400_BAD_REQUEST)
            result = course.delete()
            return Response({
                "message": "OK"
            },status=status.HTTP_200_OK)
        elif request.method == 'PUT':
            serializer = CourseSerializer(course, data=request.data)

            if serializer.is_valid():
                serializer.save()
                return Response({
                    "message": "Sửa khóa học thành công",
                    "data": serializer.data
                }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            "message": "Lỗi hệ thống",
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def import_data(request):
    try:
        model_name = request.data.get('model')
        data = request.data.get('data')
        if not data or not isinstance(data, list):
            return Response({
                "message": "Dữ liệu không hợp lệ hoặc rỗng."
            }, status=status.HTTP_400_BAD_REQUEST)
        serializer_map = {
            'industries': IndustrySerializer,
            'careers': CareerSerializer,
            'courses': CourseSerializer,
            'master_skills': MasterSkillSerializer
        }
        TargetSerializer = serializer_map.get(model_name)
        if not TargetSerializer:
            return Response({
                "message": f"Model {model_name} Không được hỗ trợ"
            }, status=status.HTTP_400_BAD_REQUEST)
        clean_data = []
        for item in data:
            if model_name == 'industries':
                data_item = {
                    "name": item.get("name"),
                    "description": item.get("description")
                }
            elif model_name == 'careers':
                data_item = {
                    "title": item.get("title") or item.get("Tên nghề nghiệp"),
                    "level": item.get("level") or item.get("Cấp bậc"),
                    "description": item.get("description") or item.get("Mô tả"),
                    "salary_min": item.get("salary_min") or item.get("Lương tối thiểu"),
                    "salary_max": item.get("salary_max") or item.get("Lương tối đa"),
                    "industry": item.get("industry_id") or item.get("ID Ngành") 
                }
            elif model_name == 'courses':
                data_item = {
                    "title": item.get("title"),
                    "provider": item.get("provider") ,
                    "description": item.get("description"),
                    "url": item.get("url"),
                    "price": item.get("price"),
                    "duration_hours": item.get("duration_hours"),
                    "level": item.get("level"),
                }
            elif model_name == 'master_skills':
                data_item = {
                    "skill_name": item.get("skill_name"),
                    "type": item.get("type"),
                    "description": item.get("description")
                }
            else:
                continue

            clean_data.append(data_item)
        with transaction.atomic():
            serializer = TargetSerializer(data=clean_data, many=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "message": "Import thành công!", 
                    "count": len(clean_data),
                    "data": serializer.data
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    "message": "Dữ liệu không hợp lệ",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            "message": "Đã xảy ra lỗi khi import dữ liệu",
            "error": str(e)
        },status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET', 'POST'])
@permission_classes([IsAdminOrUser])
def get_and_post_master_skill(request):
    try:
        if request.method == 'GET':
            master_skills = MasterSkill.objects.all()
            serializer = MasterSkillSerializer(master_skills, many=True)
            return Response({
                    "message": "Lấy danh sách thành công",
                    "data": serializer.data
                },status=status.HTTP_200_OK)
        if request.method == 'POST':
            serializer = MasterSkillSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "message": "OK",
                    "data": serializer.data
                },status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            "error": str(e),
            "message": "Lỗi hệ thống"
        },status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE', 'PUT'])
@permission_classes([IsAdminUser])
def delete_or_put_master_skill(request, id):
    try:
        master_skill = MasterSkill.objects.get(id=id)
        if not master_skill:
            return Response({
                "message": "ID not found"
            },status=status.HTTP_400_BAD_REQUEST)
        if request.method == 'DELETE':
            result = master_skill.delete()
            return Response({
                "message": "OK"
            },status=status.HTTP_200_OK)
        elif request.method == 'PUT':
            serializer = MasterSkillSerializer(master_skill, data=request.data)
            if serializer.is_valid():
                result = serializer.save()
                return Response({
                    "message": "OK"
                }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            "error": str(e),
            "message": "Da xay ra loi"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET', 'POST'])
@permission_classes([IsAdminOrUser])
def career_list_create(request):
    try:
        if request.method == 'GET':
            careers = Career.objects.all()
            
            serializer = CareerSerializer(careers, many=True)
            
            return Response({
                "message": "Lấy danh sách nghề nghiệp thành công",
                "count": careers.count(),
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        
        elif request.method == 'POST':
            serializer = CareerSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "message": "Tạo nghề nghiệp mới thành công",
                    "data": serializer.data
                }, status=status.HTTP_201_CREATED)
            
            return Response({
                "message": "Dữ liệu không hợp lệ",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({
            "message": "Lỗi hệ thống",
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
@permission_classes([IsAdminOrUser])
def get_industries(request):
    """
    API lấy danh sách Industry để hiển thị Select Box
    """
    try:
        industries = Industry.objects.all().order_by('name')
        
        serializer = IndustrySerializer(industries, many=True)
        
        return Response({
            "message": "Lấy danh sách ngành thành công",
            "count": industries.count(),
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            "message": "Lỗi hệ thống",
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)