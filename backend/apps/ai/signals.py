from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from apps.career.models import Career, Course # Import đúng model của bạn
from apps.ai.models import KnowledgeBase, ContentType
from apps.ai.services.ai_service import get_embedding 
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import transaction
from apps.users.models import UserProfile, UserSkill, UserInterest
from apps.ai.services.ai_service import get_embedding

def sync_to_kb(instance, content_type, text_content, metadata):
    vector = get_embedding(text_content, task_type="retrieval_document")
    
    KnowledgeBase.objects.update_or_create(
        content_type=content_type,
        reference_id=str(instance.id),
        defaults={
            'content_text': text_content,
            'embedding': vector,
            'metadata': metadata
        }
    )
    
    instance.__class__.objects.filter(id=instance.id).update(embedding=vector)

@receiver(post_save, sender=Career)
def sync_career(sender, instance, created, **kwargs):
    text = f"Career: {instance.title}. Level: {instance.level}. Salary: {instance.salary_min}-{instance.salary_max}. Desc: {instance.description}"
    meta = {"title": instance.title, "type": "career"}
    sync_to_kb(instance, ContentType.CAREER, text, meta)

@receiver(post_save, sender=Course)
def sync_course(sender, instance, created, **kwargs):
    text = f"Course: {instance.title}. Provider: {instance.provider}. Level: {instance.level}. Desc: {instance.description}"
    meta = {"title": instance.title, "type": "course", "url": instance.url}
    sync_to_kb(instance, ContentType.COURSE, text, meta)

@receiver(post_delete, sender=Career)
@receiver(post_delete, sender=Course)
def delete_kb(sender, instance, **kwargs):
    ctype = ContentType.CAREER if sender == Career else ContentType.COURSE
    KnowledgeBase.objects.filter(content_type=ctype, reference_id=str(instance.id)).delete()

def update_user_vector(user):
    try:
        profile = getattr(user, 'profile', None)
        if not profile: return

        job = profile.current_job_title or "Chưa có việc làm"
        edu = profile.education_level or "Chưa cập nhật"
        bio = profile.bio or ""
        mbti = profile.mbti_result or ""
        
        skills = user.skills.all()
        skill_text = ", ".join([f"{s.skill_name} (Level {s.proficiency_level})" for s in skills])
        
        interests = user.interests.all()
        interest_text = ", ".join([i.keyword for i in interests])

        full_text_representation = (
            f"User Profile Summary:\n"
            f"- Current Job: {job}\n"
            f"- Education: {edu}\n"
            f"- MBTI: {mbti}\n"
            f"- Bio: {bio}\n"
            f"- Skills: {skill_text}\n"
            f"- Interests: {interest_text}"
        )

        vector = get_embedding(full_text_representation, task_type="retrieval_document")

        if vector:
            UserProfile.objects.filter(id=profile.id).update(profile_vector=vector)
            print(f"Đã cập nhật vector cho user: {user.email}")
            
    except Exception as e:
        print(f"Lỗi update user vector: {e}")


@receiver(post_save, sender=UserProfile)
def on_profile_change(sender, instance, created, **kwargs):
    update_user_vector(instance.user)

@receiver(post_save, sender=UserSkill)
@receiver(post_delete, sender=UserSkill)
def on_skill_change(sender, instance, **kwargs):
    if kwargs.get('created') or (not kwargs.get('created') and kwargs.get('update_fields') is None): 
         skill_text = f"{instance.skill_name} level {instance.proficiency_level}"
         vec = get_embedding(skill_text)
         if vec:
             UserSkill.objects.filter(id=instance.id).update(embedding=vec)

    update_user_vector(instance.user)

@receiver(post_save, sender=UserInterest)
@receiver(post_delete, sender=UserInterest)
def on_interest_change(sender, instance, **kwargs):
    update_user_vector(instance.user)