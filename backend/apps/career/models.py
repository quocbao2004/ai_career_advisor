from django.db import models
import uuid
from django.conf import settings

# Create your models here.
class Industry(models.Model):
    industry_name = models.CharField(max_length=100, null=False),
    description = models.TextField()
    def __str__(self):
        return self.industry_name
    class Meta:
        db_table = 'industries'

class Career(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    industry = models.ForeignKey(Industry, on_delete=models.SET_NULL, null=True, related_name='careers')

    def __str__(self):
        return self.title
    class Meta:
        db_table = 'careers'

class CareerRequiredSkill(models.Model):
    career = models.ForeignKey(Career, on_delete=models.CASCADE, related_name='required_skills')
    skill_name = models.CharField(max_length=100)

    class Meta:
        unique_together = ('career', 'skill_name')
        verbose_name = 'Career Required Skill'
        verbose_name_plural = 'Career Required Skills'
        db_table = 'career_required_skills'

    def __str__(self):
        return f"{self.career.title} - {self.skill_name}"

class CareerTrait(models.Model):
    career = models.ForeignKey(Career, on_delete=models.CASCADE, related_name='traits')
    trait_name = models.CharField(max_length=100)

    class Meta:
        unique_together = ('career', 'trait_name')
        verbose_name = 'Career Trait'
        verbose_name_plural = 'Career Traits'
        db_table = 'career_traits'

    def __str__(self):
        return f"{self.career.title} - {self.trait_name}"

class CareerRecommendation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # <- CHỈ CẦN DÒNG NÀY
        on_delete=models.CASCADE,
        related_name="career_recommendations"
    )
    career = models.ForeignKey(Career, on_delete=models.CASCADE, related_name='recommendations')
    score = models.FloatField()
    recommended_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} → {self.career.title} ({self.score})"

    class Meta:
        db_table = 'career_recommendations'
class CareerSpecialization(models.Model):
    id = models.AutoField(primary_key=True)
    career = models.ForeignKey(Career, on_delete=models.CASCADE, related_name='specializations')
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.title} ({self.career.title})"
    class Meta:
        db_table = 'career_specializations'