from django.db import models
from pgvector.django import VectorField
from django.conf import settings
import uuid

class ContentType(models.TextChoices):
    CAREER = 'career', 'Career'
    COURSE = 'course', 'Course'
    GENERAL_ADVICE = 'general_advice', 'General Advice'
    USER_CONTEXT = 'user', 'User'

# ==========================================
# Kiến thức dùng chung (Không có trong table trong database)
# ==========================================
class KnowledgeBase(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    content_type = models.CharField(max_length=50, choices=ContentType.choices)
    reference_id = models.CharField(max_length=100, blank=True, null=True)
    content_text = models.TextField()
    embedding = VectorField(dimensions=768)
    metadata = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'knowledge_base'


    def __str__(self):
        return f"[{self.content_type}] {self.content_text[:50]}..."
    
# ==========================================
# Quản lý prompt
# ==========================================

class AIPromptConfig(models.Model):
    name = models.CharField(max_length=100, default="Cấu hình mặc định")
    is_active = models.BooleanField(default=False, help_text="Chỉ có 1 cấu hình được kích hoạt tại 1 thời điểm")
    temperature = models.FloatField(default=0.7, help_text="Độ sáng tạo (0.0 - 1.0)")
    # Vai tro cua AI, nhiem vu
    role_description = models.TextField(
        default="Bạn là AI Career Advisor chuyên nghiệp...",
        help_text="Mô tả vai trò cốt lõi của AI."
    )
    # Xu ly khi user thieu ho so
    missing_profile_template = models.TextField(
        help_text="Prompt dùng khi user chưa cập nhật hồ sơ. Dùng biến {user_profile_context}, {chat_history_text}, {prompt}"
    )
    standard_prompt_template = models.TextField(
        help_text="Prompt chuẩn. Dùng các biến: {user_profile_context}, {rag_context}, {chat_history_text}, {prompt}, {current_job}"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    def save(self, *args, **kwargs):
        if self.is_active:
            AIPromptConfig.objects.filter(is_active=True).update(is_active=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({'Active' if self.is_active else 'Inactive'})"
    
# ==========================================
# Quản lý hội thoại
# ==========================================
class ChatSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_sessions'
    )
    title = models.CharField(max_length=255, blank=True, default="New Chat")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_sessions'

# ==========================================
# Quản lý tin nhắn
# ==========================================
class ChatMessage(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system','System'),
    ]

    id = models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    session = models.ForeignKey(ChatSession,on_delete=models.CASCADE,related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    feedback_score = models.SmallIntegerField(null=True, blank=True)
    context_used = models.JSONField(default=list, blank=True)
    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']