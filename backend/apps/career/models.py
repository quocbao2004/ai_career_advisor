from django.db import models
import uuid
from django.conf import settings
from apps.users.models import MasterSkill


# ==========================================
# 1. INDUSTRY (Ngành nghề)
# ==========================================
class Industry(models.Model):
    # FIX LỖI: Đã xóa dấu phẩy thừa ở cuối dòng dưới
    name = models.CharField(max_length=100, unique=True, null=False)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.industry_name

    class Meta:
        db_table = 'industries'
        verbose_name_plural = 'Industries'
    def __str__(self):
        return self.name

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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.level if self.level else 'General'}"

    class Meta:
        db_table = 'careers'
        # Đảm bảo không nhập trùng nghề trong cùng 1 ngành
        unique_together = ('industry', 'title', 'level')

    # ==========================================


# 3. CAREER SKILLS (Liên kết Nghề - Kỹ năng)
# ==========================================
class CareerSkill(models.Model):
    """
    Thay thế cho CareerRequiredSkill cũ.
    Bảng này nối Career với MasterSkill (ở app users).
    """
    career = models.ForeignKey(Career,on_delete=models.CASCADE,related_name='required_skills')
    skill = models.ForeignKey(MasterSkill,on_delete=models.CASCADE,related_name='career_links')
    # True: Bắt buộc phải có, False: Nên có (Nice to have)
    is_required = models.BooleanField(default=True)

    class Meta:
        db_table = 'career_skills'
        unique_together = ('career', 'skill')
        verbose_name = 'Career Required Skill'

    def __str__(self):
        type_str = "Required" if self.is_required else "Optional"
        return f"{self.career.title} needs {self.skill.skill_name} ({type_str})"


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