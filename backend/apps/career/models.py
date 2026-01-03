from django.db import models
import uuid
from django.conf import settings
from pgvector.django import VectorField

# ENUM cho độ khó khóa học
class CourseLevel(models.TextChoices):
    BEGINNER = 'beginner', 'Beginner'
    INTERMEDIATE = 'intermediate', 'Intermediate'
    ADVANCED = 'advanced', 'Advanced'

# ==========================================
# 1. INDUSTRY (Ngành nghề)
# ==========================================
class Industry(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    # MBTI mapping kèm score
    # {"INTJ": 90, "ENTP": 70}
    mbti_map = models.JSONField(
        default=dict,
        blank=True,
        help_text='Map MBTI -> score. Ví dụ: {"INTJ": 90, "ENTP": 70}'
    )

    # Holland mapping kèm score
    # {"R": 40, "I": 90, "A": 60}
    holland_map = models.JSONField(
        default=dict,
        blank=True,
        help_text='Map Holland -> score. Ví dụ: {"R": 40, "I": 90}'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'industries'


# ==========================================
# 2. CAREER (Nghề nghiệp cốt lõi)
# ==========================================
class Career(models.Model):
    id = models.AutoField(primary_key=True)
    industry = models.ForeignKey(Industry,on_delete=models.SET_NULL,null=True,related_name='careers')
    title = models.CharField(max_length=150, null=False)
    # Thêm cột level để gộp bảng Specialization vào đây (Tinh gọn)
    # VD: title="Backend Dev", level="Senior"
    level = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True)
    # Thêm thông tin lương để AI tư vấn (Quan trọng)
    salary_min = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    # Xu hướng tương lai (Data để AI "chém gió")
    future_outlook = models.TextField(blank=True, null=True)
    embedding = VectorField(dimensions=768, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.level if self.level else 'General'}"

    class Meta:
        db_table = 'careers'
        # Đảm bảo không nhập trùng nghề trong cùng 1 ngành
        unique_together = ('industry', 'title', 'level')

    # ==========================================

# ==========================================
# 4. RECOMMENDATIONS (Gợi ý của AI)
# ==========================================
class CareerRecommendation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="career_recommendations")
    career = models.ForeignKey(Career,on_delete=models.CASCADE,related_name='recommendations')

    # Điểm phù hợp (0.0 đến 1.0) hoặc (0 đến 100)
    match_score = models.FloatField()

    # Lý do tại sao AI gợi ý (Lưu text để hiển thị cho user đỡ phải hỏi lại AI)
    reasoning = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} -> {self.career.title} ({self.match_score})"

    class Meta:
        db_table = 'career_recommendations'


class Course(models.Model):
    # Dùng AutoField hoặc Serial như SQL
    id = models.AutoField(primary_key=True)

    title = models.CharField(max_length=200)
    provider = models.CharField(max_length=100, blank=True, null=True)  # VD: Udemy, Coursera
    description = models.TextField(blank=True, null=True)
    url = models.URLField(max_length=500, blank=True, null=True) 
    embedding = VectorField(dimensions=768, null=True, blank=True)

    # Các thông số hỗ trợ tính toán lộ trình
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    duration_hours = models.IntegerField(default=0, help_text="Thời lượng học (giờ)")
    level = models.CharField(max_length=20, choices=CourseLevel.choices, default=CourseLevel.BEGINNER)
    created_at = models.DateTimeField(auto_now_add=True)


    class Meta:
        db_table = "courses"

    def __str__(self):
        return f"{self.title} ({self.provider})"