from django.db import models
import uuid
from django.conf import settings
from rest_framework.exceptions import ValidationError
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
# Create your models here.

# ENUM
class Role(models.TextChoices):
    USER = 'user', 'User'
    ADMIN = 'admin', 'Admin'

class Gender(models.TextChoices):
    MALE = 'male', 'Male'
    FEMALE = 'female', 'Female'
    OTHER = 'other', 'Other'

class EducationLevel(models.TextChoices):
    HIGH_SCHOOL = 'high_school', 'High School'
    BACHELOR = 'bachelor', 'Bachelor'
    MASTER = 'master', 'Master'
    PHD = 'phd', 'PhD'

class TestType(models.TextChoices):
    MBTI = 'MBTI', 'MBTI'
    HOLLAND = 'Holland', 'Holland'

# Custom User Manager
class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4(), editable=True)
    full_name = models.CharField(max_length=50, null=False)
    email = models.CharField(max_length=50, unique=True)
    password_hash = models.TextField(null=False)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'  # dùng email thay cho username
    REQUIRED_FIELDS = ['full_name']  # trường bắt buộc ngoài email
    def __str__(self):
        return self.email

    class Meta:
        db_table = 'users'

class Profile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4())
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar_img = models.TextField(blank=True, null=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, default=Gender.OTHER)
    education_level = models.CharField(max_length=20, choices=EducationLevel.choices, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.full_name}"

    class Meta:
        db_table = 'profiles'

class UserInterests(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="interests")
    interest = models.TextField()

    class Meta:
        unique_together = ('user', 'interest')
        verbose_name = 'User Interest'
        verbose_name_plural = 'User Interests'
        db_table = 'user_interests'

    def __str__(self):
        return f"{self.user.full_name} - {self.interest}"

class UserSkill(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skills')
    skill_name = models.CharField(max_length=100)
    proficiency_level = models.IntegerField()

    def clean(self):
        if not (1 <= self.proficiency_level <= 5):
            raise ValidationError("1 <= Proficiency level <= 5.")

    def __str__(self):
        return f"{self.user.full_name} - {self.skill_name} ({self.proficiency_level})"

    class Meta:
        db_table = 'user_skills'

    class Meta:
        db_table = 'user_skills'

class PersonalityTest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='personality_tests'
    )
    test_type = models.CharField(
        max_length=20,
        choices=TestType.choices
    )
    result = models.TextField(blank=True)
    taken_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'personality_tests'
        unique_together = ('user', 'test_type')

    def __str__(self):
        return f"{self.user.full_name} - {self.test_type}"