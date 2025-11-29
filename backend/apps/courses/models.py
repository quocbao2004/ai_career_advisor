from django.db import models
from apps.career.models import Career
from apps.users.models import MasterSkill 

# ENUM cho độ khó khóa học
class CourseLevel(models.TextChoices):
    BEGINNER = 'beginner', 'Beginner'
    INTERMEDIATE = 'intermediate', 'Intermediate'
    ADVANCED = 'advanced', 'Advanced'


class Course(models.Model):
    # Dùng AutoField hoặc Serial như SQL
    id = models.AutoField(primary_key=True)

    title = models.CharField(max_length=200)
    provider = models.CharField(max_length=100, blank=True, null=True)  # VD: Udemy, Coursera
    description = models.TextField(blank=True, null=True)
    url = models.URLField(max_length=500, blank=True, null=True)  # Link học

    # Các thông số hỗ trợ tính toán lộ trình
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    duration_hours = models.IntegerField(default=0, help_text="Thời lượng học (giờ)")
    level = models.CharField(max_length=20, choices=CourseLevel.choices, default=CourseLevel.BEGINNER)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "courses"

    def __str__(self):
        return f"{self.title} ({self.provider})"


class CourseSkill(models.Model):
    """
    Bảng này định nghĩa: Khóa học này dạy kỹ năng gì?
    Để phục vụ thuật toán Gap Analysis:
    User thiếu Skill A -> Tìm Course dạy Skill A.
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="course_skills")

    # QUAN TRỌNG: Trỏ về MasterSkill thay vì lưu text
    skill = models.ForeignKey(MasterSkill, on_delete=models.CASCADE, related_name="course_skills")

    class Meta:
        db_table = "course_skills"
        unique_together = ('course', 'skill')  # Một khóa học không add trùng skill

    def __str__(self):
        return f"{self.course.title} teaches {self.skill.skill_name}"


class CareerCourse(models.Model):
    """
    Bảng nối: Nghề này nên học khóa học nào? (Tương ứng bảng career_courses trong SQL)
    Thay vì dùng ForeignKey trực tiếp trong Course, ta dùng bảng trung gian này
    để 1 khóa học có thể gợi ý cho nhiều nghề.
    """
    career = models.ForeignKey(Career, on_delete=models.CASCADE, related_name="recommended_courses")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="relevant_careers")

    # Độ phù hợp (Optional): 1.0 là rất hợp, 0.5 là tham khảo thêm
    relevance_score = models.FloatField(default=1.0)

    class Meta:
        db_table = "career_courses"
        unique_together = ('career', 'course')

    def __str__(self):
        return f"{self.course.title} for {self.career.title}"