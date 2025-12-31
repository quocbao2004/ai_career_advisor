import json
from pathlib import Path
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

#Holland
class HollandTestService:
    
    DATA_FILE = Path(__file__).parent.parent / 'data' / 'holland.json'
    CACHE_KEY = 'holland_questions'
    
    @classmethod
    def load_questions(cls):
        """Load câu hỏi Holland từ file JSON"""
        cached = cache.get(cls.CACHE_KEY)
        if cached:
            return cached
        
        with open(cls.DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        cache.set(cls.CACHE_KEY, data, 3600)  # Cache 1 giờ
        return data
    
    @classmethod
    def get_questions_for_frontend(cls):
        """
        Trả về câu hỏi Holland cho frontend
        Cấu trúc mới: 36 câu hỏi với rating scale 0-4
        """
        data = cls.load_questions()
        
        return {
            'options': data.get('options', []),
            'questions': data.get('questions', [])
        }
    
    @classmethod
    def calculate_result(cls, answers):
        """
        Tính kết quả Holland test
        answers: dict với key là question_id (string), value là score (0-4)
        Ví dụ: {'R1': 3, 'R2': 4, 'I1': 2, ...}
        """
        data = cls.load_questions()
        questions = data.get('questions', [])
        
        if not questions:
            raise ValueError("Không tìm thấy câu hỏi")
        
        # Validate: phải có đúng 36 câu trả lời
        if len(answers) != 36:
            raise ValueError(f"Cần có đúng 36 câu trả lời, nhận được {len(answers)}")
        
        valid_question_ids = set(q['id'] for q in questions)
        provided_question_ids = set(answers.keys())
        
        invalid_questions = provided_question_ids - valid_question_ids
        if invalid_questions:
            raise ValueError(f"Invalid question IDs: {invalid_questions}")
        
        missing_questions = valid_question_ids - provided_question_ids
        if missing_questions:
            raise ValueError(f"Missing question IDs: {missing_questions}")
        
        # Map dimension -> name
        dimension_names = {
            'R': 'Realistic (Kỹ thuật - Thực tế)',
            'I': 'Investigative (Nghiên cứu - Khám phá)',
            'A': 'Artistic (Nghệ thuật - Sáng tạo)',
            'S': 'Social (Xã hội - Giúp đỡ)',
            'E': 'Enterprising (Quản lý - Dẫn dắt)',
            'C': 'Conventional (Nghiệp vụ - Tổ chức)'
        }
        
        # Validate scores (phải từ 0-4)
        for question_id, score in answers.items():
            if not isinstance(score, (int, float)) or score < 0 or score > 4:
                raise ValueError(f"Invalid score for question {question_id}: {score}. Score must be between 0 and 4")
        
        # Tạo mảng để cộng điểm (R, I, A, S, E, C)
        dimension_scores = {'R': 0, 'I': 0, 'A': 0, 'S': 0, 'E': 0, 'C': 0}
        
        # Duyệt qua từng câu hỏi, cộng điểm vào dimension tương ứng
        for question in questions:
            question_id = question['id']
            dimension = question['dimension']
            score = answers.get(question_id, 0)
            
            dimension_scores[dimension] += score
        
        # Tính tổng điểm và phần trăm
        total = sum(dimension_scores.values())
        max_possible_score = 36 * 4  # 36 câu × 4 điểm tối đa
        
        if total == 0:
            raise ValueError("Câu trả lời được cung cấp không hợp lệ")
        
        result_details = {}
        for code, score in dimension_scores.items():
            percentage = round((score / max_possible_score * 100), 1)
            result_details[code] = {
                'code': code,
                'name': dimension_names.get(code, 'Unknown'),
                'score': score,
                'percentage': percentage,
                'max_score': 24,  # 6 câu × 4 điểm
                'description': cls._get_group_description(code)
            }
        
        # Sắp xếp theo điểm cao nhất và lấy top 3
        sorted_dimensions = sorted(dimension_scores.items(), key=lambda x: x[1], reverse=True)
        result_code = ''.join([code for code, _ in sorted_dimensions[:3]])
        
        if not result_code:
            raise ValueError("Lỗi hệ thống")
        
        return {
            'result_code': result_code,
            'result_details': result_details,
            'scores_by_dimension': dict(sorted_dimensions),
            'total_score': total
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
class MBTITestService:
    
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


class TestResultService:
    """Service để quản lý kết quả trắc nghiệm (business logic)"""
    
    @classmethod
    def save_test_result(cls, user, test_type, answers):
        """
        Lưu kết quả trắc nghiệm vào UserProfile và trả về kết quả chi tiết
        """
        if test_type.upper() == 'HOLLAND':
            calc_result = HollandTestService.calculate_result(answers)
        elif test_type.upper() == 'MBTI':
            calc_result = MBTITestService.calculate_result(answers)
        else:
            raise ValueError(f"Unknown test type: {test_type}")
        from apps.users.models import UserProfile
        profile, _ = UserProfile.objects.get_or_create(user=user)
        if test_type.upper() == 'MBTI':
            profile.mbti_result = calc_result['result_code']
        elif test_type.upper() == 'HOLLAND':
            profile.holland_result = calc_result['result_code']
        profile.save()
        return calc_result
    
    @classmethod
    def get_user_test_profile(cls, user):
        """
        Trả về kết quả chi tiết cho MBTI và Holland
        """
        try:
            # Đảm bảo profile tồn tại, tạo mới nếu chưa có
            from apps.users.models import UserProfile
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            if created:
                logger.info(f"Created missing profile for user: {user.email} in get_user_test_profile")
            
            mbti_result = None
            holland_result = None
            if profile.mbti_result:
                mbti_result = MBTITestService.calculate_result(cls._get_answers_for_type(user, 'MBTI'))
            if profile.holland_result:
                holland_result = HollandTestService.calculate_result(cls._get_answers_for_type(user, 'HOLLAND'))
            return {
                'success': True,
                'mbti_result': mbti_result,
                'holland_result': holland_result
            }
        except Exception as e:
            logger.error(f"Error in get_user_test_profile for {user.email}: {e}")
            return {
                'success': True,
                'mbti_result': None,
                'holland_result': None
            }

    @staticmethod
    def _get_answers_for_type(user, test_type):
        """
        Lấy answers từ user profile hoặc nơi lưu trữ đáp án (tùy hệ thống)
        Nếu chưa lưu đáp án, trả về None hoặc dict rỗng
        """
        # TODO: Nếu bạn lưu đáp án ở model khác, hãy lấy đúng chỗ
        # Ví dụ: user.profile.mbti_answers hoặc user.profile.holland_answers
        # Nếu chưa lưu, trả về dict rỗng để tránh lỗi
        return {}