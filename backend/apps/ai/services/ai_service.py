import os, re
import json
import google.generativeai as genai
from django.conf import settings
from django.db.models import F
from pgvector.django import CosineDistance
from apps.ai.models import KnowledgeBase, AIPromptConfig, ChatMessage
from apps.career.models import Industry, Career, CareerRecommendation
from apps.learning_paths.models import LearningPath, LearningPathItem, PathStatus
from datetime import date
from dotenv import load_dotenv

# --- SETUP ---
load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')
if api_key:
    genai.configure(api_key=api_key)

# ==========================================
# 1. CORE AI HELPERS (Embedding & Gemini)
# ==========================================

def get_embedding(text, task_type="retrieval_query"):
    if not text: return None
    text = text.replace("\n", " ").strip()
    try:
        # Nếu là lưu vào DB thì dùng task_type='retrieval_document'
        # Nếu là query search thì dùng task_type='retrieval_query'
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type=task_type
        )
        return result['embedding']
    except Exception as e:
        print(f"Error embedding: {e}")
        return None

def search_vector_db(query_embedding, top_k=5):
    if query_embedding is None: return [] # Fix lỗi numpy ở đây nếu có
    try:
        results = KnowledgeBase.objects.annotate(
            distance=CosineDistance('embedding', query_embedding)
        ).order_by('distance')[:top_k]
        
        return [doc.content_text for doc in results if doc.distance < 0.6]
    except Exception as e:
        print(f"Error search vector db: {e}")
        return []

def call_gemini_with_config(full_prompt, model_key="gemini-2.5-flash"):
    config = get_active_config()
    try:
        model = genai.GenerativeModel(
            model_name=model_key,
            generation_config={"temperature": config.temperature}
        )
        response = model.generate_content(full_prompt)
        return response
    except Exception as e:
        print(f"Gemini Error: {e}")
        return None

def get_active_config():
    config = AIPromptConfig.objects.filter(is_active=True).first()
    if config: return config
    
    class DefaultConfig:
        temperature = 0.7
        role_description = "Bạn là AI Career Advisor."
        missing_profile_template = "User thiếu hồ sơ: {user_profile_context}. Chat: {chat_history_text}. User: {prompt}"
        standard_prompt_template = "Vai trò: {role_description}. Context: {rag_context}. Chat: {chat_history_text}. User: {prompt}"
    return DefaultConfig()

# ==========================================
# 2. USER PROFILE HELPERS
# ==========================================

def calculate_age(born):
    if not born: return None
    today = date.today()
    return today.year - born.year - ((today.month, today.day) < (born.month, born.day))

def get_info_user(user):
    try:
        profile = getattr(user, 'profile', None)
    except Exception:
        profile = None

    if profile:
        current_job = profile.current_job_title
        education = profile.education_level
        gender = profile.get_gender_display() if profile.gender else "Chưa cập nhật"
        
        age = calculate_age(profile.dob)
        age_str = f"{age} tuổi" if age else "Chưa cập nhật ngày sinh"
        
        bio = profile.bio or "Chưa có giới thiệu bản thân"
        mbti = profile.mbti_result or "Chưa test"
        holland = profile.holland_result or "Chưa test"
        linkedin = profile.linkedin_url or "N/A"
    else:
        current_job = education = None
        gender = age_str = bio = mbti = holland = linkedin = "Chưa cập nhật"

    # Lấy Skills
    try:
        skills_qs = getattr(user, 'skills', None)
        if skills_qs and skills_qs.exists():
            user_skills = ", ".join([
                f"{s.skill_name} (Lv.{s.proficiency_level}/5)" 
                for s in skills_qs.all()
            ])
        else:
            user_skills = "Chưa cập nhật kỹ năng"
    except Exception:
        user_skills = "Chưa cập nhật"

    # Lấy Interests
    try:
        interests_qs = getattr(user, 'interests', None)
        if interests_qs and interests_qs.exists():
            user_interests = ", ".join([i.keyword for i in interests_qs.all()])
        else:
            user_interests = "Chưa cập nhật sở thích"
    except Exception:
        user_interests = "Chưa cập nhật"

    is_profile_missing = not (current_job and education and profile and profile.mbti_result)

    user_profile_context = f"""
    THÔNG TIN CÁ NHÂN:
    - Họ tên: {user.full_name or 'Bạn'}
    - Giới tính: {gender}
    - Tuổi: {age_str}
    - Giới thiệu (Bio): {bio}
    - LinkedIn: {linkedin}

    NGHỀ NGHIỆP & HỌC VẤN:
    - Công việc hiện tại: {current_job or 'Chưa cập nhật'}
    - Trình độ học vấn: {education or 'Chưa cập nhật'}
    
    KẾT QUẢ TRẮC NGHIỆM TÍNH CÁCH:
    - MBTI: {mbti}
    - Holland Code: {holland}

    KỸ NĂNG & SỞ THÍCH:
    - Kỹ năng chuyên môn: {user_skills}
    - Sở thích/Quan tâm: {user_interests}
    """
    
    return user_profile_context, is_profile_missing, current_job

# ==========================================
# 3. CHAT HELPERS
# ==========================================

def get_history_message(session):
    if not session: return ""
    history_msgs = ChatMessage.objects.filter(session=session).order_by('-created_at')[:10]
    msgs = reversed(history_msgs)
    return "\n".join([f"- {'User' if m.role == 'user' else 'Advisor'}: {m.content}" for m in msgs])

def create_rag_context(prompt):
    embedding_vector = get_embedding(prompt, task_type="retrieval_query")
    if embedding_vector is not None: # Fix check numpy
        rag_docs = search_vector_db(embedding_vector, 5)
        if rag_docs:
            return "\n".join([f"- {doc}" for doc in rag_docs])
    return ""

def create_full_prompt_chat(prompt, session, user):
    user_profile_context, is_profile_missing, current_job = get_info_user(user)
    chat_history_text = get_history_message(session)
    rag_context = create_rag_context(prompt) if len(prompt) > 5 else ""
    config = get_active_config()
    
    params = {
        "role_description": config.role_description,
        "user_profile_context": user_profile_context,
        "chat_history_text": chat_history_text,
        "prompt": prompt,
        "rag_context": rag_context if rag_context else "Không có dữ liệu chuyên môn cụ thể.",
        "current_job": current_job if current_job else "N/A"
    }

    template = config.missing_profile_template if is_profile_missing else config.standard_prompt_template
    
    try:
        return template.format(**params)
    except KeyError as e:
        return f"{template} \n\n [Lỗi hệ thống: Template thiếu biến {e}. Nội dung kèm theo: {params}]"

def suggest_industries_via_ai(user):
    """
    Bước 1: Gợi ý Industry dựa trên MBTI & Holland của User.
    """
    try:
        profile = getattr(user, 'profile', None)
        if not profile: return {"error": "Không tìm thấy User Profile."}

        mbti = profile.mbti_result
        holland = profile.holland_result
        if not mbti or not holland:
            return {"error": "User chưa có kết quả MBTI hoặc Holland."}
    except Exception:
        return {"error": "Lỗi truy xuất dữ liệu profile."}

    industries = Industry.objects.all().values('id', 'name', 'description')
    industries_list = list(industries)
    industries_text = json.dumps(industries_list, ensure_ascii=False)

    prompt = f"""
    Đóng vai là một Chuyên gia Tư vấn Hướng nghiệp AI.
    
    DỮ LIỆU USER:
    - MBTI: {mbti}
    - Holland Code (RIASEC): {holland}
    - Bio: {profile.bio}

    DANH SÁCH LĨNH VỰC (INDUSTRIES):
    {industries_text}

    YÊU CẦU:
    1. Chọn ra 3-5 Lĩnh vực phù hợp nhất.
    2. Match Score (0-100).
    3. Giải thích ngắn gọn (reasoning).

    OUTPUT FORMAT (JSON thuần):
    [
        {{
            "industry_id": <id>,
            "industry_name": "<name>",
            "match_score": <int>,
            "reasoning": "<string>"
        }}
    ]
    """

    try:
        response = call_gemini_with_config(prompt, model_key="gemini-2.5-flash")
        if response and response.text:
            clean_json = response.text.replace("```json", "").replace("```", "").strip()
            suggestions = json.loads(clean_json)
            suggestions.sort(key=lambda x: x.get('match_score', 0), reverse=True)
            return suggestions
    except Exception as e:
        print(f"Error suggesting industries: {e}")
        return []
    
    return []


def recommend_careers_in_industry(user, industry_id):
    """
    Bước 2: Gợi ý Careers trong Industry bằng Vector Search.
    """
    try:
        industry = Industry.objects.get(id=industry_id)
    except Industry.DoesNotExist:
        return []

    user_vector = user.profile.profile_vector

    if user_vector is None:
        bio_text = f"{user.profile.bio or ''} {user.profile.current_job_title or ''} {user.profile.mbti_result or ''}"
        user_vector = get_embedding(bio_text)
        
        if user_vector is not None:
            user.profile.profile_vector = user_vector
            user.profile.save()

    if user_vector is None:
        careers = Career.objects.filter(industry=industry)[:10]
        results = []
        for c in careers:
            results.append({
                "id": c.id,
                "title": c.title,
                "level": c.level,
                "salary_range": f"{c.salary_min or 0} - {c.salary_max or 'Thỏa thuận'}",
                "match_score": 0,
                "description": c.description
            })
        return results
    
    raw_careers = Career.objects.filter(
        industry=industry
    ).annotate(
        distance=CosineDistance('embedding', user_vector)
    ).order_by('distance')[:50]

    results = []
    seen_titles = set()

    for career in raw_careers:
        title_key = career.title.strip()

        if title_key in seen_titles:
            continue

        seen_titles.add(title_key)

        dist = career.distance if career.distance is not None else 1
        score = max(0, (1 - dist) * 100)
        
        results.append({
            "id": career.id,
            "title": career.title,
            "level": career.level,
            "salary_range": f"{career.salary_min or 0} - {career.salary_max or 'Thỏa thuận'}",
            "match_score": round(score, 1),
            "description": career.description
        })

        if len(results) >= 10:
            break
    
    return results

def save_user_career_choice(user, career_id, reasoning="User selected"):

    try:
        career = Career.objects.get(id=career_id)
        
        match_score = 0
        if user.profile.profile_vector is not None and career.embedding is not None:
            match_score = 80 
            
        rec, created = CareerRecommendation.objects.update_or_create(
            user=user,
            career=career,
            defaults={
                'match_score': match_score,
                'reasoning': reasoning
            }
        )
        return rec
    except Exception as e:
        print(f"Error saving career choice: {e}")
        return None


def create_learning_path_via_ai(user, career_id):
    try:
        career = Career.objects.get(id=career_id)
    except Career.DoesNotExist:
        return {"error": "Nghề nghiệp không tồn tại"}

    existing_path = LearningPath.objects.filter(
        user=user, 
        career=career, 
        status=PathStatus.IN_PROGRESS
    ).first()
    
    if existing_path:
        return {
            "success": True, 
            "path_id": existing_path.id, 
            "message": "Lộ trình đã tồn tại"
        }

    prompt = f"""
    Bạn là một Mentor IT chuyên nghiệp.
    Hãy thiết kế một lộ trình học tập chi tiết (Learning Path) cho vị trí: {career.title}.
    Trình độ hiện tại của User: {user.profile.education_level or 'Người mới bắt đầu'}.
    
    YÊU CẦU:
    - Chia làm 10-15 bước nhỏ (Step).
    - Sắp xếp từ cơ bản đến nâng cao.
    - Output phải là JSON Array chuẩn. Không thêm lời dẫn, không markdown thừa.

    OUTPUT JSON FORMAT:
    [
        {{
            "step_name": "Tên bước (Ví dụ: Học Python cơ bản)",
            "description": "Mô tả ngắn gọn nội dung (Ví dụ: Biến, vòng lặp, hàm...)"
        }}
    ]
    """

    response = call_gemini_with_config(prompt, model_key="gemini-2.5-flash")
    
    if not response or not response.text:
        return {"error": "AI không phản hồi hoặc phản hồi rỗng."}

    try:
        match = re.search(r'\[.*\]', response.text, re.DOTALL)
        
        if match:
            clean_json = match.group(0)
        else:
            clean_json = response.text.replace("```json", "").replace("```", "").strip()

        steps = json.loads(clean_json)

        if not steps:
            return {"error": "AI trả về danh sách rỗng."}
        new_path = LearningPath.objects.create(
            user=user,
            career=career,
            title=f"Lộ trình: {career.title}",
            status=PathStatus.IN_PROGRESS
        )

        items_to_create = []
        for idx, step in enumerate(steps):
            items_to_create.append(LearningPathItem(
                path=new_path,
                custom_task_name=step.get('step_name', 'Task không tên'),
                order_index=idx + 1,
                is_completed=False
            ))
        
        LearningPathItem.objects.bulk_create(items_to_create)
        
        return {"success": True, "path_id": new_path.id}

    except json.JSONDecodeError as e:
        return {"error": "Lỗi đọc dữ liệu từ AI (Format không hợp lệ)."}
        
    except Exception as e:
        print(f"General Error creating roadmap: {e}")
        return {"error": f"Lỗi hệ thống: {str(e)}"}