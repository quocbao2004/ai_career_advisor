from apps.career.models import Career
from apps.admin import serializers
from rest_framework.exceptions import ValidationError

class AdminServices():
    @staticmethod
    def create_careers(data):
        serializer = serializers.CareerSerializer(data=data, many=True)
        if serializer.is_valid():
            serializer.save()
            return serializer.data
        else:
            raise ValidationError(serializer.errors)