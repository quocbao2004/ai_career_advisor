# apps/ai/models.py
from django.db import models
from pgvector.django import VectorField
from django.conf import settings
from apps.career.models import Career, CareerSpecialization
from apps.courses.models import Course

class UserEmbedding(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='embedding'
    )
    embedding = VectorField(dimensions=1536)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_embeddings'

    def __str__(self):
        return f"Embedding of {self.user.full_name}"


class CareerEmbedding(models.Model):
    career = models.OneToOneField(
        Career,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='embedding'
    )
    embedding = VectorField(dimensions=1536)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'career_embeddings'

    def __str__(self):
        return f"Embedding of {self.career.title}"


class CourseEmbedding(models.Model):
    course = models.OneToOneField(
        Course,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='embedding'
    )
    embedding = VectorField(dimensions=1536)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'course_embeddings'

    def __str__(self):
        return f"Embedding of {self.course.title}"


class SpecializationEmbedding(models.Model):
    specialization = models.OneToOneField(
        CareerSpecialization,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='embedding'
    )
    embedding = VectorField(dimensions=1536)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'specialization_embeddings'

    def __str__(self):
        return f"Embedding of {self.specialization.title}"
