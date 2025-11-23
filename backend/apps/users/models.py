import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils.translation import gettext_lazy as _


# ==========================================
# 1. ENUMS (Lựa chọn)
# ==========================================

class Role(models.TextChoices):
    USER = 'user', 'User'
    ADMIN = 'admin', 'Admin'
    MENTOR = 'mentor', 'Mentor'


class Gender(models.TextChoices):
    MALE = 'male', 'Male'
    FEMALE = 'female', 'Female'
    OTHER = 'other', 'Other'


class EducationLevel(models.TextChoices):
    HIGH_SCHOOL = 'high_school', 'High School'
    BACHELOR = 'bachelor', 'Bachelor'
    MASTER = 'master', 'Master'
    PHD = 'phd', 'PhD'
    VOCATIONAL = 'vocational', 'Vocational'


class TestType(models.TextChoices):
    MBTI = 'MBTI', 'MBTI'
    HOLLAND = 'Holland', 'Holland'


# ==========================================
# 2. USER MANAGER (Quản lý tạo User)
# ==========================================

class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        # Mặc định role là User nếu không truyền vào
        extra_fields.setdefault('role', Role.USER)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # Hàm này của Django tự động hash password
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', Role.ADMIN)
        extra_fields.setdefault('full_name', 'Super Admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(max_length=255, unique=True, db_index=True)
    full_name = models.CharField(max_length=100)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)

    # Profile Fields (Đã gộp từ bảng Profile cũ vào đây)
    avatar_url = models.TextField(blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    education_level = models.CharField(max_length=20, choices=EducationLevel.choices, blank=True, null=True)
    current_job_title = models.CharField(max_length=100, blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)

    # System Fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    last_login = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email

class MasterSkill(models.Model):
    skill_name = models.CharField(max_length=100, unique=True)
    type = models.CharField(max_length=50, default='hard_skill')
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'master_skills'

    def __str__(self):
        return self.skill_name


class UserSkill(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skills')
    skill = models.ForeignKey(MasterSkill, on_delete=models.CASCADE, related_name='user_skills')
    proficiency_level = models.IntegerField(default=1)  # 1-5
    verified = models.BooleanField(default=False)

    class Meta:
        db_table = 'user_skills'
        unique_together = ('user', 'skill')

    def __str__(self):
        return f"{self.user.full_name} - {self.skill.skill_name}"


class UserInterest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="interests")
    keyword = models.CharField(max_length=100)  # VD: "AI", "Marketing"
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_interests'
        unique_together = ('user', 'keyword')

    def __str__(self):
        return f"{self.user.full_name} likes {self.keyword}"


class PersonalityTest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='personality_tests')
    test_type = models.CharField(max_length=20, choices=TestType.choices)
    result = models.TextField(blank=True, null=True)
    summary_code = models.CharField(max_length=10, blank=True, null=True)  # VD: INTJ
    taken_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'personality_tests'

    def __str__(self):
        return f"{self.user.full_name} - {self.test_type}"