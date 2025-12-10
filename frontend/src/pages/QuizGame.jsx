import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GlassCard from "../components/common/GlassCard";
import assessmentApi from "../api/assessmentApi";
import { getAccessToken } from "../api/authApi";
import { getQuizConfig } from "../assets/js/quizConfig";
import "../assets/css-custom/quiz-game.css";

const QuizGame = () => {
  const { type } = useParams(); // "mbti" hoặc "holland"
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const config = getQuizConfig(type?.toLowerCase());

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setError("Vui lòng đăng nhập để làm bài trắc nghiệm");
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
        const response = await assessmentApi.getQuestions(config.apiType);
        if (response.success) {
          setQuestions(response.questions);
        } else {
          setError("Không thể tải câu hỏi. Vui lòng thử lại.");
        }
      } catch (err) {
        setError("Lỗi kết nối");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [config]);

  // Trả về sớm sau khi tất cả hooks được gọi
  if (!config) {
    return (
      <div className="quiz-wrapper">
        <GlassCard className="quiz-start-card">
          <p className="text-danger">Quiz type không hợp lệ</p>
        </GlassCard>
      </div>
    );
  }

  const handleAnswer = (value) => {
    const newAnswers = {
      ...answers,
      [currentQuestion + 1]: value,
    };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers) => {
    try {
      setLoading(true);
      const response = await assessmentApi.submitAssessment(config.apiType, finalAnswers);
      if (response.success) {
        setResult(response.result);
      } else {
        setError("Lỗi khi lưu kết quả. Vui lòng thử lại.");
      }
    } catch (err) {
      setError("Lỗi kết nối khi gửi kết quả.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
    setQuizStarted(false);
  };

  // Trạng thái đang tải
  if (loading && !quizStarted) {
    return (
      <div className="quiz-wrapper">
        <GlassCard className="quiz-start-card">
          <p className="text-white-50">Đang tải câu hỏi...</p>
        </GlassCard>
      </div>
    );
  }

  // Trạng thái lỗi
  if (error && !quizStarted) {
    return (
      <div className="quiz-wrapper">
        <GlassCard className="quiz-start-card">
          <p className="text-danger">{error}</p>
          <button
            className="btn-quiz-primary"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </button>
        </GlassCard>
      </div>
    );
  }

  // Màn hình bắt đầu
  if (!quizStarted) {
    return (
      <div className="quiz-wrapper">
        <GlassCard className="quiz-start-card fade-in-up">
          <div className="quiz-icon-large">{config.icon}</div>
          <h2>{config.title}</h2>
          <p className="text-white-50">
            {config.description} qua {questions.length} câu hỏi.
          </p>
          <div className="quiz-start-actions">
            <button
              className="btn-quiz-primary"
              onClick={() => setQuizStarted(true)}
            >
              Bắt đầu ngay
            </button>
            <button
              className="btn-quiz-outline"
              onClick={() => navigate("/trac-nghiem")}
            >
              Quay lại
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Màn hình kết quả
  if (result) {
    const resultCode = result.result_code;

    // Kết quả MBTI (một loại tính cách)
    if (config.resultDisplay === "single") {
      const typeInfo = config.types?.[resultCode];
      
      // Kiểm tra loại MBTI có tồn tại hay không
      if (!typeInfo) {
        return (
          <div className="quiz-wrapper">
            <GlassCard className="quiz-result-card fade-in-up">
              <p className="text-danger">Lỗi: Loại tính cách \"{resultCode}\" không tồn tại</p>
            </GlassCard>
          </div>
        );
      }
      
      return (
        <div className="quiz-wrapper">
          <GlassCard className="quiz-result-card fade-in-up">
            <div style={{ textAlign: "center" }}>
              <span
                className="result-badge"
                style={{ background: typeInfo.color || "#6366f1" }}
              >
                {resultCode}
              </span>
              <h1 className="result-title-main">{typeInfo.vi || "Loại tính cách"}</h1>
              <p className="result-desc">{typeInfo.description || ""}</p>

              <div className="result-section-box">
                <h4>💼 Nghề nghiệp phù hợp</h4>
                <div className="tags-container">
                  {Array.isArray(typeInfo.careers) && typeInfo.careers.length > 0 ? (
                    typeInfo.careers.map((career, idx) => (
                      <span
                        key={idx}
                        className="career-tag"
                        style={{
                          background: `${typeInfo.color || "#6366f1"}40`,
                          color: typeInfo.color || "#6366f1",
                        }}
                      >
                        {career}
                      </span>
                    ))
                  ) : (
                    <p className="text-white-50">Không có dữ liệu</p>
                  )}
                </div>
              </div>

              <div className="quiz-actions-row">
                <button className="btn-quiz-primary" onClick={handleReset}>
                  Làm lại
                </button>
                <button
                  className="btn-quiz-outline"
                  onClick={() => navigate("/trang-nguoi-dung")}
                >
                  Đến Dashboard
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      );
    }

    // Kết quả Holland (lưới 3 mục)
    if (config.resultDisplay === "grid") {
      // Kiểm tra định dạng mã kết quả
      if (!resultCode || typeof resultCode !== "string" || resultCode.length === 0) {
        return (
          <div className="quiz-wrapper">
            <GlassCard className="quiz-result-card fade-in-up">
              <p className="text-danger">Lỗi: Kết quả không hợp lệ</p>
            </GlassCard>
          </div>
        );
      }
      
      const topThree = resultCode.split("").slice(0, 3).filter(code => code && config.types?.[code]);
      
      // Kiểm tra chúng tôi có ít nhất một mã hợp lệ
      if (topThree.length === 0) {
        return (
          <div className="quiz-wrapper">
            <GlassCard className="quiz-result-card fade-in-up">
              <p className="text-danger">Lỗi: Không tìm thấy nhóm sở thích phù hợp</p>
            </GlassCard>
          </div>
        );
      }
      
      return (
        <div className="quiz-wrapper">
          <GlassCard className="quiz-result-card fade-in-up">
            <div style={{ textAlign: "center" }}>
              <span
                className="result-badge"
                style={{ background: "#0891b2" }}
              >
                {resultCode}
              </span>
              <h1 className="result-title-main">Kết Quả Holland</h1>
              <p className="result-desc">
                Ba nhóm sở thích chính của bạn là {topThree.join(", ")}
              </p>

              <div className="holland-grid">
                {topThree.map((code) => {
                  const holland = config.types?.[code];
                  if (!holland) return null;
                  return (
                    <div
                      key={code}
                      className="holland-item-box"
                      style={{ borderColor: holland.color }}
                    >
                      <span className="holland-emoji">{holland.emoji}</span>
                      <h4 style={{ color: holland.color, marginBottom: "12px" }}>
                        {holland.name}
                      </h4>
                      <p style={{ fontSize: "0.9rem", color: "#cbd5e1", marginBottom: "12px" }}>
                        {holland.description}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px" }}>
                        {holland.careers.map((career, idx) => (
                          <span
                            key={idx}
                            className="career-tag-small"
                            style={{ background: holland.color }}
                          >
                            {career}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="quiz-actions-row">
                <button className="btn-quiz-primary" onClick={handleReset}>
                  Làm lại
                </button>
                <button
                  className="btn-quiz-outline"
                  onClick={() => navigate("/trang-nguoi-dung")}
                >
                  Đến Dashboard
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      );
    }
  }

  // Màn hình làm trắc nghiệm
  if (questions.length === 0) {
    return (
      <div className="quiz-wrapper">
        <GlassCard className="quiz-start-card">
          <p className="text-white-50">Không có câu hỏi. Vui lòng thử lại.</p>
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
          <button className="btn-quiz-primary" onClick={() => window.location.reload()}>
            Reload
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
        </GlassCard>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const questionKey = type.toLowerCase() === "holland" ? "prompt" : "question";
  const questionText = question[questionKey];
  
  // Kiểm tra văn bản câu hỏi có tồn tại hay không
  if (!questionText) {
    return (
      <div className="quiz-wrapper">
        <GlassCard className="quiz-start-card">
          <p className="text-danger">Lỗi: Câu hỏi không hợp lệ</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="quiz-wrapper">
      <div className="quiz-playing-container">
        <div className="quiz-progress-container">
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="progress-text">
            Câu {currentQuestion + 1}/{questions.length}
          </span>
        </div>

        <GlassCard className="question-card fade-in-up">
          <h3 className="question-text">{questionText}</h3>
          <div className="options-grid">
            {question.options?.map((option, idx) => {
              const answerValue = type.toLowerCase() === "holland" 
                ? option.group_code 
                : option.value;
              
              return (
                <button
                  key={idx}
                  className="option-btn"
                  onClick={() => handleAnswer(answerValue)}
                >
                  <span className="option-label">{String.fromCharCode(65 + idx)}</span>
                  {option.text}
                </button>
              );
            })}
          </div>
        </GlassCard>

        <button
          className="btn-text-only"
          onClick={() => navigate("/trac-nghiem")}
        >
          Hủy bỏ bài thi
        </button>
      </div>
    </div>
  );
};

export default QuizGame;
