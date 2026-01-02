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

        data = cls.load_questions()
        
        return {
            'options': data.get('options', []),
            'questions': data.get('questions', [])
        }
    
    @classmethod
    def calculate_result(cls, answers):
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
                'score': score,
                'percentage': percentage,
                'max_score': 24,  # 6 câu × 4 điểm
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
        
        return {
            'result_code': mbti_code,
            'result_details': result_details
        }


class TestResultService:
    """Service để quản lý kết quả trắc nghiệm (business logic)"""

    @staticmethod
    def _recommend_industries_from_db(mbti_code=None, holland_code=None, limit=4):
        try:
            from apps.career.models import Industry
            from django.db.models import Count
            from apps.career.services.industry_validation import sanitize_industry_maps

            mbti = (mbti_code or '').strip().upper()
            holland = (holland_code or '').strip().upper()
            holland_primary = list(holland[:3]) if holland else []

            # Lấy toàn bộ industries + số lượng career để fallback/sort
            qs = Industry.objects.annotate(career_count=Count('careers')).values(
                'id',
                'name',
                'mbti_map',
                'holland_map',
                'career_count'
            )

            scored = []
            for row in qs:
                industry_id = row.get('id')
                name = row.get('name')
                if not industry_id or not name:
                    continue
                mbti_map, holland_map = sanitize_industry_maps(
                    mbti_map=row.get('mbti_map') or {},
                    holland_map=row.get('holland_map') or {},
                )

                # Ưu tiên dùng score map (nếu có)
                mbti_score = 0
                if mbti:
                    try:
                        mbti_score = int(mbti_map.get(mbti, 0) or 0)
                    except Exception:
                        mbti_score = 0

                holland_score = 0
                for ch in holland_primary:
                    if not ch:
                        continue
                    try:
                        holland_score += int(holland_map.get(ch, 0) or 0)
                    except Exception:
                        continue

                score = mbti_score + holland_score

                scored.append((score, int(row.get('career_count') or 0), industry_id, name))

            if not scored:
                return []

            # Nếu chưa có mapping nào được set (tất cả score=0) thì fallback theo career_count
            has_any_mapping_match = any(s[0] > 0 for s in scored)
            if has_any_mapping_match:
                scored.sort(key=lambda x: (-x[0], -x[1], x[3]))
            else:
                scored.sort(key=lambda x: (-x[1], x[3]))

            # Chỉ trả tối đa 4 lĩnh vực
            safe_limit = 4
            try:
                safe_limit = min(4, int(limit))
            except Exception:
                safe_limit = 4

            return [
                {"id": industry_id, "name": name}
                for _, __, industry_id, name in scored[: safe_limit]
            ]
        except Exception:
            return []
    
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

        # Trả thêm danh sách lĩnh vực gợi ý (lấy từ bảng industries)
        calc_result['recommended_industries'] = cls._recommend_industries_from_db(
            mbti_code=getattr(profile, 'mbti_result', None),
            holland_code=getattr(profile, 'holland_result', None),
            limit=4,
        )
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