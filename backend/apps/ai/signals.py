
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from apps.career.models import Career, Industry, Course
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
# 6. XỬ LÝ XÓA (DELETE) - DÙNG CHUNG
# =======================================================
@receiver(post_delete, sender=Career)
@receiver(post_delete, sender=Course)
@receiver(post_delete, sender=Industry)
@receiver(post_delete, sender=User)
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