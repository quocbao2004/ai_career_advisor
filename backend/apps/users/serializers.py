from rest_framework import serializers
from django.db import transaction
from apps.users.models import User, UserInterest, UserProfile, UserSkill

# --- 1. Serializer cho Skill (Nested) ---
class UserSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSkill
        fields = ['id', 'skill_name', 'proficiency_level']
        read_only_fields = ['id']

# --- 2. Serializer cho User ---
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

# --- 3. Serializer chính cho Profile ---
class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.full_name', required=False)
    email = serializers.EmailField(source='user.email', read_only=True)
    
    # Input list interests (Mảng string)
    interests = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False, allow_empty=True
    )

    # Input list skills (Mảng Object) - MỚI
    skills = UserSkillSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'full_name', 'email', 
            'phone_number', 'gender', 'dob', 'bio', 
            'education_level', 'current_job_title', 'linkedin_url',
            'mbti_result', 'holland_result',
            'interests', 'skills' # Thêm skills vào đây
        ]
        read_only_fields = ['id', 'email', 'profile_vector']

    # Fix lỗi gender viết hoa/thường
    def validate_gender(self, value):
        if value:
            return value.lower()
        return value

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Lấy Interests từ User
        user_interests = UserInterest.objects.filter(user=instance.user)
        representation['interests'] = [ui.keyword for ui in user_interests]

        # Lấy Skills từ User - MỚI
        user_skills = UserSkill.objects.filter(user=instance.user)
        representation['skills'] = UserSkillSerializer(user_skills, many=True).data

        return representation

    @transaction.atomic
    def update(self, instance, validated_data):
        # 1. Tách dữ liệu
        user_data = validated_data.pop('user', {})
        interests_data = validated_data.pop('interests', None)
        skills_data = validated_data.pop('skills', None) # Lấy dữ liệu skills

        # 2. Update User (full_name)
        if user_data:
            user = instance.user
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()

        # 3. Update UserProfile
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # 4. Update Interests
        if interests_data is not None:
            UserInterest.objects.filter(user=instance.user).delete()
            new_interests = [
                UserInterest(user=instance.user, keyword=tag.strip())
                for tag in interests_data if tag.strip()
            ]
            UserInterest.objects.bulk_create(new_interests)

        # 5. Update Skills - MỚI
        if skills_data is not None:
            # Xóa skill cũ
            UserSkill.objects.filter(user=instance.user).delete()
            
            # Tạo skill mới
            new_skills = [
                UserSkill(
                    user=instance.user,
                    skill_name=item['skill_name'],
                    proficiency_level=item['proficiency_level']
                )
                for item in skills_data
            ]
            UserSkill.objects.bulk_create(new_skills)

        return instance