
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from apps.career.models import Career, Industry, MasterSkill
from apps.courses.models import Course
from apps.users.models import PersonalityTest
import json

from apps.ai.models import KnowledgeBase

from apps.ai.ai_service import get_embedding

User = get_user_model()

# =======================================================
# HÀM DÙNG CHUNG ĐỂ XỬ LÝ LOGIC EMBEDDING
# =======================================================
def sync_embedding(instance, content_type, text_content, metadata):
    """Hàm này chịu trách nhiệm gọi AI và lưu vào DB"""
    try:
        vector = get_embedding(text_content)
        
        if vector:
            KnowledgeBase.objects.update_or_create(
                reference_id=str(instance.id),
                content_type=content_type,
                defaults={
                    'content_text': text_content,
                    'embedding': vector,
                    'metadata': metadata
                }
            )
            print(f" Auto-Sync: Đã cập nhật vector cho {content_type} ID: {instance.id}")
    except Exception as e:
        print(f" Auto-Sync Error: {e}")

# =======================================================
# 1. XỬ LÝ CAREER (NGHỀ NGHIỆP)
# =======================================================
@receiver(post_save, sender=Career)
def update_career_vector(sender, instance, **kwargs):
    industry_name = instance.industry.name if instance.industry else "Chưa phân loại"
    salary_info = f"từ {instance.salary_min:,.0f} đến {instance.salary_max:,.0f}" if instance.salary_min else "thỏa thuận"

    content = (
        f"Vị trí công việc: {instance.title} ({instance.level}). "
        f"Thuộc ngành: {industry_name}. "
        f"Mức lương: {salary_info}. "
        f"Mô tả chi tiết: {instance.description}"
    )
    
    metadata = {
        "title": instance.title,
        "level": instance.level,
        "salary_min": str(instance.salary_min) if instance.salary_min else None,
        "salary_max": str(instance.salary_max) if instance.salary_max else None
    }
    
    sync_embedding(instance, 'career', content, metadata)

# =======================================================
# 2. XỬ LÝ COURSE (KHÓA HỌC)
# =======================================================
@receiver(post_save, sender=Course)
def update_course_vector(sender, instance, **kwargs):
    content = (
        f"Khóa học: {instance.title}. "
        f"Cung cấp bởi: {instance.provider}. "
        f"Giá: {instance.price}. "
        f"Nội dung: {instance.description}"
    )
    metadata = {"title": instance.title, "url": instance.url}
    
    sync_embedding(instance, 'course', content, metadata)

# =======================================================
# 3. XỬ LÝ INDUSTRY (NGÀNH NGHỀ)
# =======================================================
@receiver(post_save, sender=Industry)
def update_industry_vector(sender, instance, **kwargs):
    content = f"Ngành nghề: {instance.name}. Mô tả: {instance.description}"
    metadata = {"name": instance.name}
    
    sync_embedding(instance, 'industry', content, metadata)

# =======================================================
# 4. XỬ LÝ SKILL (KỸ NĂNG)
# =======================================================
@receiver(post_save, sender=MasterSkill)
def update_skill_vector(sender, instance, **kwargs):
    content = f"Kỹ năng: {instance.skill_name}. Loại: {instance.type}. Mô tả: {instance.description}"
    metadata = {"name": instance.skill_name}
    
    sync_embedding(instance, 'skill', content, metadata)

# =======================================================
# 5. XỬ LÝ USER PROFILE (Chỉ user active mới embed)
# =======================================================
@receiver(post_save, sender=User)
def update_user_vector(sender, instance, **kwargs):
    if not instance.is_active:
        # Nếu user bị disable, xóa vector
        KnowledgeBase.objects.filter(reference_id=str(instance.id), content_type='user_profile').delete()
        return

    content = (
        f"Hồ sơ người dùng: {instance.full_name}. "
        f"Vai trò: {instance.role}. "
        f"Công việc: {instance.current_job_title}. "
        f"Học vấn: {instance.education_level}. "
        f"Bio: {instance.bio}."
    )
    
    metadata = {
        "user_id": str(instance.id),
        "role": instance.role,
        "full_name": instance.full_name
    }
    
    sync_embedding(instance, 'user_profile', content, metadata)

# =======================================================
#  XỬ LÝ Bài test
# =======================================================
@receiver(post_save, sender=PersonalityTest)
def update_personality_vector(sender, instance, created, **kwargs):
    """
    Khi user làm bài test xong, đẩy kết quả vào Vector DB.
    """
    user = instance.user
    
    # 1. Xử lý JSON raw_result thành văn bản đọc được
    # Giả sử raw_result lưu: {"strengths": "Tư duy logic", "weaknesses": "Ít nói"}
    details_text = ""
    if instance.raw_result:
        # Cách đơn giản: Flatten JSON thành chuỗi
        if isinstance(instance.raw_result, dict):
             details_text = "; ".join([f"{k}: {v}" for k, v in instance.raw_result.items()])
        else:
             details_text = str(instance.raw_result)

    # 2. Tạo nội dung cho AI đọc (Embedding Content)
    content = (
        f"Kết quả bài trắc nghiệm tính cách ({instance.test_type}) của {user.full_name}. "
        f"Kết quả tóm tắt: {instance.summary_code}. " # Ví dụ: INTJ
        f"Chi tiết phân tích: {details_text}. "
        f"Ngày thực hiện: {instance.taken_at.strftime('%d/%m/%Y')}."
    )
    
    # 3. Metadata để lọc nếu cần
    metadata = {
        "user_id": str(user.id),
        "test_type": instance.test_type,
        "summary_code": instance.summary_code
    }
    
    # 4. Gọi hàm sync (Lưu ý: dùng content_type khác để phân biệt với profile chính)
    sync_embedding(instance, 'personality_result', content, metadata)


# =======================================================
# 6. XỬ LÝ XÓA (DELETE) - DÙNG CHUNG
# =======================================================
@receiver(post_delete, sender=Career)
@receiver(post_delete, sender=Course)
@receiver(post_delete, sender=Industry)
@receiver(post_delete, sender=MasterSkill)
@receiver(post_delete, sender=User)
@receiver(post_delete, sender=PersonalityTest)
def delete_vector(sender, instance, **kwargs):
    """
    Khi xóa dữ liệu gốc, tự động xóa luôn vector tương ứng
    """
    # Xác định content_type dựa trên Model Class
    model_name = sender.__name__
    
    # Map tên Model sang content_type enum của bạn
    type_map = {
        'Career': 'career',
        'Course': 'course',
        'Industry': 'industry',
        'MasterSkill': 'skill',
        'User': 'user_profile',
        'PersonalityTest': 'personalityTest'
    }
    
    c_type = type_map.get(model_name)
    
    if c_type:
        deleted_count, _ = KnowledgeBase.objects.filter(reference_id=str(instance.id), content_type=c_type).delete()
        if deleted_count > 0:
            print(f"Auto-Sync: Đã xóa vector của {model_name} ID: {instance.id}")