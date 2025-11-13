from django.db import models
from apps.career.models import Career

class Course(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    career = models.ForeignKey(
        Career,
        on_delete=models.CASCADE,
        related_name="courses"
    )

    class Meta:
        db_table = "courses"

    def __str__(self):
        return self.title


class CourseSkill(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="skills")
    skill_name = models.CharField(max_length=100)

    class Meta:
        db_table = "course_skills"
        constraints = [
            models.UniqueConstraint(
                fields=["course", "skill_name"], name="unique_course_skill"
            )
        ]

    def __str__(self):
        return f"{self.course.title} - {self.skill_name}"
