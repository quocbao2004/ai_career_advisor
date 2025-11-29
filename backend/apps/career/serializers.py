from apps.career.models import Career
from rest_framework import serializers

class CareerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Career
        fields = '__all__'

    def create(self, validated_data):
        if isinstance(validated_data, list):
            careers = [Career(**item) for item in validated_data]
            return Career.objects.bulk_create(careers)
        return super().create(validated_data)