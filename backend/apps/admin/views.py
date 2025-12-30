from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from utils.permissions import IsAdminUser, IsAdminOrUser
from apps.users.models import User
from apps.career.models import Career, Industry, Course


from apps.users.serializers import UserSerializer
from apps.career.serializers import IndustrySerializer, CareerSerializer, CourseSerializer


from rest_framework.response import Response
from django.db import transaction
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count

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
            courses = Course.objects.all().order_by('-created_at')
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
            else:
                first_error_list = next(iter(serializer.errors.values()))
                error_message = first_error_list[0]
                return Response({
                    "message": error_message
                }, status=status.HTTP_400_BAD_REQUEST)
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
    

@api_view(['DELETE', 'PUT'])
@permission_classes([IsAdminUser])
def delete_or_edit_career(request, id):

    try:
        career = Career.objects.get(id=id)


        if not career:

            return Response({
                "message": "Không tìm thấy career này!"

            }, status= status.HTTP_404_NOT_FOUND)
        
        if request.method == 'DELETE':
            career.delete()

            return Response({
                "message": "OK"
            }, status=status.HTTP_200_OK)
        elif request.method == 'PUT':
            serializer = CareerSerializer(career, data=request.data)


            if serializer.is_valid():
                serializer.save()
                return Response({
                    "message": "OK"
                }, status=status.HTTP_200_OK)
            else:
                first_error_list = next(iter(serializer.errors.values()))
                error_message = first_error_list[0]
                return Response({
                    "message": error_message
                }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({
            "message": "Lỗi hệ thống",
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET', 'POST'])
@permission_classes([IsAdminOrUser])
def get_or_post_industry(request):
    if request.method == 'GET':
        industries = Industry.objects.all().order_by('-created_at')
        serializer = IndustrySerializer(industries, many=True)
        
        return Response({
            "message": "Lấy danh sách ngành thành công",
            "count": industries.count(),
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = IndustrySerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Tạo ngành nghề thành công",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
            
        return Response({
            "message": "Dữ liệu không hợp lệ",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['PUT', 'DELETE'])
@permission_classes([IsAdminOrUser])
def delete_or_edit_industry(request, id):
    industry = Industry.objects.get(id=id)

    if not industry:
        return Response({
            "message": f"Không tìm thấy ngành nghề với ID {id}"
        }, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'PUT':
        serializer = IndustrySerializer(industry, data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Cập nhật thành công",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
            
        first_error = next(iter(serializer.errors.values()))[0]
        return Response({
            "message": first_error,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        industry.delete()
        return Response({
            "message": "Đã xóa ngành nghề thành công"
        }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_dashboard_stats(request):
    try:
        now = timezone.now()
        seven_days_ago = now - timedelta(days=7)

        # -- Số liệu Cards --
        stats = {
            "total_users": User.objects.count(),
            # SỬA: date_joined -> created_at
            "new_users_7d": User.objects.filter(created_at__gte=seven_days_ago).count(),
            "total_careers": Career.objects.count(),
            "total_industries": Industry.objects.count(),
            "total_courses": Course.objects.count(),
            "total_cvs": 0 
        }

        # -- Số liệu Biểu đồ (Group by Month) --
        chart_query = (
            # SỬA: date_joined -> created_at
            User.objects.filter(created_at__year=now.year)
            .annotate(month=TruncMonth('created_at')) 
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )

        monthly_counts = [0] * 12
        for entry in chart_query:
            if entry['month']:
                month_idx = entry['month'].month - 1
                monthly_counts[month_idx] = entry['count']

        return Response({
            "cards": stats,
            "chart": {
                "labels": ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
                "data": monthly_counts
            }
        })
    except Exception as e:
        print(f"Error dashboard stats: {e}")
        return Response({"message": str(e)}, status=500)