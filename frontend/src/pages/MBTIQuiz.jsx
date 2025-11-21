// Trang bài trắc nghiệm MBTI (Myers-Briggs Type Indicator)
// Xác định 16 loại tính cách dựa trên 4 chiều độc lập: E/I, S/N, T/F, J/P
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import "../assets/css-custom/quiz.css";

// Dữ liệu các câu hỏi MBTI - 8 câu hỏi, mỗi câu xác định một trong 4 chiều của MBTI
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

// Dữ liệu 16 loại tính cách MBTI - mỗi loại có tiêu đề tiếng Anh, tiếng Việt, mô tả và gợi ý nghề nghiệp
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
    careers: ["Kỹ sư phần mềm", "Nhà khoa học", "Nhà kiến trúc", "Nhà phân tích"],
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

// Thành phần Bài Trắc Nghiệm MBTI chính
const MBTIQuiz = () => {
  const navigate = useNavigate();
  // Trạng thái quản lý vị trí câu hỏi hiện tại
  const [currentQuestion, setCurrentQuestion] = useState(0);
  // Lưu trữ lựa chọn của người dùng cho mỗi câu hỏi
  const [answers, setAnswers] = useState({});
  // Kết quả MBTI cuối cùng (loại tính cách xác định)
  const [result, setResult] = useState(null);
  // Kiểm soát hiển thị màn hình bắt đầu
  const [quizStarted, setQuizStarted] = useState(false);

  // Hàm tính toán kết quả MBTI dựa trên các câu trả lời của người dùng
  const calculateResult = (finalAnswers) => {
    // Đối tượng đếm các loại tính cách (E/I, S/N, T/F, J/P)
    const counts = {
      E: 0,
      I: 0,
      S: 0,
      N: 0,
      T: 0,
      F: 0,
      J: 0,
      P: 0,
    };

    // Đếm số lần xuất hiện của mỗi loại từ các câu trả lời
    Object.values(finalAnswers).forEach((type) => {
      counts[type]++;
    });

    // Xác định loại MBTI dựa trên chiều chiếm đa số cho mỗi cặp
    const mbtiType =
      (counts.E >= counts.I ? "E" : "I") +
      (counts.S >= counts.N ? "S" : "N") +
      (counts.T >= counts.F ? "T" : "F") +
      (counts.J >= counts.P ? "J" : "P");

    // Trả về dữ liệu tương ứng với loại MBTI từ bảng MBTI_TYPES
    return MBTI_TYPES[mbtiType];
  };

  // Xử lý khi người dùng chọn một câu trả lời
  const handleAnswer = (answerType) => {
    // Cập nhật câu trả lời vào đối tượng answers
    const newAnswers = {
      ...answers,
      [currentQuestion]: answerType,
    };
    setAnswers(newAnswers);

    // Chuyển đến câu hỏi tiếp theo, hoặc hiển thị kết quả nếu đây là câu hỏi cuối
    if (currentQuestion < MBTI_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Tính toán kết quả MBTI cuối cùng
      const resultType = calculateResult(newAnswers);
      setResult(resultType);
    }
  };

  // Xử lý khi người dùng muốn làm lại bài trắc nghiệm
  const handleReset = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
    setQuizStarted(false);
  };

  // Hiển thị màn hình bắt đầu bài trắc nghiệm nếu chưa bắt đầu
  if (!quizStarted) {
    return (
      <div className="quiz-page">
        <Header />
        <main className="quiz-container">
          <div className="quiz-start-screen">
            <div className="quiz-start-content">
              <h2>MBTI Personality Test</h2>
              <p>Khám phá loại tính cách Myers-Briggs của bạn</p>
              <p className="quiz-start-description">
                Bài trắc nghiệm này gồm 8 câu hỏi sẽ giúp xác định loại tính cách MBTI của bạn.
                Câu trả lời sẽ giúp bạn hiểu rõ hơn về bản thân và tìm kiếm những lựa chọn sự nghiệp phù hợp.
              </p>
              <button
                className="btn btn-quiz"
                onClick={() => setQuizStarted(true)}
                style={{ background: "#4f46e5" }}
              >
                Bắt đầu trắc nghiệm
              </button>
              <button className="btn btn-outline" onClick={() => navigate("/quiz")}>
                Quay lại
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (result) {
    return (
      <div className="quiz-page">
        <Header />
        <main className="quiz-container">
          <div className="quiz-result">
            <div className="result-card" style={{ borderTopColor: result.color }}>
              <div className="result-type" style={{ color: result.color }}>
                {MBTI_QUESTIONS.length}/{MBTI_QUESTIONS.length} câu hỏi hoàn thành
              </div>
              <h2 className="result-title">
                Loại tính cách của bạn là: <span style={{ color: result.color }}>{result.vi}</span>
              </h2>
              <p className="result-subtitle">{result.title}</p>
              <p className="result-description">{result.description}</p>

              <div className="result-section">
                <h3>Ngành nghề phù hợp:</h3>
                <div className="result-careers">
                  {result.careers.map((career, idx) => (
                    <div key={idx} className="career-tag">
                      {career}
                    </div>
                  ))}
                </div>
              </div>

              <div className="result-actions">
                <button
                  className="btn btn-quiz"
                  style={{ background: result.color }}
                  onClick={handleReset}
                >
                  Làm lại bài trắc nghiệm
                </button>
                <button className="btn btn-outline" onClick={() => navigate("/quiz")}>
                  Chọn bài khác
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const question = MBTI_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / MBTI_QUESTIONS.length) * 100;

  return (
    <div className="quiz-page">
      <Header />
      <main className="quiz-container">
        <div className="quiz-question-wrapper">
          <div className="quiz-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%`, background: "#4f46e5" }}
              ></div>
            </div>
            <div className="progress-text">
              Câu {currentQuestion + 1}/{MBTI_QUESTIONS.length}
            </div>
          </div>

          <div className="quiz-question-card">
            <h3 className="question-text">{question.question}</h3>

            <div className="question-options">
              <button
                className="option-button"
                onClick={() => handleAnswer(question.a.type)}
              >
                <span className="option-text">{question.a.text}</span>
              </button>
              <button
                className="option-button"
                onClick={() => handleAnswer(question.b.type)}
              >
                <span className="option-text">{question.b.text}</span>
              </button>
            </div>
          </div>

          <button className="btn btn-outline" onClick={() => navigate("/quiz")}>
            Hủy bỏ
          </button>
        </div>
      </main>
    </div>
  );
};

export default MBTIQuiz;
