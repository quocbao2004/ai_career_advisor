from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from django.db.models import Count
from pgvector.django import CosineDistance


@dataclass
class AdviceParams:
    paths: int = 3
    courses_per_path: int = 6


def _safe_int(value: Any, default: int) -> int:
    try:
        return int(value)
    except Exception:
        return default


def _clamp(value: int, min_value: int, max_value: int) -> int:
    return max(min_value, min(max_value, value))


def _get_or_create_profile(user):
    from apps.users.models import UserProfile

    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile


def _get_user_skills(user):
    from apps.users.models import UserSkill

    qs = UserSkill.objects.filter(user=user).order_by("-proficiency_level", "skill_name")
    return [
        {
            "skill_name": s.skill_name,
            "proficiency_level": int(s.proficiency_level or 0),
        }
        for s in qs
    ]


def _build_query_text(profile, skills, mbti_code: str | None, holland_code: str | None, career_title: str | None = None):
    education = None
    try:
        education = profile.get_education_level_display() if profile.education_level else None
    except Exception:
        education = profile.education_level

    skills_str = ", ".join(
        [f"{s['skill_name']} (Level {s['proficiency_level']}/5)" for s in (skills or [])]
    )

    parts = [
        f"Job Title: {profile.current_job_title or ''}",
        f"Education: {education or ''}",
        f"Skills: {skills_str}",
        f"MBTI: {mbti_code or ''}",
        f"Holland: {holland_code or ''}",
    ]
    if career_title:
        parts.insert(0, f"Career Target: {career_title}")

    return "\n".join([p for p in parts if p is not None]).strip()


def _cosine_similarity_from_distance(distance: float | None) -> float:
    if distance is None:
        return 0.0
    # CosineDistance in pgvector typically ranges [0, 2].
    # Convert to a rough similarity in [0, 1].
    try:
        sim = 1.0 - float(distance)
    except Exception:
        return 0.0
    return max(0.0, min(1.0, sim))


def _recommend_careers(user, profile, skills, mbti_code: str | None, holland_code: str | None, limit: int):
    from apps.career.models import Career, Industry
    from apps.users.services.test_service import TestResultService

    industries = TestResultService._recommend_industries_from_db(
        mbti_code=mbti_code,
        holland_code=holland_code,
        limit=4,
    )

    industry_ids = [row.get("id") for row in industries if row.get("id")]
    if not industry_ids:
        return [], []

    industry_map = {
        i.id: {"id": i.id, "name": i.name}
        for i in Industry.objects.filter(id__in=industry_ids).only("id", "name")
    }

    profile_vector = getattr(profile, "profile_vector", None)

    # Pull careers in recommended industries.
    careers_qs = (
        Career.objects.filter(industry_id__in=industry_ids)
        .select_related("industry")
        .annotate(industry_career_count=Count("id"))
    )

    if profile_vector is not None:
        careers_qs = careers_qs.annotate(distance=CosineDistance("embedding", profile_vector))

    candidates = []
    for c in careers_qs:
        # Base weight by industry rank
        try:
            industry_rank = industry_ids.index(c.industry_id)
        except ValueError:
            industry_rank = 3
        industry_weight = max(0.0, 1.0 - (industry_rank * 0.2))

        similarity = 0.0
        if profile_vector is not None and getattr(c, "distance", None) is not None:
            similarity = _cosine_similarity_from_distance(getattr(c, "distance", None))

        score = (industry_weight * 0.6) + (similarity * 0.4)

        candidates.append(
            (
                score,
                {
                    "id": c.id,
                    "title": c.title,
                    "level": c.level,
                    "industry": industry_map.get(c.industry_id)
                    or {"id": c.industry_id, "name": getattr(c.industry, "name", None)},
                },
            )
        )

    candidates.sort(key=lambda x: (-x[0], x[1].get("title") or ""))
    recommended = [row for _, row in candidates[:limit]]

    return industries, recommended


def _recommend_courses_for_path(profile, skills, mbti_code: str | None, holland_code: str | None, career_title: str, limit: int):
    from apps.ai.services.ai_service import get_embedding
    from apps.career.models import Course

    query_text = _build_query_text(profile, skills, mbti_code, holland_code, career_title=career_title)

    vector = getattr(profile, "profile_vector", None)
    if vector is None:
        # Best-effort: compute query embedding (if API key configured)
        vector = get_embedding(query_text, task_type="retrieval_query")

    qs = Course.objects.all()
    if vector is not None:
        try:
            qs = qs.annotate(distance=CosineDistance("embedding", vector)).order_by("distance")
        except Exception:
            qs = qs.order_by("-created_at")
    else:
        qs = qs.order_by("-created_at")

    courses = []
    for idx, c in enumerate(qs[:limit], start=1):
        courses.append(
            {
                "order": idx,
                "course": {
                    "id": c.id,
                    "title": c.title,
                    "provider": c.provider,
                    "level": c.level,
                    "duration_hours": c.duration_hours,
                    "price": str(c.price) if c.price is not None else None,
                    "url": c.url,
                    "description": c.description,
                },
            }
        )

    return courses


def get_ai_advice_payload(user, params: AdviceParams):
    profile = _get_or_create_profile(user)
    skills = _get_user_skills(user)

    mbti_code = (getattr(profile, "mbti_result", None) or "").strip().upper() or None
    holland_code = (getattr(profile, "holland_result", None) or "").strip().upper() or None

    # Validate minimal prerequisites
    missing_profile_fields = []
    if not getattr(profile, "current_job_title", None):
        missing_profile_fields.append("current_job_title")
    if not getattr(profile, "education_level", None):
        missing_profile_fields.append("education_level")

    has_any_test = bool(mbti_code or holland_code)

    if missing_profile_fields or not has_any_test:
        return {
            "success": False,
            "message": "Thiếu thông tin để AI tư vấn. Vui lòng cập nhật hồ sơ và hoàn thành ít nhất 1 bài test.",
            "missing": {
                "profile_fields": missing_profile_fields,
                "needs_test": not has_any_test,
            },
        }

    industries, careers = _recommend_careers(
        user=user,
        profile=profile,
        skills=skills,
        mbti_code=mbti_code,
        holland_code=holland_code,
        limit=_clamp(params.paths, 2, 3),
    )

    # Ensure 2-3 learning paths
    max_paths = _clamp(params.paths, 2, 3)
    careers = careers[:max_paths]

    learning_paths = []
    for idx, career in enumerate(careers, start=1):
        career_title = career.get("title") or ""
        courses = _recommend_courses_for_path(
            profile=profile,
            skills=skills,
            mbti_code=mbti_code,
            holland_code=holland_code,
            career_title=career_title,
            limit=_clamp(params.courses_per_path, 3, 10),
        )

        learning_paths.append(
            {
                "key": f"path_{idx}",
                "title": f"Lộ trình cho {career_title}",
                "career": career,
                "summary": "Lộ trình học được gợi ý dựa trên hồ sơ, kỹ năng và kết quả test của bạn.",
                "steps": courses,
            }
        )

    return {
        "success": True,
        "profile": {
            "current_job_title": profile.current_job_title,
            "education_level": profile.education_level,
            "mbti_result": mbti_code,
            "holland_result": holland_code,
            "skills": skills,
        },
        "recommended_industries": industries,
        "recommended_careers": careers,
        "learning_paths": learning_paths,
    }
