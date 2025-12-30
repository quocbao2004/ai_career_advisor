from rest_framework import serializers
from apps.users.models import User, UserInterest, UserProfile
from rest_framework import serializers
from django.db import transaction

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.full_name')
    email = serializers.EmailField(source='user.email', read_only=True)
    # 2. Input list interests (Write only)
    interests = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False
    )

    class Meta:
        model = UserProfile
        fields = [
            'id', 'full_name', 'email', 
            'phone_number', 'gender', 'dob', 'bio', 
            'education_level', 'current_job_title', 'linkedin_url',
            'mbti_result', 'holland_result', # Thêm kết quả test nếu cần
            'interests'
        ]
        read_only_fields = ['id', 'email', 'profile_vector'] # Không cho user sửa vector trực tiếp

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Lấy interest từ User (instance.user) chứ không phải profile
        user_interests = UserInterest.objects.filter(user=instance.user)
        representation['interests'] = [ui.keyword for ui in user_interests]
        return representation

    @transaction.atomic
    def update(self, instance, validated_data):
        # 1. Tách dữ liệu của User (full_name) và Interests ra riêng
        user_data = validated_data.pop('user', {})
        interests_data = validated_data.pop('interests', None)

        # 2. Cập nhật thông tin bảng User (nếu có thay đổi full_name)
        if user_data:
            user = instance.user
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()

        # 3. Cập nhật thông tin bảng UserProfile
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # 4. Cập nhật Interests (Xóa cũ -> Thêm mới)
        if interests_data is not None:
            # Lưu ý: UserInterest nối với User, nên phải dùng instance.user
            UserInterest.objects.filter(user=instance.user).delete()
            
            new_interests = [
                UserInterest(user=instance.user, keyword=tag.strip())
                for tag in interests_data if tag.strip()
            ]
            UserInterest.objects.bulk_create(new_interests)

        return instance