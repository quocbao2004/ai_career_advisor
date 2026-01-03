import os
import google.generativeai as genai
from django.conf import settings
from pgvector.django import CosineDistance
from apps.ai.models import KnowledgeBase, AIPromptConfig, ChatMessage
from datetime import date
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')
if api_key:
    genai.configure(api_key=api_key)

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
    if not query_embedding: return []
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

def calculate_age(born):
    """Hàm phụ để tính tuổi từ ngày sinh"""
    if not born:
        return None
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

    try:
        interests_qs = getattr(user, 'interests', None)
        if interests_qs and interests_qs.exists():
            user_interests = ", ".join([i.keyword for i in interests_qs.all()])
        else:
            user_interests = "Chưa cập nhật sở thích"
    except Exception:
        user_interests = "Chưa cập nhật"

    is_profile_missing = not (current_job and education and profile.mbti_result)

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

def get_history_message(session):
    if not session: return ""
    history_msgs = ChatMessage.objects.filter(session=session).order_by('-created_at')[:10]
    msgs = reversed(history_msgs)
    return "\n".join([f"- {'User' if m.role == 'user' else 'Advisor'}: {m.content}" for m in msgs])

def create_rag_context(prompt):
    embedding_vector = get_embedding(prompt, task_type="retrieval_query")
    if embedding_vector:
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