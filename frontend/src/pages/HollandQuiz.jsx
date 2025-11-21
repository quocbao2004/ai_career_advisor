import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/common/GlassCard";
import "../assets/css-custom/quiz-game.css";

// --- DỮ LIỆU HOLLAND (Giữ nguyên logic) ---
const HOLLAND_QUESTIONS = [
  {
    id: 1,
    question: "Bạn thích làm việc với:",
    a: { text: "Máy móc, công cụ, vật liệu", code: "R" },
    b: { text: "Ý tưởng, khái niệm, lý thuyết", code: "I" },
  },
  {
    id: 2,
    question: "Khi làm việc, bạn thích:",
    a: { text: "Thực hiện công việc có kết quả rõ ràng", code: "R" },
    b: { text: "Tìm hiểu sâu về các vấn đề", code: "I" },
  },
  {
    id: 3,
    question: "Bạn thích hoạt động sáng tạo như:",
    a: { text: "Xây dựng, thi công, sửa chữa", code: "R" },
    b: { text: "Thiết kế, vẽ, tạo tác phẩm", code: "A" },
  },
  {
    id: 4,
    question: "Bạn là một người:",
    a: { text: "Thực dụng và thiết thực", code: "R" },
    b: { text: "Tưởng tượng và sáng tạo", code: "A" },
  },
  {
    id: 5,
    question: "Bạn thích giao tiếp với con người để:",
    a: { text: "Hợp tác và làm việc chung", code: "S" },
    b: { text: "Tìm hiểu và học hỏi từ họ", code: "I" },
  },
  {
    id: 6,
    question: "Trong công việc, bạn ưu tiên:",
    a: { text: "Mối quan hệ con người tốt", code: "S" },
    b: { text: "Kết quả hiệu quả và chuyên nghiệp", code: "C" },
  },
  {
    id: 7,
    question: "Bạn thích giúp đỡ người khác bằng cách:",
    a: { text: "Chăm sóc, hỗ trợ và tư vấn", code: "S" },
    b: { text: "Huấn luyện, giáo dục họ", code: "S" },
  },
  {
    id: 8,
    question: "Bạn có khả năng:",
    a: { text: "Lãnh đạo và ảnh hưởng đến người khác", code: "E" },
    b: { text: "Ngoại giao và thuyết phục", code: "E" },
  },
  {
    id: 9,
    question: "Bạn thích công việc liên quan đến:",
    a: { text: "Kinh doanh và tiếp thị", code: "E" },
    b: { text: "Tài chính và quản lý", code: "C" },
  },
  {
    id: 10,
    question: "Sở thích của bạn:",
    a: { text: "Nằm ngoài môi trường văn phòng", code: "R" },
    b: { text: "Có tính quy luật và rõ ràng", code: "C" },
  },
  {
    id: 11,
    question: "Bạn muốn sự nghiệp của mình:",
    a: { text: "Giúp tạo ra những thứ mới", code: "A" },
    b: { text: "Mang lại tác động xã hội", code: "S" },
  },
  {
    id: 12,
    question: "Bạn tự nhận thức mình là:",
    a: { text: "Độc lập và tự chủ", code: "E" },
    b: { text: "Cẩn thận và chi tiết", code: "C" },
  },
];

const HOLLAND_CODES = {
  R: {
    name: "Realistic (Thực Tế)",
    emoji: "🔧",
    description: "Bạn thích làm việc với tay, máy móc, công cụ",
    careers: ["Kỹ sư", "Thợ sửa chữa", "Xây dựng", "Nông nghiệp"],
    color: "#ef4444",
  },
  I: {
    name: "Investigative (Nghiên Cứu)",
    emoji: "🔬",
    description: "Bạn thích phân tích, tìm hiểu sâu vấn đề",
    careers: ["Nhà khoa học", "Nhà toán học", "Kỹ sư phần mềm", "Dữ liệu"],
    color: "#06b6d4",
  },
  A: {
    name: "Artistic (Nghệ Thuật)",
    emoji: "🎨",
    description: "Bạn thích sáng tạo, tự do, diễn đạt cảm xúc",
    careers: ["Họa sĩ", "Nhạc sĩ", "Nhà thiết kế", "Nhà văn"],
    color: "#ec4899",
  },
  S: {
    name: "Social (Xã Hội)",
    emoji: "👥",
    description: "Bạn thích giúp đỡ, làm việc với con người",
    careers: ["Giáo viên", "Tư vấn", "Điều dưỡng", "Công tác xã hội"],
    color: "#f59e0b",
  },
  E: {
    name: "Enterprising (Kinh Doanh)",
    emoji: "💼",
    description: "Bạn thích lãnh đạo, ảnh hưởng, quản lý",
    careers: ["CEO", "Tiếp thị", "Bán hàng", "Quản lý dự án"],
    color: "#eab308",
  },
  C: {
    name: "Conventional (Quy Ước)",
    emoji: "📋",
    description: "Bạn thích tổ chức, quy luật, kỹ năng hành chính",
    careers: ["Kế toán", "Hành chính", "Thư ký", "Quản lý tài chính"],
    color: "#8b5cf6",
  },
};

const HollandQuiz = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);

  const calculateResult = (finalAnswers) => {
    const counts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    Object.values(finalAnswers).forEach((code) => counts[code]++);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topThree = sorted.slice(0, 3).map((entry) => entry[0]);
    return {
      primary: HOLLAND_CODES[topThree[0]],
      secondary: HOLLAND_CODES[topThree[1]],
      tertiary: HOLLAND_CODES[topThree[2]],
      topThree,
    };
  };

  const handleAnswer = (answerCode) => {
    const newAnswers = { ...answers, [currentQuestion]: answerCode };
    setAnswers(newAnswers);
    if (currentQuestion < HOLLAND_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setResult(calculateResult(newAnswers));
    }
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
    setQuizStarted(false);
  };

  // --- Start Screen ---
  if (!quizStarted) {
    return (
      <div className="quiz-wrapper">
        <GlassCard className="quiz-start-card fade-in-up">
          <div className="quiz-icon-large">🎯</div>
          <h2>Trắc Nghiệm Holland</h2>
          <p className="text-white-50">
            Xác định 6 nhóm sở thích nghề nghiệp của bạn.
          </p>
          <div className="quiz-start-actions">
            <button
              className="btn-quiz-primary"
              onClick={() => setQuizStarted(true)}
              style={{ background: "#7c3aed" }}
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

  // --- Result Screen ---
  if (result) {
    return (
      <div className="quiz-wrapper">
        <GlassCard
          className="quiz-result-card fade-in-up"
          style={{ borderTop: `4px solid ${result.primary.color}` }}
        >
          <div className="text-center mb-4">
            <div
              className="result-badge"
              style={{ background: result.primary.color }}
            >
              Mã Holland: {result.topThree.join("")}
            </div>
          </div>

          {/* Hiển thị 3 mã chính phụ */}
          <div className="holland-grid">
            {[result.primary, result.secondary, result.tertiary].map(
              (item, i) => (
                <div
                  key={i}
                  className="holland-item-box"
                  style={{ borderColor: `${item.color}50` }}
                >
                  <div className="holland-emoji">{item.emoji}</div>
                  <h4 style={{ color: item.color }}>{item.name}</h4>
                  <p className="small text-white-50">{item.description}</p>
                  <div className="tags-container">
                    {item.careers.slice(0, 3).map((c, idx) => (
                      <span
                        key={idx}
                        className="career-tag-small"
                        style={{ background: item.color }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>

          <div className="quiz-actions-row mt-4">
            <button
              className="btn-quiz-primary"
              onClick={handleReset}
              style={{ background: result.primary.color }}
            >
              Làm lại
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

  // --- Question Screen ---
  const question = HOLLAND_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / HOLLAND_QUESTIONS.length) * 100;

  return (
    <div className="quiz-wrapper">
      <div className="quiz-playing-container">
        <div className="quiz-progress-container">
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%`, background: "#7c3aed" }}
            ></div>
          </div>
          <span className="progress-text">
            Câu {currentQuestion + 1}/{HOLLAND_QUESTIONS.length}
          </span>
        </div>

        <GlassCard className="question-card fade-in-up">
          <h3 className="question-text">{question.question}</h3>
          <div className="options-grid">
            <button
              className="option-btn"
              onClick={() => handleAnswer(question.a.code)}
            >
              <span className="option-label">A</span> {question.a.text}
            </button>
            <button
              className="option-btn"
              onClick={() => handleAnswer(question.b.code)}
            >
              <span className="option-label">B</span> {question.b.text}
            </button>
          </div>
        </GlassCard>
        <button
          className="btn-text-only"
          onClick={() => navigate("/trac-nghiem")}
        >
          Hủy bỏ
        </button>
      </div>
    </div>
  );
};

export default HollandQuiz;
