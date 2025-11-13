# apps/learning_paths/models.py
from django.db import models
import uuid
from django.conf import settings
from apps.career.models import Career
from apps.courses.models import Course

class LearningPath(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='learning_paths'
    )
    career = models.ForeignKey(
        Career,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='learning_paths'
    )
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'learning_paths'

    def __str__(self):
        return f"{self.title} ({self.user.full_name})"


class LearningPathCourse(models.Model):
    path = models.ForeignKey(
        LearningPath,
        on_delete=models.CASCADE,
        related_name='courses'
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='learning_paths'
    )
    order_index = models.IntegerField()
    estimated_duration = models.IntegerField(help_text="Estimated duration in hours")

    class Meta:
        db_table = 'learning_path_courses'
        unique_together = ('path', 'course')
        ordering = ['order_index']

    def __str__(self):
        return f"{self.path.title} - {self.course.title} (Order: {self.order_index})"
