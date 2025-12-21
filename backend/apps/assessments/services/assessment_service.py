import json
import os
from pathlib import Path
from django.core.cache import cache
from apps.assessments.repositories import AssessmentRepository

#Holland
class HollandAssessmentService:
    
    DATA_FILE = Path(__file__).parent.parent / 'data' / 'holland.json'
    CACHE_KEY = 'holland_questions'
    
    @classmethod
    def load_questions(cls):
        """Load câu hỏi Holland từ file JSON"""
        cached = cache.get(cls.CACHE_KEY)
        if cached:
            return cached
        
        with open(cls.DATA_FILE, 'r', encoding='utf-8') as f:
            questions = json.load(f)
        
        cache.set(cls.CACHE_KEY, questions, 3600)  # Cache 1 giờ
        return questions
    
    @classmethod
    def get_questions_for_frontend(cls):
        """
        Trả về 18 câu hỏi Holland cho frontend
        Mỗi câu là 1 group với 6 items để chọn
        """
        questions = cls.load_questions()
        
        result = []
        
        for group in questions:
            result.append({
                'id': group['id'],
                'prompt': group['prompt'],
                'group_code': group['group_code'],
                'group_name': group['group_name'],
                'options': [
                    {
                        'text': item,
                        'group_code': group['group_code']
                    }
                    for item in group['items']
                ]
            })
        
        return result
    
    @classmethod
    def calculate_result(cls, answers):
        questions = cls.load_questions()
        
        if not questions:
            raise ValueError("Không tìm thấy câu hỏi ")
        
        # Map question_id -> group_code
        question_groups = {}
        group_names = {}
        
        for group in questions:
            question_id = str(group['id'])
            group_code = group['group_code']
            question_groups[question_id] = group_code
            group_names[group_code] = group['group_name']
        
        invalid_questions = [q_id for q_id in answers.keys() if q_id not in question_groups]
        if invalid_questions:
            raise ValueError(f"Invalid question IDs: {invalid_questions}")
        
        # Tính điểm cho mỗi group
        group_scores = {'R': 0, 'I': 0, 'A': 0, 'S': 0, 'E': 0, 'C': 0}
        
        for question_id_str, selected_group_code in answers.items():
            if question_id_str in question_groups:
                if selected_group_code not in group_scores:
                    raise ValueError(f"Invalid group code: {selected_group_code}")
                # Người dùng chọn 1 item, cộng điểm vào group của item đó
                group_scores[selected_group_code] += 1
        
        # Tính điểm và sắp xếp
        total = sum(group_scores.values())
        
        if total == 0:
            raise ValueError("Câu trả lời được cung cấp không hợp lệ")
        
        result_details = {}
        for code, score in group_scores.items():
            percentage = round((score / total * 100) if total > 0 else 0, 1)
            result_details[code] = {
                'code': code,
                'name': group_names.get(code, 'Unknown'),
                'score': score,
                'percentage': percentage,
                'description': cls._get_group_description(code)
            }
        
        # Sắp xếp top 3 mã
        sorted_codes = sorted(group_scores.items(), key=lambda x: x[1], reverse=True)
        result_code = ''.join([code for code, _ in sorted_codes[:3]])
        
        if not result_code:
            raise ValueError("Lỗi hệ thống")
        
        return {
            'result_code': result_code,
            'result_details': result_details,
            'scores_by_code': dict(sorted_codes)
        }
    
    @classmethod
    def _get_group_description(cls, code):
        """Mô tả chi tiết cho mỗi hướng nghề"""
        descriptions = {
            'R': {
                'name_en': 'Realistic (Realistic / Practical)',
                'name_vi': 'Thực tế (Kỹ thuật - Thực tế)',
                'description': 'Bạn yêu thích làm việc với những vật thể cụ thể, máy móc, công cụ. Bạn thích tạo ra những thứ thiết thực, giải quyết các vấn đề thực tế. Thường thích làm việc ngoài trời hoặc với các dụng cụ.',
                'suitable_careers': ['Kỹ sư', 'Thợ máy', 'Nhà xây dựng', 'Lái xe', 'Nông dân']
            },
            'I': {
                'name_en': 'Investigative (Research / Analytical)',
                'name_vi': 'Nghiên cứu (Nghiên cứu - Khám phá)',
                'description': 'Bạn yêu thích tìm hiểu, phân tích, và giải quyết vấn đề phức tạp. Bạn có khả năng suy nghĩ logic, yêu thích khoa học và toán học. Thích làm việc một mình hoặc trong nhóm nhỏ.',
                'suitable_careers': ['Nhà khoa học', 'Kỹ sư phần mềm', 'Nhà toán học', 'Nhà nghiên cứu', 'Bác sĩ']
            },
            'A': {
                'name_en': 'Artistic (Creative / Expressive)',
                'name_vi': 'Nghệ thuật (Nghệ thuật - Sáng tạo)',
                'description': 'Bạn sáng tạo, giàu trí tưởng tượng, và thích thể hiện bản thân thông qua nghệ thuật. Bạn dễ bị xúc động, nhạy cảm với thế giới xung quanh. Thích những công việc có tính sáng tạo cao.',
                'suitable_careers': ['Nhạc sĩ', 'Họa sĩ', 'Nhà thiết kế', 'Nhà viết kịch bản', 'Nhiếp ảnh gia']
            },
            'S': {
                'name_en': 'Social (People-Oriented / Helping)',
                'name_vi': 'Xã hội (Xã hội - Giúp đỡ)',
                'description': 'Bạn thân thiện, hòa đồng, và yêu thích giúp đỡ người khác. Bạn dễ thấu hiểu cảm xúc của người khác, có tinh thần hợp tác cao. Thích làm việc nhóm và tương tác với nhiều người.',
                'suitable_careers': ['Giáo viên', 'Y tá', 'Tư vấn viên', 'Công tác xã hội', 'Huấn luyện viên']
            },
            'E': {
                'name_en': 'Enterprising (Leadership / Persuasive)',
                'name_vi': 'Quản lý (Quản lý - Dẫn dắt)',
                'description': 'Bạn quyết đoán, có khả năng thuyết phục, và thích lãnh đạo. Bạn có tham vọng cao, thích giao du, và yêu thích những thách thức mới. Thích được công nhận và có ảnh hưởng đến người khác.',
                'suitable_careers': ['Quản lý', 'Doanh nhân', 'Nhân viên bán hàng', 'Nhà quản lý dự án', 'Chính trị gia']
            },
            'C': {
                'name_en': 'Conventional (Organized / Detail-Oriented)',
                'name_vi': 'Tổ chức (Nghiệp vụ - Tổ chức)',
                'description': 'Bạn gọn gàng, có kế hoạch, và yêu thích làm việc có quy trình rõ ràng. Bạn chính xác, chu đáo, và thích làm việc với dữ liệu và con số. Thích tuân thủ quy tắc và hướng dẫn.',
                'suitable_careers': ['Kỹ thuật viên', 'Kế toán viên', 'Thư ký', 'Quản lý dữ liệu', 'Lập trình viên']
            }
        }
        return descriptions.get(code, {})

#MBTI
class MBTIAssessmentService:
    
    DATA_FILE = Path(__file__).parent.parent / 'data' / 'mbti.json'
    CACHE_KEY = 'mbti_questions'
    
    @classmethod
    def load_questions(cls):
        """Load câu hỏi MBTI từ file JSON"""
        cached = cache.get(cls.CACHE_KEY)
        if cached:
            return cached
        
        with open(cls.DATA_FILE, 'r', encoding='utf-8') as f:
            questions = json.load(f)
        
        cache.set(cls.CACHE_KEY, questions, 3600)  # Cache 1 giờ
        return questions
    
    @classmethod
    def get_questions_for_frontend(cls):
        """Trả về dạng câu hỏi phù hợp cho frontend"""
        questions = cls.load_questions()
        
        result = []
        for q in questions:
            # Skip demographic questions
            if q.get('category') == 'Demographic':
                continue
                
            result.append({
                'id': q['id'],
                'question': q['question'],
                'category': q['category'],
                'options': [
                    {
                        'id': f"{q['id']}_0",
                        'text': q['options'][0]['text'],
                        'value': q['options'][0]['value']
                    },
                    {
                        'id': f"{q['id']}_1",
                        'text': q['options'][1]['text'],
                        'value': q['options'][1]['value']
                    }
                ]
            })
        
        return result
    
    @classmethod
    def calculate_result(cls, answers):
        """
        Tính toán kết quả MBTI từ các câu trả lời
        
        answers: Dict[str, str] - {question_id: answer_value}
        
        Return: {
            'result_code': 'INTJ',
            'result_details': {
                'EI': {'dominant': 'I', 'score': 5},
                'SN': {'dominant': 'N', 'score': 3},
                'TF': {'dominant': 'T', 'score': 4},
                'JP': {'dominant': 'J', 'score': 2}
            }
        }
        """
        questions = cls.load_questions()
        
        # Map category -> scores
        valid_values = {'E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'}
        scores = {'E': 0, 'I': 0, 'S': 0, 'N': 0, 'T': 0, 'F': 0, 'J': 0, 'P': 0}
        
        question_map = {str(q['id']): q for q in questions if q.get('category') != 'Demographic'}
        
        # Tính điểm cho mỗi category
        for question_id_str, answer_value in answers.items():
            if question_id_str not in question_map:
                continue
            
            # Validate câu trả lời
            if answer_value not in valid_values:
                raise ValueError(
                    f"Câu trả lời không hợp lệ '{answer_value}' for question {question_id_str}. "
                    f" {valid_values}"
                )
            
            scores[answer_value] += 1
        
        # Xác định loại MBTI
        mbti_code = ''
        result_details = {}
        
        # EI
        if scores['E'] > scores['I']:
            mbti_code += 'E'
            result_details['EI'] = {
                'dominant': 'E',
                'display': 'Extroversion (Hướng ngoại)',
                'score': scores['E'] - scores['I']
            }
        else:
            mbti_code += 'I'
            result_details['EI'] = {
                'dominant': 'I',
                'display': 'Introversion (Hướng nội)',
                'score': scores['I'] - scores['E']
            }
        
        # SN
        if scores['S'] > scores['N']:
            mbti_code += 'S'
            result_details['SN'] = {
                'dominant': 'S',
                'display': 'Sensing (Cảm giác)',
                'score': scores['S'] - scores['N']
            }
        else:
            mbti_code += 'N'
            result_details['SN'] = {
                'dominant': 'N',
                'display': 'Intuition (Trực giác)',
                'score': scores['N'] - scores['S']
            }
        
        # TF
        if scores['T'] > scores['F']:
            mbti_code += 'T'
            result_details['TF'] = {
                'dominant': 'T',
                'display': 'Thinking (Lý tính)',
                'score': scores['T'] - scores['F']
            }
        else:
            mbti_code += 'F'
            result_details['TF'] = {
                'dominant': 'F',
                'display': 'Feeling (Cảm xúc)',
                'score': scores['F'] - scores['T']
            }
        
        # JP
        if scores['J'] > scores['P']:
            mbti_code += 'J'
            result_details['JP'] = {
                'dominant': 'J',
                'display': 'Judging (Phán đoán)',
                'score': scores['J'] - scores['P']
            }
        else:
            mbti_code += 'P'
            result_details['JP'] = {
                'dominant': 'P',
                'display': 'Perceiving (Nhận thức)',
                'score': scores['P'] - scores['J']
            }
        
        # Thêm mô tả chi tiết cho MBTI type
        result_details['mbti_description'] = cls._get_mbti_description(mbti_code)
        result_details['raw_scores'] = scores
        
        return {
            'result_code': mbti_code,
            'result_details': result_details
        }
    
    @classmethod
    def _get_mbti_description(cls, mbti_code):
        """Mô tả chi tiết cho mỗi MBTI type"""
        descriptions = {
            'ISTJ': {
                'name': 'Logistician (Nhà hành chính)',
                'description': 'Trách nhiệm, kỷ luật, thực tế. Những người tin vào truyền thống và quy tắc.',
                'suitable_careers': ['Kế toán', 'Cảnh sát', 'Quản lý', 'Kỹ sư']
            },
            'ISFJ': {
                'name': 'Defender (Người bảo vệ)',
                'description': 'Chăm sóc, trung thành, yêu thích giúp đỡ. Những người tận tâm với các mối quan hệ.',
                'suitable_careers': ['Y tá', 'Giáo viên', 'Công tác xã hội', 'Tư vấn viên']
            },
            'INFJ': {
                'name': 'Advocate (Người ủng hộ)',
                'description': 'Sáng tạo, có lý tưởng, quan tâm đến con người. Những người muốn giúp thế giới tốt hơn.',
                'suitable_careers': ['Nhà tâm lý học', 'Nhà viết kịch bản', 'Lãnh đạo', 'Nhà hoạt động xã hội']
            },
            'INTJ': {
                'name': 'Architect (Nhà kiến trúc)',
                'description': 'Sáng tạo, tự lập, phân tích. Những người có kế hoạch dài hạn và chiến lược.',
                'suitable_careers': ['Kỹ sư', 'Nhà khoa học', 'Doanh nhân', 'Nhà phân tích']
            },
            'ISTP': {
                'name': 'Virtuoso (Bậc thầy)',
                'description': 'Thực tế, logic, tương tác tối giản. Những người thích hiểu cách các thứ hoạt động.',
                'suitable_careers': ['Kỹ sư', 'Lập trình viên', 'Thợ máy', 'Nhà phân tích']
            },
            'ISFP': {
                'name': 'Adventurer (Nhà thám hiểm)',
                'description': 'Nhạy cảm, sáng tạo, hiền lành. Những người sống theo những giá trị cá nhân.',
                'suitable_careers': ['Nghệ sĩ', 'Thiết kế viên', 'Âm nhạc gia', 'Thợ thủ công']
            },
            'INFP': {
                'name': 'Mediator (Người hòa giải)',
                'description': 'Lý tưởng, sáng tạo, tìm kiếm ý nghĩa. Những người muốn làm việc theo đam mê.',
                'suitable_careers': ['Nhà viết', 'Nhạc sĩ', 'Tư vấn viên', 'Nhà hoạt động']
            },
            'INTP': {
                'name': 'Logician (Nhà logic)',
                'description': 'Phân tích, tò mò, lý thuyết. Những người yêu thích tìm kiếm hiểu biết.',
                'suitable_careers': ['Lập trình viên', 'Nhà khoa học', 'Nhà phân tích', 'Dạy học']
            },
            'ESTP': {
                'name': 'Entrepreneur (Doanh nhân)',
                'description': 'Năng động, thực tế, tiếp xúc. Những người yêu thích hành động và cuộc phiêu lưu.',
                'suitable_careers': ['Bán hàng', 'Quản lý dự án', 'Doanh nhân', 'Vận động viên']
            },
            'ESFP': {
                'name': 'Entertainer (Người giải trí)',
                'description': 'Vui vẻ, sáng tạo, thích kết nối. Những người yêu thích vui nhộn và tương tác.',
                'suitable_careers': ['Diễn viên', 'Hướng dẫn du lịch', 'Bán hàng', 'Giáo viên']
            },
            'ENFP': {
                'name': 'Campaigner (Nhà vận động)',
                'description': 'Lạc quan, sáng tạo, linh hoạt. Những người yêu thích tìm hiểu con người và ý tưởng.',
                'suitable_careers': ['Dạy học', 'Tư vấn viên', 'Quảng cáo', 'Lãnh đạo']
            },
            'ENTP': {
                'name': 'Debater (Nhà tranh luận)',
                'description': 'Thông minh, sáng tạo, thích tranh luận. Những người yêu thích thách thức thực trạng.',
                'suitable_careers': ['Luật sư', 'Nhà báo', 'Doanh nhân', 'Giáo viên']
            },
            'ESTJ': {
                'name': 'Executive (Quản lý)',
                'description': 'Lãnh đạo, tổ chức, thực tế. Những người thích quản lý và cấu trúc.',
                'suitable_careers': ['Quản lý', 'Chỉ huy quân sự', 'Người thực thi', 'Kế toán']
            },
            'ESFJ': {
                'name': 'Consul (Tư vấn)',
                'description': 'Chăm sóc, tổ chức, xã hội. Những người muốn giúp đỡ và kết nối với người khác.',
                'suitable_careers': ['Y tá', 'Giáo viên', 'Tư vấn viên', 'Quản lý sự kiện']
            },
            'ENFJ': {
                'name': 'Protagonist (Nhân vật chính)',
                'description': 'Lãnh đạo, nhạy cảm, lý tưởng. Những người muốn truyền cảm hứng và hướng dẫn.',
                'suitable_careers': ['Lãnh đạo', 'Dạy học', 'Lãnh đạo tôn giáo', 'Nhà hoạt động']
            },
            'ENTJ': {
                'name': 'Commander (Chỉ huy)',
                'description': 'Lãnh đạo, chiến lược, logic. Những người sẵn sàng đảm nhận trách nhiệm và quyết định.',
                'suitable_careers': ['CEO', 'Quản lý', 'Doanh nhân', 'Chỉ huy quân sự']
            }
        }
        
        return descriptions.get(mbti_code, {
            'name': mbti_code,
            'description': 'Một loại tính cách độc đáo',
            'suitable_careers': []
        })


class AssessmentResultService:
    """Service để quản lý kết quả trắc nghiệm (business logic)"""
    
    @classmethod
    def save_assessment_result(cls, user, assessment_type, answers):
        """
        Lưu kết quả trắc nghiệm
        
        user: User instance
        assessment_type: 'HOLLAND' hoặc 'MBTI'
        answers: Dict câu trả lời
        
        Return: PersonalityTest instance
        """
        if assessment_type == 'HOLLAND':
            calc_result = HollandAssessmentService.calculate_result(answers)
        elif assessment_type == 'MBTI':
            calc_result = MBTIAssessmentService.calculate_result(answers)
        else:
            raise ValueError(f"Unknown assessment type: {assessment_type}")
        
        # Dùng repository để lưu
        test_result = AssessmentRepository.create_assessment(
            user=user,
            assessment_type=assessment_type,
            summary_code=calc_result['result_code'],
            raw_result={
                'answers': answers,
                'result_details': calc_result['result_details']
            }
        )
        
        return test_result
    
    @classmethod
    def get_assessment_history(cls, user, assessment_type=None, limit=10):
        """Lấy lịch sử trắc nghiệm của user"""
        return AssessmentRepository.get_assessment_history(
            user=user,
            assessment_type=assessment_type,
            limit=limit
        )
    
    @classmethod
    def get_assessment_result(cls, user, result_id):
        """Lấy chi tiết kết quả trắc nghiệm"""
        return AssessmentRepository.get_assessment_by_id(user, result_id)
    
    @classmethod
    def get_user_assessment_profile(cls, user):
        """
        Lấy hồ sơ trắc nghiệm của user
        Trả về kết quả Holland và MBTI mới nhất, cùng với 5 kết quả gần đây
        """
        holland_result, mbti_result, recent_results = AssessmentRepository.get_user_assessment_results(
            user=user,
            limit=5
        )
        
        return {
            'holland_result': holland_result,
            'mbti_result': mbti_result,
            'recent_results': recent_results
        }
    
    @classmethod
    def save_to_profile(cls, user, assessment_result_id):
        """
        Lưu kết quả trắc nghiệm vào hồ sơ cá nhân
        
        user: User instance
        assessment_result_id: UUID của kết quả
        
        Return: dict - thông tin hồ sơ đã cập nhật
        """
        result = AssessmentRepository.get_assessment_by_id(user, assessment_result_id)
        
        if not result:
            raise ValueError(f"Assessment result with id {assessment_result_id} not found")
        
        # Cập nhật thời gian (đánh dấu là đã được lưu vào profile)
        AssessmentRepository.update_assessment(result)
        
        # Trả về profile mới nhất
        return cls.get_user_assessment_profile(user)
