from rest_framework import serializers
from apps.users.models import User, MasterSkill, UserSkill, UserInterest, PersonalityTest
from rest_framework import serializers
from django.db import transaction

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'


class MasterSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = MasterSkill
        fields = '__all__'




# --- 1. Serializer phụ cho việc hiển thị (Read Only) ---
class PersonalityTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalityTest
        fields = ['test_type', 'summary_code', 'taken_at']

# --- 2. Serializer chính cho User Profile ---
class UserProfileSerializer(serializers.ModelSerializer):
    # Khai báo các field nhận vào từ frontend (Input)
    skills = serializers.ListField(
        child=serializers.DictField(), write_only=True, required=False
    )
    interests = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False
    )
    
    personality_tests = PersonalityTestSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'full_name', 'email', 'avatar_url', 
            'phone_number', 'gender', 'dob', 'bio', 
            'education_level', 'current_job_title', 'linkedin_url',
            'skills', 'interests', 'personality_tests'
        ]
        read_only_fields = ['id', 'email', 'password_hash', 'role']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        user_skills = UserSkill.objects.filter(user=instance).select_related('skill')
        representation['skills'] = [
            {
                "id": us.id,
                "skill_name": us.skill.skill_name,
                "proficiency_level": us.proficiency_level
            }
            for us in user_skills
        ]
        user_interests = UserInterest.objects.filter(user=instance)
        representation['interests'] = [ui.keyword for ui in user_interests]

        return representation

    @transaction.atomic
    def update(self, instance, validated_data):
        skills_data = validated_data.pop('skills', None)
        interests_data = validated_data.pop('interests', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if skills_data is not None:
            UserSkill.objects.filter(user=instance).delete()
            
            new_user_skills = []
            for item in skills_data:
                skill_name_input = item.get('skill_name')
                level_input = item.get('proficiency_level', 1)

                if skill_name_input:
                    master_skill, created = MasterSkill.objects.get_or_create(
                        skill_name__iexact=skill_name_input.strip(),
                        defaults={'skill_name': skill_name_input.strip(), 'type': 'hard_skill'}
                    )
                    
                    new_user_skills.append(
                        UserSkill(
                            user=instance,
                            skill=master_skill,
                            proficiency_level=level_input
                        )
                    )
            UserSkill.objects.bulk_create(new_user_skills)

        if interests_data is not None:
            UserInterest.objects.filter(user=instance).delete()
            
            new_interests = [
                UserInterest(user=instance, keyword=tag.strip())
                for tag in interests_data if tag.strip()
            ]
            UserInterest.objects.bulk_create(new_interests)

        return instance
