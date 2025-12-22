from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
import logging

logger = logging.getLogger(__name__)

from apps.assessments.serializers import (
    AssessmentSubmitSerializer, 
    AssessmentResultSerializer,
    SaveAssessmentToProfileSerializer,
    PersonalityTestSerializer
)
from apps.assessments.services.assessment_service import (
    HollandAssessmentService,
    MBTIAssessmentService,
    AssessmentResultService
)
from apps.users.models import PersonalityTest


class AssessmentQuestionsView(APIView):
    """API lấy danh sách câu hỏi trắc nghiệm"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, assessment_type):
       
        assessment_type = assessment_type.lower()
        
        try:
            if assessment_type == 'holland':
                questions = HollandAssessmentService.get_questions_for_frontend()
                return Response({
                    'success': True,
                    'assessment_type': 'HOLLAND',
                    'total_questions': len(questions),
                    'questions': questions
                })
            elif assessment_type == 'mbti':
                questions = MBTIAssessmentService.get_questions_for_frontend()
                return Response({
                    'success': True,
                    'assessment_type': 'MBTI',
                    'total_questions': len(questions),
                    'questions': questions
                })
            else:
                return Response({
                    'success': False,
                    'message': f'Unknown assessment type: {assessment_type}'
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AssessmentSubmitView(APIView):
    """API để submit câu trả lời trắc nghiệm"""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        logger.info(f"Received submit assessment request: {request.data}")
        serializer = AssessmentSubmitSerializer(data=request.data)
        
        if not serializer.is_valid():
            logger.error(f"Validation error: {serializer.errors}")
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        assessment_type = serializer.validated_data['assessment_type']
        answers = serializer.validated_data['answers']
        
        logger.info(f"Assessment type: {assessment_type}, Answers keys: {list(answers.keys())}")
        
        try:
            # Lưu kết quả
            result = AssessmentResultService.save_assessment_result(
                request.user,
                assessment_type,
                answers
            )
            
            logger.info(f"Assessment result saved: {result.id}")
            
            # Trả về kết quả đầy đủ
            return Response({
                'success': True,
                'message': 'Assessment submitted successfully',
                'result': AssessmentResultSerializer(result).data
            }, status=status.HTTP_201_CREATED)
        
        except ValueError as e:
            logger.error(f"ValueError: {str(e)}")
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error saving assessment result: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AssessmentResultDetailView(APIView):
    """API lấy chi tiết kết quả trắc nghiệm"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, result_id):
       
        try:
            result = PersonalityTest.objects.get(id=result_id, user=request.user)
            return Response({
                'success': True,
                'result': AssessmentResultSerializer(result).data
            })
        except PersonalityTest.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Assessment result not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AssessmentHistoryView(APIView):
    """API lấy lịch sử trắc nghiệm của user"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
       
        assessment_type = request.query_params.get('type', None)
        try:
            limit = int(request.query_params.get('limit', 10))
        except (ValueError, TypeError):
            limit = 10
        
        try:
            results = AssessmentResultService.get_assessment_history(
                request.user,
                assessment_type=assessment_type,
                limit=limit
            )
            
            return Response({
                'success': True,
                'count': len(results),
                'results': PersonalityTestSerializer(results, many=True).data
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserAssessmentProfileView(APIView):
    """API quản lý hồ sơ trắc nghiệm của user"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
       
        try:
            profile = AssessmentResultService.get_user_assessment_profile(request.user)
            
            # Serialize profile data
            serialized_profile = {
                'holland_result': AssessmentResultSerializer(profile['holland_result']).data if profile['holland_result'] else None,
                'mbti_result': AssessmentResultSerializer(profile['mbti_result']).data if profile['mbti_result'] else None,
                'recent_results': PersonalityTestSerializer(profile['recent_results'], many=True).data
            }
            
            return Response({
                'success': True,
                'profile': serialized_profile
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SaveAssessmentToProfileView(APIView):
    """API lưu kết quả trắc nghiệm vào hồ sơ cá nhân (UserDashboard)"""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        
        serializer = SaveAssessmentToProfileSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        assessment_result_id = serializer.validated_data['assessment_result_id']
        
        try:
            profile = AssessmentResultService.save_to_profile(
                request.user,
                assessment_result_id
            )
            
            # Serialize profile data
            serialized_profile = {
                'holland_result': AssessmentResultSerializer(profile['holland_result']).data if profile['holland_result'] else None,
                'mbti_result': AssessmentResultSerializer(profile['mbti_result']).data if profile['mbti_result'] else None,
                'recent_results': PersonalityTestSerializer(profile['recent_results'], many=True).data
            }
            
            return Response({
                'success': True,
                'message': 'Assessment saved to profile successfully',
                'profile': serialized_profile
            }, status=status.HTTP_200_OK)
        
        except ValueError as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

