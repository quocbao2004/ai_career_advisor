/**
 * Data Format Documentation - Đồng bộ BE và FE
 * 
 * File này định nghĩa format data cho tất cả API responses
 */

// ============================================
// 1. GET /api/assessments/questions/{type}/
// ============================================

/**
 * Holland Questions Response
 * @example
 * {
 *   "success": true,
 *   "assessment_type": "HOLLAND",
 *   "total_questions": 18,
 *   "questions": [
 *     {
 *       "id": 1,
 *       "prompt": "Tôi là người...",
 *       "group_code": "R",
 *       "group_name": "Realistic (Kỹ thuật - Thực tế)",
 *       "options": [
 *         { "text": "Yêu thích vận động", "group_code": "R" },
 *         { "text": "Thẳng thắn", "group_code": "R" },
 *         ...
 *       ]
 *     },
 *     { ... }
 *   ]
 * }
 */

/**
 * MBTI Questions Response
 * @example
 * {
 *   "success": true,
 *   "assessment_type": "MBTI",
 *   "total_questions": 71,
 *   "questions": [
 *     {
 *       "id": 1,
 *       "question": "Trong một buổi tiệc, bạn sẽ:",
 *       "category": "EI",
 *       "options": [
 *         { "id": "1_0", "text": "Thoải mái trò chuyện...", "value": "E" },
 *         { "id": "1_1", "text": "Chỉ tương tác với...", "value": "I" }
 *       ]
 *     },
 *     { ... }
 *   ]
 * }
 */

// ============================================
// 2. POST /api/assessments/submit/
// ============================================

/**
 * Holland Submit Request
 * @example
 * {
 *   "assessment_type": "HOLLAND",
 *   "answers": {
 *     "1": "R",    // question_id -> group_code của selected option
 *     "2": "I",
 *     "3": "A",
 *     ...
 *     "18": "C"
 *   }
 * }
 */

/**
 * MBTI Submit Request
 * @example
 * {
 *   "assessment_type": "MBTI",
 *   "answers": {
 *     "1": "E",    // question_id -> selected personality value
 *     "2": "S",
 *     "3": "T",
 *     ...
 *     "71": "J"
 *   }
 * }
 */

/**
 * Assessment Submit Response (Holland Example)
 * @example
 * {
 *   "success": true,
 *   "message": "Assessment submitted successfully",
 *   "result": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "test_type": "HOLLAND",
 *     "result_code": "RIA",
 *     "result_details": {
 *       "R": {
 *         "code": "R",
 *         "name": "Realistic (Kỹ thuật - Thực tế)",
 *         "score": 5,
 *         "percentage": 27.8,
 *         "description": {
 *           "name_en": "Realistic (Realistic / Practical)",
 *           "name_vi": "Thực tế (Kỹ thuật - Thực tế)",
 *           "description": "Bạn yêu thích làm việc với...",
 *           "suitable_careers": ["Kỹ sư", "Thợ máy", ...]
 *         }
 *       },
 *       "I": { ... },
 *       "A": { ... },
 *       "S": { ... },
 *       "E": { ... },
 *       "C": { ... }
 *     },
 *     "answers": { "1": "R", "2": "I", ... },
 *     "taken_at": "2024-12-05T10:30:00Z",
 *     "created_at": "2024-12-05T10:30:00Z"
 *   }
 * }
 */

/**
 * Assessment Submit Response (MBTI Example)
 * @example
 * {
 *   "success": true,
 *   "message": "Assessment submitted successfully",
 *   "result": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "test_type": "MBTI",
 *     "result_code": "INTJ",
 *     "result_details": {
 *       "EI": {
 *         "dominant": "I",
 *         "display": "Introversion (Hướng nội)",
 *         "score": 5
 *       },
 *       "SN": {
 *         "dominant": "N",
 *         "display": "Intuition (Trực giác)",
 *         "score": 3
 *       },
 *       "TF": {
 *         "dominant": "T",
 *         "display": "Thinking (Lý tính)",
 *         "score": 4
 *       },
 *       "JP": {
 *         "dominant": "J",
 *         "display": "Judging (Phán đoán)",
 *         "score": 2
 *       },
 *       "mbti_description": {
 *         "name": "Architect (Nhà kiến trúc)",
 *         "description": "Sáng tạo, tự lập, phân tích...",
 *         "suitable_careers": ["Kỹ sư", "Nhà khoa học", ...]
 *       },
 *       "raw_scores": {
 *         "E": 2, "I": 7, "S": 4, "N": 6, "T": 7, "F": 2, "J": 6, "P": 3
 *       }
 *     },
 *     "answers": { "1": "E", "2": "S", ... },
 *     "taken_at": "2024-12-05T10:30:00Z",
 *     "created_at": "2024-12-05T10:30:00Z"
 *   }
 * }
 */

// ============================================
// 3. GET /api/assessments/results/{id}/
// ============================================

/**
 * Assessment Result Detail Response
 * Cùng format với submit response "result"
 * @example
 * {
 *   "success": true,
 *   "result": { ... } // Same as submit response result
 * }
 */

// ============================================
// 4. GET /api/assessments/history/
// ============================================

/**
 * Assessment History Response
 * @example
 * {
 *   "success": true,
 *   "count": 3,
 *   "results": [
 *     {
 *       "id": "550e8400-e29b-41d4-a716-446655440000",
 *       "test_type": "HOLLAND",
 *       "result_code": "RIA",
 *       "taken_at": "2024-12-05T10:30:00Z",
 *       "created_at": "2024-12-05T10:30:00Z"
 *     },
 *     {
 *       "id": "550e8400-e29b-41d4-a716-446655440001",
 *       "test_type": "MBTI",
 *       "result_code": "INTJ",
 *       "taken_at": "2024-12-04T15:20:00Z",
 *       "created_at": "2024-12-04T15:20:00Z"
 *     },
 *     ...
 *   ]
 * }
 */

// ============================================
// 5. GET /api/assessments/profile/
// ============================================

/**
 * User Assessment Profile Response
 * @example
 * {
 *   "success": true,
 *   "profile": {
 *     "holland_result": {
 *       "id": "...",
 *       "test_type": "HOLLAND",
 *       "result_code": "RIA",
 *       "result_details": { ... },
 *       "answers": { ... },
 *       "taken_at": "...",
 *       "created_at": "..."
 *     },
 *     "mbti_result": {
 *       "id": "...",
 *       "test_type": "MBTI",
 *       "result_code": "INTJ",
 *       "result_details": { ... },
 *       "answers": { ... },
 *       "taken_at": "...",
 *       "created_at": "..."
 *     },
 *     "recent_results": [
 *       { ... },
 *       { ... },
 *       { ... }
 *     ]
 *   }
 * }
 */

// ============================================
// 6. POST /api/assessments/save-to-profile/
// ============================================

/**
 * Save to Profile Request
 * @example
 * {
 *   "assessment_result_id": "550e8400-e29b-41d4-a716-446655440000"
 * }
 */

/**
 * Save to Profile Response
 * @example
 * {
 *   "success": true,
 *   "message": "Assessment saved to profile successfully",
 *   "profile": { ... } // Same as GET /api/assessments/profile/
 * }
 */

// ============================================
// ERROR RESPONSES
// ============================================

/**
 * Error Response
 * @example
 * {
 *   "success": false,
 *   "message": "Error message here"
 * }
 *
 * HTTP Status Codes:
 * - 400: Bad Request (validation error)
 * - 401: Unauthorized (missing/invalid token)
 * - 404: Not Found (resource doesn't exist)
 * - 500: Server Error
 */

export default {};
