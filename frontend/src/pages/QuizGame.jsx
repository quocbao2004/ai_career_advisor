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
  const { type } = useParams(); // "mbti" hoặc "holland"
  const navigate = useNavigate();
  const location = useLocation();

  const [questions, setQuestions] = useState([]);
  const [ratingOptions, setRatingOptions] = useState([]); // Cho Holland rating scale
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [skippedQuestions, setSkippedQuestions] = useState(new Set()); // Câu bị bỏ qua
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progressRestored, setProgressRestored] = useState(false); // Theo dõi việc đã khôi phục tiến độ
  const [selectedAnswer, setSelectedAnswer] = useState(null); // Đáp án đã chọn cho câu hiện tại

  // Lấy user info để tạo key localStorage
  const userInfo = getUserInfo();
  const userId = userInfo?.id || 'anonymous';

  const rawTypeFromParams = type ? String(type).trim() : "";
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

  const normalizedType =
    rawTypeFromParams || lastPathSegment
      ? String(rawTypeFromParams || lastPathSegment)
          .trim()
          .toLowerCase()
      : "";
  let config = getQuizConfig(normalizedType);

  if (!config) {
    if (normalizedType.includes("mbti")) config = getQuizConfig("mbti");
    else if (normalizedType.includes("holland")) config = getQuizConfig("holland");
  }

  // Đảm bảo apiType luôn là 'MBTI' hoặc 'HOLLAND
  const apiType = config?.apiType?.toUpperCase();

  // Key cho localStorage
  const quizStorageKey = `quiz_progress_${userId}_${normalizedType}`;

  // Hàm lưu trạng thái quiz vào localStorage
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

  // Hàm khôi phục trạng thái quiz từ localStorage
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

        // Kiểm tra xem dữ liệu có hợp lệ và không quá cũ (24 giờ)
        const isExpired = Date.now() - quizState.timestamp > 24 * 60 * 60 * 1000;
        const isSameQuizType = quizState.quizType === normalizedType;

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

  // Hàm xóa trạng thái quiz khỏi localStorage
  const clearQuizState = () => {
    try {
      localStorage.removeItem(quizStorageKey);
    } catch (error) {
      console.warn('Không thể xóa trạng thái quiz:', error);
    }
  };

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

  // Tải câu hỏi từ 
  useEffect(() => {
    if (!config) return;

    const loadQuestions = async () => {
      try {
        setLoading(true);
        let response;
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

  // Khôi phục trạng thái quiz sau khi tải câu hỏi
  useEffect(() => {
    if (questions.length > 0 && !result) {
      loadQuizState();
    }
  }, [questions.length, result]);

  // Tự động lưu trạng thái khi có thay đổi
  useEffect(() => {
    if (questions.length > 0 && !result && !loading) {
      saveQuizState({
        currentQuestion,
        answers,
        skippedQuestions
      });
    }
  }, [currentQuestion, answers, skippedQuestions, questions.length, result, loading]);

  // Set selectedAnswer khi chuyển câu
  useEffect(() => {
    if (questions.length > 0) {
      const questionId = questions[currentQuestion]?.id;
      const questionKey = normalizedType === "holland" ? questionId : currentQuestion + 1;
      setSelectedAnswer(answers[questionKey] || null);
    }
  }, [currentQuestion, answers, questions, normalizedType]);

  const handleAnswer = (value) => {
    const questionId = questions[currentQuestion]?.id;
    const questionKey = normalizedType === "holland" ? questionId : currentQuestion + 1;
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

    // Không tự động submit, chỉ chuyển câu
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSkip = () => {
    // Đánh dấu câu hiện tại là bỏ qua
    const newSkipped = new Set(skippedQuestions);
    newSkipped.add(currentQuestion);
    setSkippedQuestions(newSkipped);
    setSelectedAnswer(null);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (!canSubmitValue) {
      toast.error(`Bạn cần trả lời đủ ${questions.length} câu hỏi! Hiện tại: ${answeredCount} câu đã trả lời, ${skippedQuestions.size} câu bị bỏ qua.`);
      return;
    }
    submitQuiz(answers);
  };

  const handleGoToQuestion = (index) => {
    setCurrentQuestion(index);
  };

  const getQuestionStatus = (index) => {
    const questionKey = normalizedType === "holland" 
      ? questions[index]?.id 
      : index + 1;
    
    if (answers[questionKey] !== undefined) {
      return 'answered'; // Đã trả lời - xanh lá
    } else if (skippedQuestions.has(index)) {
      return 'skipped'; // Đã bỏ qua - vàng
    } else {
      return 'unanswered'; // Chưa trả lời - đỏ
    }
  };

  const submitQuiz = async (finalAnswers) => {
    try {
      setLoading(true);
      const response = await testApi.submitTest(apiType, finalAnswers);
      if (response.success) {
        setResult(response.result);
        
        // Xóa trạng thái đã lưu vì đã hoàn thành
        clearQuizState();
        
        // Nếu backend trả về onboardingCompleted hoặc hasCompletedOnboarding
        if (response.onboardingCompleted || response.hasCompletedOnboarding) {
          saveOnboardingStatus(true);
          localStorage.setItem("is_new_google_user", "false");  // Đã hoàn thành onboarding
          const currentUser = getUserInfo();
          if (currentUser) {
            saveUserInfo({
              ...currentUser,
              hasCompletedOnboarding: true,
              needsOnboarding: false,
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

  // Thêm hàm reset
  const handleReset = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setSkippedQuestions(new Set());
    setResult(null);
    setProgressRestored(false);
    // Xóa trạng thái đã lưu
    clearQuizState();
  };

  // Kiểm tra câu hỏi hiện tại nằm trong giới hạn
  const question = currentQuestion < questions.length ? questions[currentQuestion] : null;

  const questionKey = useMemo(() => normalizedType === "holland" ? "content" : "question", [normalizedType]);
  const questionText = useMemo(() => question ? question[questionKey] : "", [question, questionKey]);

  const canSubmitValue = useMemo(() => {
    const totalAnswered = Object.keys(answers).length;
    const hasSkipped = skippedQuestions.size > 0;
    return totalAnswered === questions.length && !hasSkipped;
  }, [answers, questions.length, skippedQuestions]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const options = useMemo(() => {
    if (normalizedType === "holland" && ratingOptions.length > 0) {
      return ratingOptions.map(option => ({ value: option.score, label: option.label }));
    } else if (question && question.options) {
      return question.options.map(option => ({ value: option.value, label: option.text }));
    }
    return [];
  }, [normalizedType, ratingOptions, question]);

  // Trạng thái đang tải
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

  // Trạng thái lỗi
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

  // Màn hình kết quả - render trực tiếp, khi hiện kết quả là xong flow onboarding
  if (result) {
    return <QuizResult result={result} config={config} onReset={handleReset} />;
  }

  // Màn hình làm trắc nghiệm
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
            gap: '10px', 
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '20px'
          }}>
          <button
            className="btn-quiz-outline"
            onClick={handleSkip}
            disabled={currentQuestion === questions.length - 1}
            style={{ 
              opacity: currentQuestion === questions.length - 1 ? 0.5 : 1,
              cursor: currentQuestion === questions.length - 1 ? 'not-allowed' : 'pointer',
              backgroundColor: '#eab308'
            }}
          >
            Bỏ qua
            <ArrowRight size={16} style={{ marginLeft: '6px' }} />
          </button>

          <button
            className="btn-quiz-outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            style={{ 
              opacity: currentQuestion === 0 ? 0.5 : 1,
              cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
              backgroundColor: '#f59e0b'
            }}
          >
            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
            Previous
          </button>

          <button
            className="btn-quiz-primary"
            onClick={handleSubmitQuiz}
            style={{ 
              backgroundColor: canSubmitValue ? '#22c55e' : '#6b7280',
              cursor: canSubmitValue ? 'pointer' : 'not-allowed',
              opacity: canSubmitValue ? 1 : 0.6
            }}
          >
            <Send size={16} style={{ marginRight: '6px' }} />
            {canSubmitValue 
              ? 'Nộp bài' 
              : `Nộp bài (${answeredCount}/${questions.length})`
            }
          </button>
          <button
            className="btn-quiz-outline"
            onClick={() => navigate("/trac-nghiem")}
            style={{ backgroundColor: '#ef4444' }}
          >
            <XCircle size={16} style={{ marginRight: '6px' }} />
            Hủy bỏ bài thi
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