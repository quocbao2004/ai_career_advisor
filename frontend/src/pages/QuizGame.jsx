import React, { useState, useEffect } from "react";
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
  Loader2
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

  // Tải câu hỏi từ API
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

  const handleAnswer = (value) => {
    const questionId = questions[currentQuestion]?.id;
    const questionKey = normalizedType === "holland" ? questionId : currentQuestion + 1;
    const newAnswers = {
      ...answers,
      [questionKey]: value,
    };
    setAnswers(newAnswers);
    
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

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const canSubmit = () => {
    // Kiểm tra tất cả câu hỏi đã được trả lời
    const totalAnswered = Object.keys(answers).length;
    const hasSkipped = skippedQuestions.size > 0;
    return totalAnswered === questions.length && !hasSkipped;
  };

  const handleSubmitQuiz = () => {
    if (!canSubmit()) {
      toast.error(`Bạn cần trả lời đủ ${questions.length} câu hỏi! Hiện tại: ${Object.keys(answers).length} câu đã trả lời, ${skippedQuestions.size} câu bị bỏ qua.`);
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
        
        // Nếu backend trả về onboardingCompleted hoặc hasCompletedOnboarding
        if (response.onboardingCompleted || response.hasCompletedOnboarding) {
          saveOnboardingStatus(true);
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

  const handleReset = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setSkippedQuestions(new Set());
    setResult(null);
  };

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

  // Màn hình kết quả
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

  // Kiểm tra câu hỏi hiện tại nằm trong giới hạn
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

  const question = questions[currentQuestion];
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

  const questionKey = normalizedType === "holland" ? "content" : "question";
  const questionText = question[questionKey];

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
        gap: '20px',
        alignItems: 'flex-start',
        width: '100%',
        maxWidth: '1400px'
      }}>
        {/* Bảng theo dõi trạng thái câu hỏi - Bên trái 40% */}
        <GlassCard className="question-tracker-card" style={{ 
          width: '40%',
          minWidth: '300px',
          position: 'sticky',
          top: '20px',
          maxHeight: 'calc(100vh - 100px)',
          overflowY: 'auto'
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
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row',
            gap: '10px', 
            fontSize: '11px',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            paddingTop: '10px',
            flexWrap: 'wrap'
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
        </GlassCard>

        {/* Phần câu hỏi - Bên phải 60% */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <GlassCard className="question-card fade-in-up">
            <h3 className="question-text">{questionText}</h3>
            <div className="options-grid">
              {/* Holland: Hiển thị rating scale */}
              {normalizedType === "holland" && ratingOptions.length > 0 ? (
                ratingOptions.map((option, idx) => (
                  <button
                    key={idx}
                    className="option-btn"
                    onClick={() => handleAnswer(option.score)}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                /* MBTI: Hiển thị multiple choice */
                question.options?.map((option, idx) => {
                  const answerValue = option.value;
                  return (
                    <button
                      key={idx}
                      className="option-btn"
                      onClick={() => handleAnswer(answerValue)}
                    >
                      {option.text}
                    </button>
                  );
                })
              )}
            </div>
          </GlassCard>

          {/* Các nút điều khiển */}
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              className="btn-quiz-outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              style={{ 
              opacity: currentQuestion === 0 ? 0.5 : 1,
              cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
             Quay lại
          </button>
          
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
            className="btn-quiz-primary"
            onClick={handleSubmitQuiz}
            style={{ 
              backgroundColor: canSubmit() ? '#22c55e' : '#6b7280',
              cursor: canSubmit() ? 'pointer' : 'not-allowed',
              opacity: canSubmit() ? 1 : 0.6
            }}
          >
            <Send size={16} style={{ marginRight: '6px' }} />
            {canSubmit() 
              ? 'Nộp bài' 
              : `Nộp bài (${Object.keys(answers).length}/${questions.length})`
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
      </div>
    </div>
  );
};

export default QuizGame;