from rest_framework import serializers
from apps.career.models import Industry, Career


class IndustrySerializer(serializers.ModelSerializer):
    class Meta:
        model=Industry
        fields='__all__'

class CareerSerializer(serializers.ModelSerializer):
    class Meta:
        model= Career
        fields='__all__'