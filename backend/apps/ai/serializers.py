from rest_framework import serializers
from .models import ChatMessage, ChatSession, AIPromptConfig

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model=ChatMessage
        fields='__all__'

class ChatSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model=ChatSession
        fields='__all__'

class AIPromptConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIPromptConfig
        fields = '__all__'