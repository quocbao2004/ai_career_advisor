from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from apps.users.models import UserProfile, UserSkill, UserInterest
from apps.ai.services.ai_service import get_embedding

# ========================================================
# 1. TỰ ĐỘNG EMBEDDING CHO TỪNG SKILL RIÊNG LẺ
# ========================================================
@receiver(post_save, sender=UserSkill)
def auto_embed_single_skill(sender, instance, created, **kwargs):
    if instance.skill_name:
        print(f" Auto-embedding skill: {instance.skill_name}...")
        vector = get_embedding(instance.skill_name, task_type="retrieval_document")
        
        if vector:
            UserSkill.objects.filter(pk=instance.pk).update(embedding=vector)
            print(f"Đã cập nhật vector cho Skill: {instance.skill_name}")

# ========================================================
# 2. TỰ ĐỘNG EMBEDDING TỔNG HỢP CHO USER PROFILE
# ========================================================

def update_profile_vector(user):
    """Hàm chung để tính toán lại vector cho Profile"""
    try:
        profile = user.profile
        
        # Lấy Skills
        skills_qs = user.skills.all()
        skills_str = ", ".join([f"{s.skill_name} (Lv {s.proficiency_level})" for s in skills_qs])

        # Lấy Interests
        interests_qs = user.interests.all()
        interests_str = ", ".join([i.keyword for i in interests_qs])

        # Tạo nội dung text
        text_content = f"""
        Job: {profile.current_job_title or 'Unknown'}
        Edu: {profile.get_education_level_display() or 'Unknown'}
        Bio: {profile.bio or ''}
        Skills: {skills_str}
        Interests: {interests_str}
        MBTI: {profile.mbti_result or ''}
        Holland: {profile.holland_result or ''}
        """.strip()

        vector = get_embedding(text_content, task_type="retrieval_document")

        if vector:
            UserProfile.objects.filter(pk=profile.pk).update(profile_vector=vector)
            
    except Exception as e:
        print(f" Lỗi update profile vector: {e}")


@receiver(post_save, sender=UserProfile)
def on_profile_change(sender, instance, created, **kwargs):
    if not created:
        update_profile_vector(instance.user)

@receiver([post_save, post_delete], sender=UserSkill)
def on_skill_change(sender, instance, **kwargs):
    update_profile_vector(instance.user)

@receiver([post_save, post_delete], sender=UserInterest)
def on_interest_change(sender, instance, **kwargs):
    update_profile_vector(instance.user)