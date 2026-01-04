import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from pgvector.django import VectorField

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
    
    def get_all_users(self):
        return User.objects.filter(is_active=True)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=100)
    email = models.EmailField(max_length=255, unique=True, db_index=True)
    password_hash = models.TextField()
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)


    # System Fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    last_login = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    PASSWORD_FIELD = 'password_hash'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email

    @property
    def password(self):
        return self.password_hash

    @password.setter
    def password(self, value):
        self.password_hash = value

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    education_level = models.CharField(max_length=20, choices=EducationLevel.choices, blank=True, null=True)
    current_job_title = models.CharField(max_length=100, blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)
    mbti_result = models.CharField(max_length=10, blank=True, null=True)
    holland_result = models.CharField(max_length=10, blank=True, null=True)
    profile_vector = VectorField(dimensions=768, null=True)
    def __str__(self):
        return self.user.email

class UserInterest(models.Model):
    user = models.ForeignKey(User,on_delete=models.CASCADE,related_name="interests")
    keyword = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_interests'
        verbose_name = "User Interest"
        verbose_name_plural = "User Interests"

    def __str__(self):
        return f"{self.user.full_name} likes {self.keyword}"
    
class UserSkill(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="skills")
    skill_name = models.CharField(max_length=100)
    proficiency_level=models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="1: Cơ bản, 2: Sơ cấp, 3: Trung cấp, 4: Cao cấp, 5: Chuyên gia"
    )
    embedding=VectorField(dimensions=768,null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = 'user_skills'
        unique_together = ('user', 'skill_name')

    def __str__(self):
        return f"{self.skill_name} ({self.proficiency_level})"