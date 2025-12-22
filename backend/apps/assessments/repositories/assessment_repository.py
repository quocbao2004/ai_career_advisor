

from apps.users.models import PersonalityTest, User
from typing import Optional, List, Dict, Any
from uuid import UUID


class AssessmentRepository:
    "Repository để quản lý PersonalityTest trong database"
    
    @staticmethod
    def create_assessment(
        user: User,
        assessment_type: str,
        summary_code: str,
        raw_result: Dict[str, Any]
    ) -> PersonalityTest:
        """
        Tạo assessment result mới trong database
        
        Args:
            user: User instance
            assessment_type: 'HOLLAND' hoặc 'MBTI'
            summary_code: Kết quả code (vd: 'RIA', 'INTJ')
            raw_result: Dict chứa answers và result_details
        
        Returns:
            PersonalityTest instance
        """
        return PersonalityTest.objects.create(
            user=user,
            test_type=assessment_type,
            summary_code=summary_code,
            raw_result=raw_result
        )
    
    @staticmethod
    def get_assessment_by_id(
        user: User,
        assessment_id: UUID
    ) -> Optional[PersonalityTest]:
        """
        Lấy assessment result theo ID (user-specific)
        
        Args:
            user: User instance
            assessment_id: UUID của assessment
        
        Returns:
            PersonalityTest instance hoặc None
        """
        try:
            return PersonalityTest.objects.get(
                id=assessment_id,
                user=user
            )
        except PersonalityTest.DoesNotExist:
            return None
    
    @staticmethod
    def get_assessment_history(
        user: User,
        assessment_type: Optional[str] = None,
        limit: int = 10
    ) -> List[PersonalityTest]:
        """
        Lấy lịch sử assessment của user
        
        Args:
            user: User instance
            assessment_type: 'HOLLAND' hoặc 'MBTI' (optional)
            limit: Số lượng kết quả
        
        Returns:
            List[PersonalityTest]
        """
        query = PersonalityTest.objects.filter(user=user).order_by('-taken_at')
        
        if assessment_type:
            query = query.filter(test_type=assessment_type)
        
        return list(query[:limit])
    
    @staticmethod
    def get_latest_assessment(
        user: User,
        assessment_type: str
    ) -> Optional[PersonalityTest]:
        """
        Lấy assessment mới nhất của loại nào đó
        
        Args:
            user: User instance
            assessment_type: 'HOLLAND' hoặc 'MBTI'
        
        Returns:
            PersonalityTest instance hoặc None
        """
        try:
            return PersonalityTest.objects.filter(
                user=user,
                test_type=assessment_type
            ).order_by('-taken_at').first()
        except PersonalityTest.DoesNotExist:
            return None
    
    @staticmethod
    def get_user_assessment_results(
        user: User,
        limit: int = 5
    ) -> tuple[Optional[PersonalityTest], Optional[PersonalityTest], List[PersonalityTest]]:
        """
        Lấy Holland result + MBTI result + recent results
        
        Args:
            user: User instance
            limit: Số lượng recent results
        
        Returns:
            Tuple của (holland_result, mbti_result, recent_results)
        """
        holland_result = AssessmentRepository.get_latest_assessment(user, 'HOLLAND')
        mbti_result = AssessmentRepository.get_latest_assessment(user, 'MBTI')
        recent_results = AssessmentRepository.get_assessment_history(user, limit=limit)
        
        return holland_result, mbti_result, recent_results
    
    @staticmethod
    def update_assessment(
        assessment: PersonalityTest,
        **kwargs
    ) -> PersonalityTest:
        """
        Update assessment result
        
        Args:
            assessment: PersonalityTest instance
            **kwargs: Fields để update
        
        Returns:
            PersonalityTest instance (updated)
        """
        for key, value in kwargs.items():
            if hasattr(assessment, key):
                setattr(assessment, key, value)
        
        assessment.save()
        return assessment
    
    @staticmethod
    def delete_assessment(
        user: User,
        assessment_id: UUID
    ) -> bool:
        """
        Xóa assessment result
        
        Args:
            user: User instance
            assessment_id: UUID của assessment
        
        Returns:
            True nếu xóa thành công, False nếu không tồn tại
        """
        try:
            assessment = PersonalityTest.objects.get(
                id=assessment_id,
                user=user
            )
            assessment.delete()
            return True
        except PersonalityTest.DoesNotExist:
            return False
    
    @staticmethod
    def count_assessments(
        user: User,
        assessment_type: Optional[str] = None
    ) -> int:
        """
        Đếm số lượng assessment
        
        Args:
            user: User instance
            assessment_type: 'HOLLAND' hoặc 'MBTI' (optional)
        
        Returns:
            Số lượng assessment
        """
        query = PersonalityTest.objects.filter(user=user)
        
        if assessment_type:
            query = query.filter(test_type=assessment_type)
        
        return query.count()
