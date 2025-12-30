from rest_framework import serializers
from apps.career.models import Industry, Career, Course


class IndustrySerializer(serializers.ModelSerializer):
    class Meta:
        model=Industry
        fields='__all__'

class CareerSerializer(serializers.ModelSerializer):
    class Meta:
        model= Career
        fields='__all__'

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model= Course
        fields= '__all__'
    
    def validate_price(self, value):
        """Kiểm tra giá tiền không được âm"""
        if value < 0:
            raise serializers.ValidationError("Giá khóa học không được là số âm.")
        return value
    def validate_duration_hours(self, value):
        """Kiểm tra thời lượng học"""
        if value <= 0:
            raise serializers.ValidationError("Thời lượng khóa học phải lớn hơn 0.")
        return value
    def validate_title(self, value):
        """Kiểm tra tiêu đề (ví dụ: không được quá ngắn)"""
        if len(value) < 5:
            raise serializers.ValidationError("Tiêu đề khóa học quá ngắn, vui lòng nhập rõ ràng hơn.")
        return value
    