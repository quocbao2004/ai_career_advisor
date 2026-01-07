from rest_framework import serializers
from .models import LearningPath, LearningPathItem

class LearningPathItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningPathItem
        fields = ['id', 'custom_task_name', 'order_index', 'is_completed', 'completed_at']

class LearningPathListSerializer(serializers.ModelSerializer):
    """Serializer nhẹ cho danh sách lộ trình"""
    career_title = serializers.CharField(source='career.title', read_only=True)

    class Meta:
        model = LearningPath
        fields = ['id', 'title', 'career_title', 'status', 'progress_percentage', 'created_at', 'updated_at']

class LearningPathSerializer(serializers.ModelSerializer):
    items = LearningPathItemSerializer(many=True, read_only=True)
    career_title = serializers.CharField(source='career.title', read_only=True)

    class Meta:
        model = LearningPath
        fields = ['id', 'title', 'career_title', 'status', 'progress_percentage', 'items', 'created_at']