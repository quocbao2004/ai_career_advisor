from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.career.models import Industry, Career
from apps.career.serializers import CareerSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def careers_by_industry(request, industry_id: int):

	try:
		limit_raw = request.query_params.get("limit", "20")
		try:
			limit = int(limit_raw)
		except Exception:
			limit = 20
		limit = max(1, min(50, limit))

		industry = Industry.objects.filter(id=industry_id).first()
		if not industry:
			return Response({"success": False, "message": "Không tìm thấy lĩnh vực."}, status=404)

		careers = (
			Career.objects.filter(industry_id=industry_id)
			.order_by("title", "level")
			.all()[:limit]
		)

		return Response(
			{
				"success": True,
				"industry": {"id": industry.id, "name": industry.name},
				"careers": CareerSerializer(careers, many=True).data,
			}
		)
	except Exception:
		return Response({"success": False, "message": "Lỗi hệ thống."}, status=500)
