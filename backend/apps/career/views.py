from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.career.models import Industry, Career
from apps.career.serializers import CareerSerializer
from apps.ai.services.career_advice_service import _generate_careers_with_ai, _get_or_create_profile, _get_user_skills, _get_user_interests


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

		careers_db = list(
			Career.objects.filter(industry_id=industry_id)
			.order_by("title", "level")
			.all()[:limit]
		)

		careers_data = CareerSerializer(careers_db, many=True).data

		# Nếu ít hơn 4 careers từ DB, sinh thêm bằng AI
		if len(careers_data) < 4:
			num_to_generate = 4 - len(careers_data)
			user = request.user
			profile = _get_or_create_profile(user)
			skills = _get_user_skills(user)
			interests = _get_user_interests(user)
			mbti_code = (getattr(profile, "mbti_result", None) or "").strip().upper() or None
			holland_code = (getattr(profile, "holland_result", None) or "").strip().upper() or None

			user_profile = {
				"full_name": getattr(user, "full_name", ""),
				"current_job_title": profile.current_job_title,
				"education_level": profile.education_level,
				"skills": skills,
				"interests": interests,
				"mbti_result": mbti_code,
				"holland_result": holland_code,
			}

			ai_careers = _generate_careers_with_ai(industry.name, user_profile, num_to_generate)
			# Thêm careers từ AI, đánh dấu là generated
			for ai_career in ai_careers:
				careers_data.append({
					"id": None,  # Không có ID vì không trong DB
					"title": ai_career.get("title", ""),
					"level": ai_career.get("level", "entry"),
					"description": ai_career.get("description", ""),
					"industry": {"id": industry.id, "name": industry.name},
					"is_generated": True,  # Đánh dấu là từ AI
				})

		return Response(
			{
				"success": True,
				"industry": {"id": industry.id, "name": industry.name},
				"careers": careers_data,
			}
		)
	except Exception as e:
		print(f"Error in careers_by_industry: {e}")
		return Response({"success": False, "message": "Lỗi hệ thống."}, status=500)
