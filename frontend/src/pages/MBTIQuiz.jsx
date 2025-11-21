import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/common/GlassCard";
import "../assets/css-custom/quiz-game.css";

// --- DỮ LIỆU (Giữ nguyên logic của bạn) ---
const MBTI_QUESTIONS = [
  {
    id: 1,
    question: "Khi bạn gặp vấn đề, bạn thường:",
    a: { text: "Tập trung vào chi tiết cụ thể", type: "S" },
    b: { text: "Nhìn vào bức tranh toàn cảnh", type: "N" },
  },
  {
    id: 2,
    question: "Bạn thích nhất những công việc nào?",
    a: { text: "Có kết quả cụ thể, có thể nhìn thấy được", type: "S" },
    b: { text: "Đòi hỏi suy tưởng sáng tạo và tưởng tượng", type: "N" },
  },
  {
    id: 3,
    question: "Trong việc đưa ra quyết định, bạn dựa vào:",
    a: { text: "Logic và sự phân tích khách quan", type: "T" },
    b: { text: "Cảm xúc và ảnh hưởng đến con người", type: "F" },
  },
  {
    id: 4,
    question: "Bạn là người:",
    a: { text: "Có kế hoạch và tổ chức chặt chẽ", type: "J" },
    b: { text: "Linh hoạt và thích thích ứng", type: "P" },
  },
  {
    id: 5,
    question: "Bạn thường được coi là:",
    a: { text: "Một người hướng ngoại, thích giao tiếp", type: "E" },
    b: { text: "Một người khép kín, suy nghĩ nhiều", type: "I" },
  },
  {
    id: 6,
    question: "Sau khi làm việc chăm chỉ, bạn thích:",
    a: { text: "Thư giãn một mình hoặc với những người thân thiết", type: "I" },
    b: { text: "Đi ra ngoài và giao lưu với mọi người", type: "E" },
  },
  {
    id: 7,
    question: "Khi học cái gì mới, bạn thích:",
    a: { text: "Lý thuyết và các khái niệm trừu tượng", type: "N" },
    b: { text: "Ứng dụng thực tế và ví dụ cụ thể", type: "S" },
  },
  {
    id: 8,
    question: "Bạn cho rằng là quan trọng hơn?",
    a: { text: "Công bằng và nguyên tắc", type: "T" },
    b: { text: "Hòa hợp và cảm xúc của mọi người", type: "F" },
  },
];

const MBTI_TYPES = {
  ISTJ: {
    title: "Logistician",
    vi: "Nhà Logistics",
    description: "Có trách nhiệm, tổ chức, đáng tin cậy và trung thực",
    careers: ["Kỹ sư", "Luật sư", "Kế toán", "Quản lý dự án"],
    color: "#4f46e5",
  },
  ISFJ: {
    title: "Defender",
    vi: "Người Bảo Vệ",
    description: "Chu đáo, hỗ trợ và có trách nhiệm",
    careers: ["Điều dưỡng", "Giáo viên", "Nhân viên xã hội", "Quản lý"],
    color: "#0891b2",
  },
  INFJ: {
    title: "Advocate",
    vi: "Cổ Động Viên",
    description: "Có tầm nhìn, tường thuận và thấu hiểu con người",
    careers: ["Tư vấn", "Tâm lý học", "Nhà lãnh đạo", "Diễn giả"],
    color: "#7c3aed",
  },
  INTJ: {
    title: "Architect",
    vi: "Kiến Trúc Sư",
    description: "Chiến lược, độc lập và có tư duy phê phán",
    careers: [
      "Kỹ sư phần mềm",
      "Nhà khoa học",
      "Nhà kiến trúc",
      "Nhà phân tích",
    ],
    color: "#db2777",
  },
  ISTP: {
    title: "Virtuoso",
    vi: "Nghệ Sĩ Tài Năng",
    description: "Linh hoạt, thực dụng và có kỹ năng giải quyết vấn đề",
    careers: ["Kỹ sư", "Thợ sửa chữa", "Lập trình viên", "Phi công"],
    color: "#d4af37",
  },
  ISFP: {
    title: "Adventurer",
    vi: "Nhà Phiêu Lưu",
    description: "Nhạy cảm, thân thiện và yêu cái mới",
    careers: ["Thiết kế", "Họa sĩ", "Đầu bếp", "Nước hoa"],
    color: "#f97316",
  },
  INFP: {
    title: "Mediator",
    vi: "Nhà Hòa Giải",
    description: "Sáng tạo, lý tưởng và thích giúp đỡ người khác",
    careers: ["Nhà văn", "Tư vấn", "Nhà thiết kế", "Ngoại giao"],
    color: "#ec4899",
  },
  INTP: {
    title: "Logician",
    vi: "Nhà Lôgic",
    description: "Tò mò, độc lập và có tư duy logic mạnh",
    careers: ["Lập trình viên", "Nhà toán học", "Nhà khoa học", "Dữ liệu"],
    color: "#06b6d4",
  },
  ESTP: {
    title: "Entrepreneur",
    vi: "Người Kinh Doanh",
    description: "Năng động, linh hoạt và yêu thích thách thức",
    careers: ["Bán hàng", "Kinh doanh", "Tiếp thị", "Thương mại"],
    color: "#eab308",
  },
  ESFP: {
    title: "Entertainer",
    vi: "Người Vui Nhộn",
    description: "Vui vẻ, thân thiện và yêu sự chú ý",
    careers: ["Giám đốc sáng tạo", "Biểu diễn", "Kinh doanh", "Tiếp thị"],
    color: "#f43f5e",
  },
  ENFP: {
    title: "Campaigner",
    vi: "Người Vận Động",
    description: "Sôi nổi, sáng tạo và yêu giúp đỡ người khác",
    careers: ["Nhân sự", "Tiếp thị", "Tư vấn", "Giáo dục"],
    color: "#a78bfa",
  },
  ENTP: {
    title: "Debater",
    vi: "Người Tranh Luận",
    description: "Thông minh, tò mò và yêu thích các cuộc tranh luận",
    careers: ["Luật sư", "Kỹ sư", "Nhà khoa học", "Tiến sĩ"],
    color: "#14b8a6",
  },
  ESTJ: {
    title: "Executive",
    vi: "Nhân Viên Quản Lý",
    description: "Trách nhiệm, tổ chức và quan tâm đến kết quả",
    careers: ["Giám đốc", "Quản lý", "Quân đội", "Công vụ"],
    color: "#059669",
  },
  ESFJ: {
    title: "Consul",
    vi: "Tổng Lãnh Sự",
    description: "Thân thiện, hỗ trợ và tổ chức",
    careers: ["Quản lý nhân sự", "Bán hàng", "Tiếp thị", "Hành chính"],
    color: "#c084fc",
  },
  ENFJ: {
    title: "Protagonist",
    vi: "Nhân Vật Chính",
    description: "Có khả năng lãnh đạo, tươi sáng và truyền cảm hứng",
    careers: ["Giáo dục", "Quản lý", "Tư vấn", "Nhân sự"],
    color: "#f59e0b",
  },
  ENTJ: {
    title: "Commander",
    vi: "Chỉ Huy",
    description: "Chiến lược, quyết đoán và có tầm nhìn rộng",
    careers: ["CEO", "Nhà quản lý", "Nhà lãnh đạo", "Doanh nhân"],
    color: "#ef4444",
  },
};

const MBTIQuiz = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);

  const calculateResult = (finalAnswers) => {
    const counts = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    Object.values(finalAnswers).forEach((type) => counts[type]++);
    const mbtiType =
      (counts.E >= counts.I ? "E" : "I") +
      (counts.S >= counts.N ? "S" : "N") +
      (counts.T >= counts.F ? "T" : "F") +
      (counts.J >= counts.P ? "J" : "P");
    return MBTI_TYPES[mbtiType];
  };

  const handleAnswer = (answerType) => {
    const newAnswers = { ...answers, [currentQuestion]: answerType };
    setAnswers(newAnswers);
    if (currentQuestion < MBTI_QUESTIONS.length - 1) {
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

  // --- 1. Màn hình Bắt đầu ---
  if (!quizStarted) {
    return (
      <div className="quiz-wrapper">
        <GlassCard className="quiz-start-card fade-in-up">
          <div className="quiz-icon-large">🧠</div>
          <h2>Trắc Nghiệm MBTI</h2>
          <p className="text-white-50">
            Khám phá tính cách thật sự của bạn qua 8 câu hỏi ngắn.
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

  // --- 2. Màn hình Kết quả ---
  if (result) {
    return (
      <div className="quiz-wrapper">
        <GlassCard
          className="quiz-result-card fade-in-up"
          style={{ borderTop: `4px solid ${result.color}` }}
        >
          <div className="result-badge" style={{ background: result.color }}>
            MBTI Result
          </div>
          <h2 className="result-title-main">
            <span style={{ color: result.color }}>{result.vi}</span> (
            {Object.keys(MBTI_TYPES).find((key) => MBTI_TYPES[key] === result)})
          </h2>
          <p className="result-desc">{result.description}</p>

          <div className="result-section-box">
            <h4>Nghề nghiệp phù hợp:</h4>
            <div className="tags-container">
              {result.careers.map((career, idx) => (
                <span
                  key={idx}
                  className="career-tag"
                  style={{
                    background: `${result.color}30`,
                    color: result.color,
                    border: `1px solid ${result.color}`,
                  }}
                >
                  {career}
                </span>
              ))}
            </div>
          </div>

          <div className="quiz-actions-row">
            <button
              className="btn-quiz-primary"
              onClick={handleReset}
              style={{ background: result.color }}
            >
              Làm lại
            </button>
            <button
              className="btn-quiz-outline"
              onClick={() => navigate("/trac-nghiem")}
            >
              Bài test khác
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // --- 3. Màn hình Câu hỏi ---
  const question = MBTI_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / MBTI_QUESTIONS.length) * 100;

  return (
    <div className="quiz-wrapper">
      <div className="quiz-playing-container">
        {/* Progress Bar */}
        <div className="quiz-progress-container">
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%`, background: "#4f46e5" }}
            ></div>
          </div>
          <span className="progress-text">
            Câu {currentQuestion + 1}/{MBTI_QUESTIONS.length}
          </span>
        </div>

        {/* Question Card */}
        <GlassCard className="question-card fade-in-up">
          <h3 className="question-text">{question.question}</h3>
          <div className="options-grid">
            <button
              className="option-btn"
              onClick={() => handleAnswer(question.a.type)}
            >
              <span className="option-label">A</span>
              {question.a.text}
            </button>
            <button
              className="option-btn"
              onClick={() => handleAnswer(question.b.type)}
            >
              <span className="option-label">B</span>
              {question.b.text}
            </button>
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

export default MBTIQuiz;
