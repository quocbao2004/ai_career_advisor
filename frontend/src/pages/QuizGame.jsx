import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import GlassCard from "../components/common/GlassCard";
import * as testApi from "../api/testApi";
import { getAccessToken, saveOnboardingStatus, getUserInfo, saveUserInfo } from "../api/authApi";
import { getQuizConfig } from "../assets/js/quizConfig";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../assets/css-custom/quiz-game.css";
import { 
  RotateCcw, 
  ArrowLeft, 
  ArrowRight, 
  Send, 
  XCircle,
  Loader2,
  Trash2
} from "lucide-react";

import QuizResult from "./QuizResult";

const QuizGame = () => {
  // Lấy loại bài test từ URL (mbti hoặc holland)
  const { type } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Danh sách câu hỏi từ API
  const [questions, setQuestions] = useState([]);
  // Các lựa chọn đánh giá cho Holland (thang điểm)
  const [ratingOptions, setRatingOptions] = useState([]);
  // Vị trí câu hỏi hiện tại (bắt đầu từ 0)
  const [currentQuestion, setCurrentQuestion] = useState(0);
  // Lưu các câu trả lời của user
  const [answers, setAnswers] = useState({});
  // Danh sách các câu bị bỏ qua
  const [skippedQuestions, setSkippedQuestions] = useState(new Set());
  // Kết quả sau khi nộp bài
  const [result, setResult] = useState(null);
  // Trạng thái loading
  const [loading, setLoading] = useState(false);
  // Thông báo lỗi
  const [error, setError] = useState(null);
  // Đánh dấu đã khôi phục tiến độ từ localStorage
  const [progressRestored, setProgressRestored] = useState(false);
  // Đáp án đang chọn cho câu hiện tại
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  // Lấy thông tin user để tạo key lưu tiến độ
  const userInfo = getUserInfo();
  const userId = userInfo?.id || 'anonymous';

  // Chuẩn hóa loại bài test từ URL params
  const rawTypeFromParams = type ? String(type).trim() : "";
  // Lấy segment cuối của URL làm fallback
  const lastPathSegment = (() => {
    try {
      const parts = (
        location && location.pathname
          ? location.pathname
          : window.location.pathname
      )
        .split("/")
        .filter(Boolean);
      return parts.length ? parts[parts.length - 1] : "";
    } catch (e) {
      return "";
    }
  })();

  // Chuẩn hóa type về lowercase
  const normalizedType =
    rawTypeFromParams || lastPathSegment
      ? String(rawTypeFromParams || lastPathSegment)
          .trim()
          .toLowerCase()
      : "";
  
  // Lấy cấu hình quiz theo loại
  let config = getQuizConfig(normalizedType);

  // Fallback nếu không tìm thấy config
  if (!config) {
    if (normalizedType.includes("mbti")) config = getQuizConfig("mbti");
    else if (normalizedType.includes("holland")) config = getQuizConfig("holland");
  }

  // Loại API để gọi backend (MBTI hoặc HOLLAND)
  const apiType = config?.apiType?.toUpperCase();

  // Key lưu tiến độ vào localStorage theo user và loại quiz
  const quizStorageKey = `quiz_progress_${userId}_${normalizedType}`;

  // Lưu tiến độ làm bài vào localStorage để khôi phục khi reload
  const saveQuizState = (state) => {
    try {
      const quizState = {
        currentQuestion: state.currentQuestion,
        answers: state.answers,
        skippedQuestions: Array.from(state.skippedQuestions),
        timestamp: Date.now(),
        quizType: normalizedType
      };
      localStorage.setItem(quizStorageKey, JSON.stringify(quizState));
    } catch (error) {
      console.warn('Không thể lưu trạng thái quiz:', error);
    }
  };

  // Khôi phục tiến độ làm bài từ localStorage
  const loadQuizState = () => {
    try {
      const savedState = localStorage.getItem(quizStorageKey);
      if (savedState && savedState !== "undefined" && savedState !== "null") {
        let quizState = null;
        try {
          quizState = JSON.parse(savedState);
        } catch (err) {
          return false;
        }

        // Kiểm tra dữ liệu còn hợp lệ và không quá 24 giờ
        const isExpired = Date.now() - quizState.timestamp > 24 * 60 * 60 * 1000;
        const isSameQuizType = quizState.quizType === normalizedType;

        // Khôi phục nếu dữ liệu còn hợp lệ
        if (!isExpired && isSameQuizType && quizState.answers) {
          setCurrentQuestion(quizState.currentQuestion || 0);
          setAnswers(quizState.answers || {});
          setSkippedQuestions(new Set(quizState.skippedQuestions || []));
          setProgressRestored(true);

          return true;
        }
      }
    } catch (error) {
    }
    return false;
  };

  // Xóa tiến độ đã lưu khỏi localStorage
  const clearQuizState = () => {
    try {
      localStorage.removeItem(quizStorageKey);
    } catch (error) {
      console.warn('Không thể xóa trạng thái quiz:', error);
    }
  };

  // Kiểm tra user đã đăng nhập chưa
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Vui lòng đăng nhập để làm bài trắc nghiệm");
      const timer = setTimeout(() => {
        navigate("/dang-nhap");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [navigate]);

  // Tải danh sách câu hỏi từ API theo loại quiz
  useEffect(() => {
    if (!config) return;

    const loadQuestions = async () => {
      try {
        setLoading(true);
        let response;
        // Tải câu hỏi Holland
        if (apiType === "HOLLAND") {
          response = await testApi.getHollandQuestions();
          if (response && response.success === false) {
            setError(response.message || "Không thể tải câu hỏi Holland. Vui lòng thử lại.");
            return;
          }
          if (response.options && response.questions && response.questions.length > 0) {
            setRatingOptions(response.options);
            setQuestions(response.questions);
          } else {
            setError("Không thể tải câu hỏi Holland. Vui lòng thử lại.");
            return;
          }
        // Tải câu hỏi MBTI
        } else if (apiType === "MBTI") {
          response = await testApi.getMBTIQuestions();
          if (response && response.success === false) {
            setError(response.message || "Không thể tải câu hỏi MBTI. Vui lòng thử lại.");
            return;
          }
          if (response.questions && Array.isArray(response.questions) && response.questions.length > 0) {
            setQuestions(response.questions);
          } else {
            setError("Không thể tải câu hỏi MBTI. Vui lòng thử lại.");
            return;
          }
        } else {
          setError("Loại bài test không hợp lệ");
          return;
        }
      } catch (err) {
        setError(err?.message || "Lỗi kết nối. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [config, apiType]);

  // Khôi phục tiến độ sau khi tải xong câu hỏi
  useEffect(() => {
    if (questions.length > 0 && !result) {
      loadQuizState();
    }
  }, [questions.length, result]);

  // Tự động lưu tiến độ mỗi khi có thay đổi
  useEffect(() => {
    if (questions.length > 0 && !result && !loading) {
      saveQuizState({
        currentQuestion,
        answers,
        skippedQuestions
      });
    }
  }, [currentQuestion, answers, skippedQuestions, questions.length, result, loading]);

  // Cập nhật đáp án đang chọn khi chuyển câu
  useEffect(() => {
    if (questions.length > 0) {
      const questionId = questions[currentQuestion]?.id;
      const questionKey = normalizedType === "holland" ? questionId : currentQuestion + 1;
      setSelectedAnswer(answers[questionKey] || null);
    }
  }, [currentQuestion, answers, questions, normalizedType]);

  // Xử lý khi user chọn đáp án
  const handleAnswer = (value) => {
    // Tạo key câu hỏi theo loại quiz
    const questionId = questions[currentQuestion]?.id;
    const questionKey = normalizedType === "holland" ? questionId : currentQuestion + 1;
    
    // Lưu đáp án vào state
    const newAnswers = {
      ...answers,
      [questionKey]: value,
    };
    setAnswers(newAnswers);
    setSelectedAnswer(value);
    
    // Xóa khỏi danh sách bỏ qua nếu đã trả lời
    const newSkipped = new Set(skippedQuestions);
    newSkipped.delete(currentQuestion);
    setSkippedQuestions(newSkipped);

    // Chuyển sang câu tiếp theo nếu chưa hết
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  // Xử lý khi user bỏ qua câu hiện tại
  const handleSkip = () => {
    // Đánh dấu câu hiện tại là bỏ qua
    const newSkipped = new Set(skippedQuestions);
    newSkipped.add(currentQuestion);
    setSkippedQuestions(newSkipped);
    setSelectedAnswer(null);

    // Chuyển sang câu tiếp theo
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  // Quay lại câu trước
  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Xử lý nộp bài - kiểm tra đã trả lời hết chưa
  const handleSubmitQuiz = () => {
    if (!canSubmitValue) {
      toast.error(`Bạn cần trả lời đủ ${questions.length} câu hỏi! Hiện tại: ${answeredCount} câu đã trả lời, ${skippedQuestions.size} câu bị bỏ qua.`);
      return;
    }
    submitQuiz(answers);
  };

  // Chuyển đến câu hỏi theo index
  const handleGoToQuestion = (index) => {
    setCurrentQuestion(index);
  };

  // Lấy trạng thái của câu hỏi (đã trả lời, bỏ qua, chưa trả lời)
  const getQuestionStatus = (index) => {
    const questionKey = normalizedType === "holland" 
      ? questions[index]?.id 
      : index + 1;
    
    // Đã trả lời - xanh lá
    if (answers[questionKey] !== undefined) {
      return 'answered';
    // Đã bỏ qua - vàng
    } else if (skippedQuestions.has(index)) {
      return 'skipped';
    // Chưa trả lời - đỏ
    } else {
      return 'unanswered';
    }
  };

  // Gửi kết quả làm bài lên server
  const submitQuiz = async (finalAnswers) => {
    try {
      setLoading(true);
      const response = await testApi.submitTest(apiType, finalAnswers);
      if (response.success) {
        setResult(response.result);
        
        // Xóa tiến độ đã lưu vì đã hoàn thành
        clearQuizState();
        
        // Cập nhật trạng thái onboarding nếu backend xác nhận hoàn thành
        if (response.onboardingCompleted || response.hasCompletedOnboarding) {
          saveOnboardingStatus(true);
          localStorage.setItem("is_new_google_user", "false");
          // Cập nhật thông tin user trong localStorage
          const currentUser = getUserInfo();
          if (currentUser) {
            saveUserInfo({
              ...currentUser,
              hasCompletedOnboarding: true,
            });
          }
        }
      } else {
        toast.error("Lỗi khi lưu kết quả. Vui lòng thử lại.");
      }
    } catch (err) {
      toast.error("Lỗi kết nối khi gửi kết quả. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Reset toàn bộ bài quiz về trạng thái ban đầu
  const handleReset = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setSkippedQuestions(new Set());
    setResult(null);
    setProgressRestored(false);
    clearQuizState();
  };

  // Lấy câu hỏi hiện tại
  const question = currentQuestion < questions.length ? questions[currentQuestion] : null;

  // Key để lấy nội dung câu hỏi tùy theo loại quiz
  const questionKey = useMemo(() => normalizedType === "holland" ? "content" : "question", [normalizedType]);
  const questionText = useMemo(() => question ? question[questionKey] : "", [question, questionKey]);

  // Kiểm tra có thể nộp bài không (phải trả lời hết và không bỏ qua câu nào)
  const canSubmitValue = useMemo(() => {
    const totalAnswered = Object.keys(answers).length;
    const hasSkipped = skippedQuestions.size > 0;
    return totalAnswered === questions.length && !hasSkipped;
  }, [answers, questions.length, skippedQuestions]);

  // Số câu đã trả lời
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  // Lấy danh sách options cho câu hỏi hiện tại
  const options = useMemo(() => {
    // Holland dùng thang điểm chung cho tất cả câu hỏi
    if (normalizedType === "holland" && ratingOptions.length > 0) {
      return ratingOptions.map(option => ({ value: option.score, label: option.label }));
    // MBTI mỗi câu có options riêng
    } else if (question && question.options) {
      return question.options.map(option => ({ value: option.value, label: option.text }));
    }
    return [];
  }, [normalizedType, ratingOptions, question]);

  // Hiển thị loading khi đang tải câu hỏi
  if (loading) {
    return (
      <div className="quiz-wrapper">
        <GlassCard className="quiz-start-card">
          <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto 16px', color: '#6366f1' }} />
          <p className="text-white-50">Đang tải câu hỏi...</p>
        </GlassCard>
      </div>
    );
  }

  // Hiển thị lỗi nếu có
  if (error) {
    return (
      <div className="quiz-wrapper">
        <GlassCard className="quiz-start-card">
          <p className="text-danger">{error}</p>
          <button
            className="btn-quiz-primary"
            onClick={() => navigate("/trac-nghiem")}
          >
            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
            Quay lại
          </button>
        </GlassCard>
      </div>
    );
  }

  // Hiển thị kết quả sau khi nộp bài thành công
  if (result) {
    return <QuizResult result={result} config={config} onReset={handleReset} />;
  }

  // Không có câu hỏi nào
  if (questions.length === 0) {
    return (
      <div className="quiz-wrapper">
        <GlassCard className="quiz-start-card">
          <p className="text-white-50">Không có câu hỏi. Vui lòng thử lại.</p>
          <button
            className="btn-quiz-primary"
            onClick={() => navigate("/trac-nghiem")}
          >
            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
            Quay lại
          </button>
        </GlassCard>
      </div>
    );
  }

  if (currentQuestion >= questions.length) {
    return (
      <div className="quiz-wrapper">
        <GlassCard className="quiz-start-card">
          <p className="text-danger">Lỗi: Vượt quá số câu hỏi</p>
          <button
            className="btn-quiz-primary"
            onClick={() => setCurrentQuestion(0)}
          >
            <RotateCcw size={16} style={{ marginRight: '6px' }} />
            Về câu đầu
          </button>
        </GlassCard>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="quiz-wrapper">
        <GlassCard className="quiz-start-card">
          <p className="text-danger">Lỗi: Không tải được câu hỏi</p>
          <button
            className="btn-quiz-primary"
            onClick={() => navigate("/trac-nghiem")}
          >
            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
            Quay lại
          </button>
        </GlassCard>
      </div>
    );
  }

  // Kiểm tra văn bản câu hỏi có tồn tại hay không
  if (!questionText) {
    return (
      <div className="quiz-wrapper">
        <GlassCard className="quiz-start-card">
          <p className="text-danger">Lỗi: Câu hỏi không hợp lệ</p>
          <button
            className="btn-quiz-primary"
            onClick={() => navigate("/trac-nghiem")}
          >
            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
            Quay lại
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="quiz-wrapper">
      <ToastContainer position="bottom-right" autoClose={3000}  />
      <div className="quiz-playing-container" style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        alignItems: 'center',
        width: '100%',
        maxWidth: '1400px'
      }}>
        {/* Phần câu hỏi - Bên trên trên mobile, bên phải trên desktop */}
        <div className="quiz-question-section" style={{ 
          width: '100%',
          order: 1
        }}>
          {/* Thông báo khôi phục tiến độ */}
          {progressRestored && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px',
              padding: '8px 12px',
              marginBottom: '15px',
              fontSize: '14px',
              color: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
            </div>
          )}
          
          <GlassCard className="question-card fade-in-up">
            <h3 className="question-text">{questionText}</h3>
            <div className="options-grid">
              {options.map((option, idx) => (
                <button
                  key={idx}
                  className={`option-btn ${option.value === selectedAnswer ? 'selected' : ''}`}
                  onClick={() => handleAnswer(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Các nút điều khiển */}
          <div className="quiz-control-buttons" style={{ 
            display: 'flex', 
            gap: '8px', 
            justifyContent: 'center',
            flexWrap: 'nowrap',
            marginTop: '20px'
          }}>
          <button
            className="btn-quiz-outline"
            onClick={handleSkip}
            disabled={currentQuestion === questions.length - 1}
            style={{ 
              opacity: currentQuestion === questions.length - 1 ? 0.5 : 1,
              cursor: currentQuestion === questions.length - 1 ? 'not-allowed' : 'pointer',
              backgroundColor: '#eab308',
              padding: '8px 12px',
              fontSize: '13px',
              whiteSpace: 'nowrap'
            }}
          >
            Bỏ qua
            <ArrowRight size={14} style={{ marginLeft: '4px' }} />
          </button>

          <button
            className="btn-quiz-outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            style={{ 
              opacity: currentQuestion === 0 ? 0.5 : 1,
              cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
              backgroundColor: '#f59e0b',
              padding: '8px 12px',
              fontSize: '13px',
              whiteSpace: 'nowrap'
            }}
          >
            <ArrowLeft size={14} style={{ marginRight: '4px' }} />
            Câu Trước
          </button>

          <button
            className="btn-quiz-primary"
            onClick={handleSubmitQuiz}
            style={{ 
              backgroundColor: canSubmitValue ? '#22c55e' : '#6b7280',
              cursor: canSubmitValue ? 'pointer' : 'not-allowed',
              opacity: canSubmitValue ? 1 : 0.6,
              padding: '8px 12px',
              fontSize: '13px',
              whiteSpace: 'nowrap'
            }}
          >
            <Send size={14} style={{ marginRight: '4px' }} />
            {canSubmitValue 
              ? 'Nộp bài' 
              : `Nộp bài (${answeredCount}/${questions.length})`
            }
          </button>
          <button
            className="btn-quiz-outline"
            onClick={() => navigate("/trac-nghiem")}
            style={{ 
              backgroundColor: '#ef4444',
              padding: '8px 12px',
              fontSize: '13px',
              whiteSpace: 'nowrap'
            }}
          >
            <XCircle size={14} style={{ marginRight: '4px' }} />
            Hủy bỏ
          </button>
          </div>
        </div>

        {/* Bảng theo dõi trạng thái câu hỏi - Bên dưới trên mobile, bên trái trên desktop */}
        <GlassCard className="question-tracker-card" style={{ 
          width: '100%',
          order: 2,
          maxHeight: 'none',
          position: 'static'
        }}>
          <div style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
            Danh sách câu hỏi
          </div>
          <div className="question-tracker-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
            gap: '8px',
            marginBottom: '12px'
          }}>
            {questions.map((_, index) => {
              const status = getQuestionStatus(index);
              const isCurrent = index === currentQuestion;
              return (
                <button
                  key={index}
                  onClick={() => handleGoToQuestion(index)}
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: isCurrent ? '2px solid #fff' : '1px solid rgba(255,255,255,0.3)',
                    backgroundColor: 
                      status === 'answered' ? '#22c55e' : 
                      status === 'skipped' ? '#eab308' : 
                      '#ef4444',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: isCurrent ? 'bold' : 'normal',
                    fontSize: '12px'
                  }}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          {/* Chú thích màu */}
          <div className="question-tracker-legend" style={{ 
            display: 'flex', 
            flexDirection: 'row',
            gap: '10px', 
            fontSize: '11px',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            paddingTop: '10px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '14px', height: '14px', backgroundColor: '#ef4444', borderRadius: '3px' }}></div>
              <span>Chưa trả lời</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '14px', height: '14px', backgroundColor: '#22c55e', borderRadius: '3px' }}></div>
              <span>Đã trả lời</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '14px', height: '14px', backgroundColor: '#eab308', borderRadius: '3px' }}></div>
              <span>Đã bỏ qua</span>
            </div>
          </div>
          
          {/* Nút xóa tiến độ đã lưu */}
          {(Object.keys(answers).length > 0 || skippedQuestions.size > 0) && (
            <div style={{ 
              borderTop: '1px solid rgba(255,255,255,0.2)', 
              paddingTop: '10px', 
              marginTop: '10px',
              textAlign: 'center'
            }}>
              <button
                onClick={() => {
                  if (window.confirm('Bạn có chắc muốn xóa toàn bộ tiến độ đã lưu?')) {
                    clearQuizState();
                    setCurrentQuestion(0);
                    setAnswers({});
                    setSkippedQuestions(new Set());
                    toast.info('Đã xóa tiến độ đã lưu');
                  }
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#ef4444',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.target.style.borderColor = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                }}
              >
                <Trash2 size={12} />
                Xóa tiến độ
              </button>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default QuizGame;