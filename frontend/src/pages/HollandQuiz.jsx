// Trang bài trắc nghiệm Mã Holland - Xác định 6 loại sở thích và khả năng sự nghiệp (R, I, A, S, E, C)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import "../assets/css-custom/quiz.css";

// Dữ liệu các câu hỏi Mã Holland - 12 câu hỏi, mỗi câu đo lường sở thích trong 6 loại mã Holland
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

// Dữ liệu 6 mã Holland - mỗi loại có tên, emoji, mô tả và gợi ý nghề nghiệp phù hợp
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

// Thành phần Bài Trắc Nghiệm Mã Holland chính
const HollandQuiz = () => {
  const navigate = useNavigate();
  // Trạng thái quản lý vị trí câu hỏi hiện tại
  const [currentQuestion, setCurrentQuestion] = useState(0);
  // Lưu trữ lựa chọn của người dùng cho mỗi câu hỏi
  const [answers, setAnswers] = useState({});
  // Kết quả Mã Holland cuối cùng (3 loại chính, phụ, cấp 3)
  const [result, setResult] = useState(null);
  // Kiểm soát hiển thị màn hình bắt đầu
  const [quizStarted, setQuizStarted] = useState(false);

  // Hàm tính toán kết quả Mã Holland - xác định 3 loại mã hàng đầu
  const calculateResult = (finalAnswers) => {
    // Đối tượng đếm số lần xuất hiện của mỗi mã Holland (R, I, A, S, E, C)
    const counts = {
      R: 0,
      I: 0,
      A: 0,
      S: 0,
      E: 0,
      C: 0,
    };

    // Đếm số lần xuất hiện của mỗi mã từ các câu trả lời
    Object.values(finalAnswers).forEach((code) => {
      counts[code]++;
    });

    // Sắp xếp các mã theo tần suất giảm dần
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    // Lấy 3 mã hàng đầu
    const topThree = sorted.slice(0, 3).map((entry) => entry[0]);

    // Trả về đối tượng kết quả với thông tin chi tiết về 3 loại mã hàng đầu
    return {
      primary: HOLLAND_CODES[topThree[0]],
      secondary: HOLLAND_CODES[topThree[1]],
      tertiary: HOLLAND_CODES[topThree[2]],
      topThree,
    };
  };

  // Xử lý khi người dùng chọn một câu trả lời
  const handleAnswer = (answerCode) => {
    // Cập nhật câu trả lời vào đối tượng answers
    const newAnswers = {
      ...answers,
      [currentQuestion]: answerCode,
    };
    setAnswers(newAnswers);

    // Chuyển đến câu hỏi tiếp theo, hoặc hiển thị kết quả nếu đây là câu hỏi cuối
    if (currentQuestion < HOLLAND_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Tính toán kết quả Mã Holland cuối cùng
      const resultData = calculateResult(newAnswers);
      setResult(resultData);
    }
  };

  // Xử lý khi người dùng muốn làm lại bài trắc nghiệm
  const handleReset = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
    setQuizStarted(false);
  };

  if (!quizStarted) {
    return (
      <div className="quiz-page">
        <Header />
        <main className="quiz-container">
          <div className="quiz-start-screen">
            <div className="quiz-start-content">
              <h2>Holland Code Test</h2>
              <p>Khám phá loại công việc Holland Code của bạn</p>
              <p className="quiz-start-description">
                Bài trắc nghiệm này gồm 12 câu hỏi sẽ giúp xác định loại Holland Code phù hợp với bạn nhất.
                Kết quả sẽ cho bạn biết những loại công việc nào phù hợp với tính cách và sở thích của bạn.
              </p>
              <button
                className="btn btn-quiz"
                onClick={() => setQuizStarted(true)}
                style={{ background: "#7c3aed" }}
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
            <div className="result-card" style={{ borderTopColor: result.primary.color }}>
              <div className="result-type" style={{ color: result.primary.color }}>
                {HOLLAND_QUESTIONS.length}/{HOLLAND_QUESTIONS.length} câu hỏi hoàn thành
              </div>
              <h2 className="result-title">
                Mã Holland Code của bạn: <span style={{ color: result.primary.color }}>{result.topThree.join("")}</span>
              </h2>

              <div className="holland-results">
                <div className="holland-code-result">
                  <h3>
                    <span className="holland-emoji">{result.primary.emoji}</span>
                    Loại chính: {result.primary.name}
                  </h3>
                  <p>{result.primary.description}</p>
                  <div className="result-careers">
                    {result.primary.careers.map((career, idx) => (
                      <div key={idx} className="career-tag" style={{ background: result.primary.color }}>
                        {career}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="holland-code-result">
                  <h3>
                    <span className="holland-emoji">{result.secondary.emoji}</span>
                    Loại phụ: {result.secondary.name}
                  </h3>
                  <p>{result.secondary.description}</p>
                  <div className="result-careers">
                    {result.secondary.careers.map((career, idx) => (
                      <div key={idx} className="career-tag" style={{ background: result.secondary.color }}>
                        {career}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="holland-code-result">
                  <h3>
                    <span className="holland-emoji">{result.tertiary.emoji}</span>
                    Loại thứ ba: {result.tertiary.name}
                  </h3>
                  <p>{result.tertiary.description}</p>
                  <div className="result-careers">
                    {result.tertiary.careers.map((career, idx) => (
                      <div key={idx} className="career-tag" style={{ background: result.tertiary.color }}>
                        {career}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="result-actions">
                <button
                  className="btn btn-quiz"
                  style={{ background: result.primary.color }}
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

  const question = HOLLAND_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / HOLLAND_QUESTIONS.length) * 100;

  return (
    <div className="quiz-page">
      <Header />
      <main className="quiz-container">
        <div className="quiz-question-wrapper">
          <div className="quiz-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%`, background: "#7c3aed" }}
              ></div>
            </div>
            <div className="progress-text">
              Câu {currentQuestion + 1}/{HOLLAND_QUESTIONS.length}
            </div>
          </div>

          <div className="quiz-question-card">
            <h3 className="question-text">{question.question}</h3>

            <div className="question-options">
              <button
                className="option-button"
                onClick={() => handleAnswer(question.a.code)}
              >
                <span className="option-text">{question.a.text}</span>
              </button>
              <button
                className="option-button"
                onClick={() => handleAnswer(question.b.code)}
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

export default HollandQuiz;
