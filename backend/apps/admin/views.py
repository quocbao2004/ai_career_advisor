from requests import Response
from rest_framework.decorators import api_view
from rest_framework import status
from apps.admin.services.admin_services import AdminServices
from utils.permissions import admin_required

@api_view(['POST'])
@admin_required
def create_careers(request):
    try:
        result = AdminServices.create_careers(request.data)
        return Response({
            "message": "OK",
            "data": result
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({
            "message": "Lỗi dữ liệu",
            "errors": e.detail if hasattr(e, 'detail') else str(e)
        },status=status.HTTP_400_BAD_REQUEST)

