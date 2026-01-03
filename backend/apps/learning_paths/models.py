from django.db import models
import uuid
from django.conf import settings
from django.utils import timezone
from apps.career.models import Career, Course

# ENUM cho trạng thái lộ trình
class PathStatus(models.TextChoices):
    IN_PROGRESS = 'in_progress', 'In Progress'
    COMPLETED = 'completed', 'Completed'
    ARCHIVED = 'archived', 'Archived'


class LearningPath(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='learning_paths')
    career = models.ForeignKey(Career,on_delete=models.SET_NULL,null=True,blank=True,related_name='learning_paths')
    title = models.CharField(max_length=150)

    # Tracking tiến độ
    status = models.CharField(max_length=50,choices=PathStatus.choices,default=PathStatus.IN_PROGRESS)
    progress_percentage = models.FloatField(default=0.0)  # 0.0 đến 100.0

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'learning_paths'

    def __str__(self):
        return f"{self.title} - {self.user}"

    def update_progress(self):
        """Hàm helper để tự động tính % hoàn thành"""
        total_items = self.items.count()
        if total_items == 0:
            self.progress_percentage = 0.0
        else:
            completed_items = self.items.filter(is_completed=True).count()
            self.progress_percentage = (completed_items / total_items) * 100

        if self.progress_percentage == 100:
            self.status = PathStatus.COMPLETED

        self.save(update_fields=['progress_percentage', 'status', 'updated_at'])


class LearningPathItem(models.Model):
    path = models.ForeignKey(LearningPath,on_delete=models.CASCADE,related_name='items'  )
    course = models.ForeignKey(Course,on_delete=models.SET_NULL,null=True,blank=True,related_name='learning_path_items')
    custom_task_name = models.CharField(max_length=255, blank=True, null=True)
    order_index = models.IntegerField()
    # Trạng thái hoàn thành của từng mục
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'learning_path_items'
        ordering = ['order_index']

    def __str__(self):
        # Hiển thị tên Course hoặc tên Custom Task
        name = self.course.title if self.course else self.custom_task_name
        return f"Step {self.order_index}: {name}"

    def save(self, *args, **kwargs):
        # Tự động cập nhật thời gian hoàn thành
        if self.is_completed and not self.completed_at:
            self.completed_at = timezone.now()
        elif not self.is_completed:
            self.completed_at = None

        super().save(*args, **kwargs)
        # Sau khi lưu item, cập nhật lại tiến độ của Path cha
        self.path.update_progress()