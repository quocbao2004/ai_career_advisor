from rest_framework import serializers
from apps.users.models import PersonalityTest


class AssessmentResultSerializer(serializers.ModelSerializer):
    """Serializer cho kết quả trắc nghiệm chi tiết"""
    
    result_code = serializers.SerializerMethodField()
    result_details = serializers.SerializerMethodField()
    answers = serializers.SerializerMethodField()
    
    class Meta:
        model = PersonalityTest
        fields = [
            'id', 'test_type', 'result_code', 'result_details',
            'answers', 'taken_at'
        ]
        read_only_fields = ['id', 'taken_at']
    
    def get_result_code(self, obj):
        """Lấy kết quả code từ summary_code"""
        return obj.summary_code
    
    def get_result_details(self, obj):
        """Lấy chi tiết kết quả từ raw_result"""
        if obj.raw_result:
            return obj.raw_result.get('result_details', {})
        return {}
    
    def get_answers(self, obj):
        """Lấy các câu trả lời từ raw_result"""
        if obj.raw_result:
            return obj.raw_result.get('answers', {})
        return {}


class PersonalityTestSerializer(serializers.ModelSerializer):
    """Serializer cho kết quả trắc nghiệm (dạng ngắn)"""
    
    result_code = serializers.SerializerMethodField()
    
    class Meta:
        model = PersonalityTest
        fields = [
            'id', 'test_type', 'result_code',
            'taken_at'
        ]
        read_only_fields = ['id', 'taken_at']
    
    def get_result_code(self, obj):
        """Lấy kết quả code từ summary_code"""
        return obj.summary_code


class AssessmentSubmitSerializer(serializers.Serializer):
    """Serializer để submit câu trả lời trắc nghiệm"""
    
    assessment_type = serializers.CharField(max_length=20)
    answers = serializers.JSONField()
    
    def validate_assessment_type(self, value):
        """Bình thường hóa assessment_type thành uppercase"""
        value = value.upper()
        if value not in ['HOLLAND', 'MBTI']:
            raise serializers.ValidationError(f"Loại trắc nghiệm phải là 'HOLLAND' hoặc 'MBTI', nhận được '{value}'")
        return value
    
    def validate_answers(self, value):
        """Validate câu trả lời"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Answers must be a dictionary")
        if not value:
            raise serializers.ValidationError("Answers cannot be empty")
        
        # Validate that all keys are string question IDs
        for key, val in value.items():
            if not isinstance(key, str):
                raise serializers.ValidationError(f"Question ID must be string, got {type(key)}")
            if not key.isdigit():
                raise serializers.ValidationError(f"Question ID must be numeric string, got {key}")
            if not isinstance(val, str):
                raise serializers.ValidationError(f"Answer value must be string, got {type(val)}")
            if not val or len(val) == 0:
                raise serializers.ValidationError(f"Answer value cannot be empty")
        
        return value
    
    def validate(self, data):
        """Xác thực câu trả lời dựa trên loại trắc nghiệm"""
        assessment_type = data.get('assessment_type')
        answers = data.get('answers')
        
        if not assessment_type or not answers:
            return data
        
        # Giá trị hợp lệ cho mỗi loại trắc nghiệm
        if assessment_type == 'MBTI':
            valid_values = {'E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'}
            # Loại bỏ câu trả lời nhân khẩu học (Q71 và những câu khác)
            filtered_answers = {
                qid: val 
                for qid, val in answers.items() 
                if qid != '71'  # Bỏ qua câu hỏi giới tính nhân khẩu học
            }
            data['answers'] = filtered_answers
        elif assessment_type == 'HOLLAND':
            valid_values = {'R', 'I', 'A', 'S', 'E', 'C'}
            filtered_answers = answers
        else:
            return data
        
        # Kiểm tra giá trị câu trả lời
        invalid_answers = {
            qid: val 
            for qid, val in filtered_answers.items() 
            if val not in valid_values
        }
        
        if invalid_answers:
            invalid_str = ', '.join([f"Q{qid}='{val}'" for qid, val in invalid_answers.items()])
            raise serializers.ValidationError(
                f"Giá trị câu trả lời không hợp lệ cho {assessment_type}: {invalid_str}. "
                f"Giá trị hợp lệ: {valid_values}"
            )
        
        return data


class SaveAssessmentToProfileSerializer(serializers.Serializer):
    """Serializer để lưu kết quả vào hồ sơ cá nhân"""
    
    assessment_result_id = serializers.UUIDField()


class UserAssessmentProfileSerializer(serializers.Serializer):
    """Serializer cho hồ sơ trắc nghiệm của user"""
    
    holland_result = AssessmentResultSerializer(required=False, allow_null=True)
    mbti_result = AssessmentResultSerializer(required=False, allow_null=True)
    recent_results = AssessmentResultSerializer(many=True, read_only=True)
    
    class Meta:
        fields = ['holland_result', 'mbti_result', 'recent_results']

