from rest_framework import serializers
from apps.users.models import User, MasterSkill
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class MasterSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model= MasterSkill
        fields = '__all__'
