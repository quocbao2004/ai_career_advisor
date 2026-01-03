from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from pgvector.django import CosineDistance


@dataclass
class AdviceParams:
    paths: int = 3 #3 lộ trình
    courses_per_path: int = 6 #6 khóa học


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


def _get_user_interests(user):
    # user.interests is related_name on UserInterest
    try:
        qs = user.interests.all()
    except Exception:
        return []
    return [i.keyword for i in qs if getattr(i, "keyword", None)]


def _build_query_text(profile, skills, interests, mbti_code: str | None, holland_code: str | None, career_title: str | None = None):
    education = None
    try:
        education = profile.get_education_level_display() if profile.education_level else None
    except Exception:
        education = profile.education_level

    skills_str = ", ".join(
        [f"{s['skill_name']} (Level {s['proficiency_level']}/5)" for s in (skills or [])]
    )

    interests_str = ", ".join([str(i) for i in (interests or [])])

    parts = [
        f"Job Title: {profile.current_job_title or ''}",
        f"Education: {education or ''}",
        f"Skills: {skills_str}",
        f"Interests: {interests_str}",
        f"MBTI: {mbti_code or ''}",
        f"Holland: {holland_code or ''}",
    ]
    if career_title:
        parts.insert(0, f"Career Target: {career_title}")

    return "\n".join([p for p in parts if p is not None]).strip()


def _generate_careers_with_ai(industry_name: str, user_profile: dict, num_to_generate: int = 4):
    if num_to_generate <= 0:
        return []

    prompt = f"""
Dựa trên hồ sơ người dùng và lĩnh vực "{industry_name}", hãy gợi ý {num_to_generate} ngành nghề phù hợp.

Hồ sơ người dùng:
- Tên: {user_profile.get('full_name', '')}
- Công việc hiện tại: {user_profile.get('current_job_title', '')}
- Trình độ học vấn: {user_profile.get('education_level', '')}
- Kỹ năng: {', '.join([s['skill_name'] for s in user_profile.get('skills', [])])}
- Sở thích: {', '.join(user_profile.get('interests', []))}
- MBTI: {user_profile.get('mbti_result', '')}
- Holland: {user_profile.get('holland_result', '')}

Yêu cầu:
- Gợi ý {num_to_generate} ngành nghề trong lĩnh vực {industry_name}.
- Mỗi ngành nghề bao gồm: title (tên ngành), level (entry/mid/senior), description (mô tả ngắn gọn).
- Trả về CHỈ mảng JSON, không có text nào khác: [{{"title": "Tên ngành", "level": "entry", "description": "Mô tả"}}]
- Đảm bảo JSON hợp lệ.
"""

    try:
        import google.generativeai as genai
        from apps.ai.services.ai_service import get_active_config

        config = get_active_config()
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config={"temperature": config.temperature}
        )
        response = model.generate_content(prompt)
        if response and response.text:
            import json
            text = response.text.strip()
            # Loại bỏ markdown code blocks nếu có
            if text.startswith('```json'):
                text = text[7:]
            if text.startswith('```'):
                text = text[3:]
            if text.endswith('```'):
                text = text[:-3]
            text = text.strip()
            careers_data = json.loads(text)
            if isinstance(careers_data, list):
                return careers_data
    except Exception as e:
        print(f"Error generating careers with AI: {e}")

    return []


def _recommend_courses_for_path(profile, skills, interests, mbti_code: str | None, holland_code: str | None, career_title: str, limit: int):
    from apps.ai.services.ai_service import get_embedding
    from apps.career.models import Course

    query_text = _build_query_text(profile, skills, interests, mbti_code, holland_code, career_title=career_title)

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


def generate_learning_paths_for_chat(user, params: AdviceParams = None):
    """Generate 3 learning paths JSON for chat UI (button format)"""
    if params is None:
        params = AdviceParams()

    import google.generativeai as genai
    from apps.ai.services.ai_service import get_active_config

    profile = _get_or_create_profile(user)
    skills = _get_user_skills(user)
    interests = _get_user_interests(user)

    mbti_code = (getattr(profile, "mbti_result", None) or "").strip().upper() or None
    holland_code = (getattr(profile, "holland_result", None) or "").strip().upper() or None
    full_name = (getattr(user, "full_name", None) or "").strip()

    # Validate minimal prerequisites
    missing_fields = []
    if not full_name:
        missing_fields.append("full_name")
    if not getattr(profile, "current_job_title", None):
        missing_fields.append("current_job_title")
    if not getattr(profile, "education_level", None):
        missing_fields.append("education_level")
    if not skills:
        missing_fields.append("skills")
    if not interests:
        missing_fields.append("interests")

    has_any_test = bool(mbti_code or holland_code)
    if not has_any_test:
        missing_fields.append("test_result")

    if missing_fields:
        labels = {
            "full_name": "Họ và tên",
            "current_job_title": "Công việc hiện tại",
            "education_level": "Trình độ học vấn",
            "skills": "Kỹ năng",
            "interests": "Sở thích",
            "test_result": "Kết quả trắc nghiệm (MBTI hoặc Holland)",
        }
        readable = [labels.get(f, f) for f in missing_fields]
        return {
            "success": False,
            "message": "Thiếu thông tin để tạo lộ trình. Bạn đang thiếu: " + ", ".join(readable) + ".",
            "missing_fields": missing_fields,
            "missing_fields_readable": readable,
        }

    # Build user context for Gemini
    education = None
    try:
        education = profile.get_education_level_display() if profile.education_level else None
    except Exception:
        education = profile.education_level

    user_context = f"""
Thông tin người dùng:
- Tên: {full_name}
- Công việc: {profile.current_job_title}
- Trình độ: {education}
- Kỹ năng: {', '.join([s['skill_name'] for s in skills])}
- Sở thích: {', '.join(interests)}
- MBTI: {mbti_code or 'Chưa test'}
- Holland: {holland_code or 'Chưa test'}
"""

    prompt = f"""{user_context}

Dựa trên thông tin trên, hãy tạo CHÍNH XÁC 3 lộ trình học tập cá nhân hóa (3 hướng phát triển KHÁC NHAU rõ ràng).

FORMAT JSON BẮTBUỘC (Không có text khác ngoài JSON):
{{
  "learning_path_order": ["path_1", "path_2", "path_3"],
  "learning_paths": {{
    "path_1": {{
      "title": "Tiêu đề lộ trình 1",
      "short_description": "Mô tả ngắn tối đa 20 từ cho button",
      "target_audience": "Đối tượng phù hợp",
      "detail": {{
        "goal": "Mục tiêu chi tiết của lộ trình",
        "estimated_duration": "Thời gian ước tính (vd: 3 tháng)",
        "level": "beginner",
        "steps": [
          {{
            "step_order": 1,
            "title": "Tiêu đề bước 1",
            "content": ["Nội dung 1", "Nội dung 2"]
          }},
          {{
            "step_order": 2,
            "title": "Tiêu đề bước 2",
            "content": ["Nội dung 1", "Nội dung 2"]
          }}
        ]
      }}
    }},
    "path_2": {{
      "title": "Tiêu đề lộ trình 2",
      "short_description": "Mô tả ngắn tối đa 20 từ cho button",
      "target_audience": "Đối tượng phù hợp",
      "detail": {{
        "goal": "Mục tiêu chi tiết của lộ trình",
        "estimated_duration": "Thời gian ước tính",
        "level": "intermediate",
        "steps": [
          {{
            "step_order": 1,
            "title": "Tiêu đề bước 1",
            "content": ["Nội dung 1", "Nội dung 2"]
          }},
          {{
            "step_order": 2,
            "title": "Tiêu đề bước 2",
            "content": ["Nội dung 1", "Nội dung 2"]
          }}
        ]
      }}
    }},
    "path_3": {{
      "title": "Tiêu đề lộ trình 3",
      "short_description": "Mô tả ngắn tối đa 20 từ cho button",
      "target_audience": "Đối tượng phù hợp",
      "detail": {{
        "goal": "Mục tiêu chi tiết của lộ trình",
        "estimated_duration": "Thời gian ước tính",
        "level": "advanced",
        "steps": [
          {{
            "step_order": 1,
            "title": "Tiêu đề bước 1",
            "content": ["Nội dung 1", "Nội dung 2"]
          }},
          {{
            "step_order": 2,
            "title": "Tiêu đề bước 2",
            "content": ["Nội dung 1", "Nội dung 2"]
          }}
        ]
      }}
    }}
  }}
}}

YÊU CẦU:
- Title mỗi lộ trình phải ngắn gọn theo format: "Lộ trình ngành <tên ngành>" (không dài dòng).
- Tạo ĐÚNG 3 lộ trình khác nhau và độc lập (không được giống nhau).
- Mỗi lộ trình phải là 1 hướng phát triển khác nhau (ví dụ: Data/Automation, Web Backend, AI/ML... tùy hồ sơ).
- Mỗi lộ trình phải có tổng thời gian (estimated_duration) và phải chia thành 3-5 giai đoạn (steps).
- Mỗi giai đoạn (step) phải gồm các ý trong content:
    - "Thời lượng giai đoạn: ..."
    - "Mục tiêu giai đoạn: ..."
    - "Học gì: ..." (cụ thể)
    - "Làm gì: ..." (bài tập/dự án/đầu ra cụ thể)
    - "Từ khóa khóa học: ..." (để tìm khóa học phù hợp)
- short_description phải dưới 20 từ (dùng làm text button).
- Tuân thủ CHÍNH XÁC format JSON trên.
- CHỈ trả về JSON, không có text, markdown hay ký tự nào khác.
"""

    try:
        config = get_active_config()
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config={"temperature": config.temperature}
        )
        response = model.generate_content(prompt)

        if response and response.text:
            import json
            text = response.text.strip()

            # Remove markdown code blocks
            if text.startswith('```json'):
                text = text[7:]
            if text.startswith('```'):
                text = text[3:]
            if text.endswith('```'):
                text = text[:-3]
            text = text.strip()

            result = json.loads(text)

            if isinstance(result, dict) and isinstance(result.get("learning_paths"), dict):
                def _normalize_title(raw_title: str | None) -> str:
                    title = (raw_title or "").strip()
                    if not title:
                        return "Lộ trình ngành Công nghệ"

                    lower = title.lower()
                    if "lộ trình ngành" in lower or "lo trinh nganh" in lower:
                        # Keep as-is but trim excessive length
                        title = title.replace("  ", " ").strip()
                    else:
                        # Remove common boilerplate words
                        cleaned = title
                        for w in [
                            "Lộ trình", "lộ trình", "Lo trinh", "lo trinh",
                            "học", "Hoc", "career", "Career",
                            "cho", "về", "ngành", "Nganh",
                            ":", "-", "|",
                        ]:
                            cleaned = cleaned.replace(w, " ")
                        cleaned = " ".join(cleaned.split())
                        focus_words = cleaned.split()[:4]
                        focus = " ".join(focus_words).strip()
                        if not focus:
                            focus = "Công nghệ"
                        title = f"Lộ trình ngành {focus}"

                    # Hard cap length to keep button clean
                    if len(title) > 40:
                        title = title[:40].rstrip() + "…"
                    return title

                # Ensure the order is valid and limited
                learning_paths = result.get("learning_paths") or {}
                order = result.get("learning_path_order")
                if not isinstance(order, list):
                    order = []

                normalized_order = []
                for key in order:
                    if isinstance(key, str) and key in learning_paths and key not in normalized_order:
                        normalized_order.append(key)

                if not normalized_order:
                    normalized_order = list(learning_paths.keys())

                normalized_order = normalized_order[: _clamp(params.paths, 2, 3)]
                result["learning_path_order"] = normalized_order

                # Inject 5–6 DB courses per path into the existing phases (do not overwrite phases)
                courses_limit = _clamp(getattr(params, "courses_per_path", 6), 3, 10)
                for path_id in normalized_order:
                    path = learning_paths.get(path_id)
                    if not isinstance(path, dict):
                        continue

                    normalized_title = _normalize_title(path.get("title"))
                    path["title"] = normalized_title
                    # Ensure button label is short (UI uses short_description first)
                    path["short_description"] = normalized_title

                    path_title = normalized_title
                    path.setdefault("detail", {})
                    detail = path.get("detail")
                    if not isinstance(detail, dict):
                        continue

                    steps = detail.get("steps")
                    if not isinstance(steps, list) or len(steps) == 0:
                        steps = [
                            {"step_order": 1, "title": "Giai đoạn 1", "content": []},
                            {"step_order": 2, "title": "Giai đoạn 2", "content": []},
                            {"step_order": 3, "title": "Giai đoạn 3", "content": []},
                        ]
                        detail["steps"] = steps

                    # Distribute courses across phases
                    n_steps = max(1, len(steps))
                    base = courses_limit // n_steps
                    rem = courses_limit % n_steps
                    per_step = [(base + (1 if i < rem else 0)) for i in range(n_steps)]

                    used_course_ids: set[int] = set()

                    for idx, step in enumerate(steps):
                        if not isinstance(step, dict):
                            continue
                        need = per_step[idx] if idx < len(per_step) else 0
                        if need <= 0:
                            continue

                        step_title = (step.get("title") or "").strip() or f"Giai đoạn {idx + 1}"
                        content = step.get("content")
                        if not isinstance(content, list):
                            content = []
                            step["content"] = content

                        content_text = " ; ".join([str(x) for x in content if x is not None])
                        query_hint = f"{path_title} | {step_title} | {content_text}".strip()

                        # Ask for more than needed to allow de-dup
                        candidates = _recommend_courses_for_path(
                            profile=profile,
                            skills=skills,
                            interests=interests,
                            mbti_code=mbti_code,
                            holland_code=holland_code,
                            career_title=query_hint,
                            limit=max(need * 4, 8),
                        )

                        chosen = []
                        for item in candidates:
                            course = (item or {}).get("course") or {}
                            cid = course.get("id")
                            if not isinstance(cid, int) or cid in used_course_ids:
                                continue
                            used_course_ids.add(cid)
                            chosen.append(course)
                            if len(chosen) >= need:
                                break

                        if chosen:
                            content.append("Khóa học gợi ý (từ DB):")

                        for c in chosen:
                            title = (c.get("title") or "").strip() or "(Không có tiêu đề)"
                            provider = c.get("provider")
                            url = c.get("url")
                            extra = []
                            if provider:
                                extra.append(str(provider))
                            level = c.get("level")
                            if level:
                                extra.append(str(level))
                            suffix = f" ({' • '.join(extra)})" if extra else ""
                            if url:
                                content.append(f"- {title}{suffix} — {url}")
                            else:
                                content.append(f"- {title}{suffix}")

                return {
                    "success": True,
                    "data": result,
                }
    except Exception as e:
        print(f"Error generating learning paths: {e}")
        import traceback
        traceback.print_exc()

    return {
        "success": False,
        "message": "Không thể tạo lộ trình. Vui lòng thử lại."
    }
