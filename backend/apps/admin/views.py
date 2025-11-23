from requests import Response
from rest_framework.decorators import api_view
from rest_framework import status
from apps.admin.services.admin_services import AdminServices
from utils.permissions import admin_required


@api_view(['GET'])
@admin_required
def dashboard_stats(request):
    return Response({
        "message": "data bí mât của admin"
    },status=status.HTTP_200_OK)
    # try:
    #     admin_service = AdminServices()
    #     data = admin_service.get_dashboard_stats()
    #     return Response({
    #         "message": "Dashboard data retrieved successfully.",
    #         "data": data
    #     }, status=status.HTTP_200_OK)
    # except Exception as e:
    #     return Response({
    #         "message": str(e)
    #     }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
