from rest_framework import serializers
from apps.users.models import User, UserInterest
from rest_framework import serializers
from django.db import transaction

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

# --- 2. Serializer chính cho User Profile ---
class UserProfileSerializer(serializers.ModelSerializer):
    # Khai báo các field nhận vào từ frontend (Input)
    skills = serializers.ListField(
        child=serializers.DictField(), write_only=True, required=False
    )
    interests = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False
    )
    

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

        if interests_data is not None:
            UserInterest.objects.filter(user=instance).delete()
            
            new_interests = [
                UserInterest(user=instance, keyword=tag.strip())
                for tag in interests_data if tag.strip()
            ]
            UserInterest.objects.bulk_create(new_interests)

        return instance
