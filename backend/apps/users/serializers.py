from rest_framework import serializers
from django.db import transaction
from apps.users.models import User, UserInterest, UserProfile, UserSkill
from apps.ai.services.ai_service import get_embedding
class UserSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSkill
        fields = ['id', 'skill_name', 'proficiency_level']
        read_only_fields = ['id']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.full_name', required=False)
    email = serializers.EmailField(source='user.email', read_only=True)
    interests = serializers.ListField(child=serializers.CharField(), write_only=True, required=False, allow_empty=True)
    skills = UserSkillSerializer(many=True, write_only=True, required=False)
    
    interests = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False, allow_empty=True
    )

    skills = UserSkillSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'full_name', 'email', 
            'phone_number', 'gender', 'dob', 'bio', 
            'education_level', 'current_job_title', 'linkedin_url',
            'mbti_result', 'holland_result',
            'interests', 'skills'
        ]
        read_only_fields = ['id', 'email', 'profile_vector']

    def validate_gender(self, value):
        if value:
            return value.lower()
        return value

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        user_interests = UserInterest.objects.filter(user=instance.user)
        representation['interests'] = [ui.keyword for ui in user_interests]

        user_skills = UserSkill.objects.filter(user=instance.user)
        representation['skills'] = UserSkillSerializer(user_skills, many=True).data

        return representation

    @transaction.atomic
    def update(self, instance, validated_data):
        # 1. Tách dữ liệu
        user_data = validated_data.pop('user', {})
        interests_data = validated_data.pop('interests', None)
        skills_data = validated_data.pop('skills', None)

        # 2. Update User
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

        # =========================================================
        # 5. UPDATE SKILLS
        # =========================================================
        if skills_data is not None:
            UserSkill.objects.filter(user=instance.user).delete()
            new_skills = []
            
            for item in skills_data:
                skill = UserSkill(
                    user=instance.user,
                    skill_name=item['skill_name'],
                    proficiency_level=item['proficiency_level']
                )
                
                try:
                    vector = get_embedding(skill.skill_name, task_type="retrieval_document")
                    if vector:
                        skill.embedding = vector
                except Exception as e:
                    print(f"Không thể tạo vector cho skill {skill.skill_name}: {e}")
                
                new_skills.append(skill)
            
            UserSkill.objects.bulk_create(new_skills)

        # =========================================================
        # 6. TỰ ĐỘNG CẬP NHẬT VECTOR PROFILE
        # =========================================================
        try:
            user = instance.user
            current_interests = UserInterest.objects.filter(user=user)
            interests_str = ", ".join([i.keyword for i in current_interests])
            
            current_skills = UserSkill.objects.filter(user=user)
            skills_str = ", ".join([f"{s.skill_name} (Lv {s.proficiency_level})" for s in current_skills])

            text_content = f"""
            Job: {instance.current_job_title or 'Unknown'}
            Edu: {instance.get_education_level_display() or 'Unknown'}
            Bio: {instance.bio or ''}
            Skills: {skills_str}
            Interests: {interests_str}
            MBTI: {instance.mbti_result or ''}
            Holland: {instance.holland_result or ''}
            """.strip()

            vector = get_embedding(text_content, task_type="retrieval_document")
            
            if vector:
                instance.profile_vector = vector
                instance.save(update_fields=['profile_vector'])

        except Exception as e:
            print(f"Lỗi tạo embedding profile: {e}")

        return instance