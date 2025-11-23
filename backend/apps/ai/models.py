from django.db import models
from pgvector.django import VectorField
from django.conf import settings
import uuid

class ContentType(models.TextChoices):
    CAREER = 'career', 'Career'
    COURSE = 'course', 'Course'
    GENERAL_ADVICE = 'general_advice', 'General Advice'

class KnowledgeBase(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    content_type = models.CharField(max_length=50, choices=ContentType.choices)
    reference_id = models.CharField(max_length=100, blank=True, null=True)
    content_text = models.TextField()
    embedding = VectorField(dimensions=1536)
    metadata = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'knowledge_base'
        indexes = [
            # Chỉ uncomment dòng dưới khi bảng đã có dữ liệu (tránh lỗi init)
            # HnswIndex(
            #    name='knowledge_base_embedding_idx',
            #    fields=['embedding'],
            #    m=16,
            #    ef_construction=64,
            #    opclasses=['vector_cosine_ops']
            # )
        ]

    def __str__(self):
        return f"[{self.content_type}] {self.content_text[:50]}..."


# ==========================================
# 2. USER EMBEDDING (Giữ lại để gợi ý cá nhân hóa)
# ==========================================
class UserEmbedding(models.Model):
    """
    Bảng này vẫn cần tách riêng vì nó đại diện cho USER PROFILE
    Dùng để so khớp: User Vector <-> Career Vector (trong KnowledgeBase)
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='embedding'
    )
    # Vector đại diện cho sở thích/kỹ năng của user
    embedding = VectorField(dimensions=1536)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_embeddings'

    def __str__(self):
        return f"Vector Profile of {self.user.email}"


# ==========================================
# 3. CHAT HISTORY (Quản lý hội thoại)
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


class ChatMessage(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('model', 'Model'),  # Hoặc 'assistant'
    ]

    id = models.BigAutoField(primary_key=True)
    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()  # Nội dung chat
    created_at = models.DateTimeField(auto_now_add=True)

    # (Optional) Lưu lại vector của câu hỏi user để phân tích sau này
    embedding = VectorField(dimensions=1536, null=True, blank=True)

    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']