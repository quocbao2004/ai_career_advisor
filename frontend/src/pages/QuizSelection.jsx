// Trang chọn bài trắc nghiệm - Hiển thị lựa chọn MBTI và Holland
import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import NeuralNetworkBackground from "../components/NeuralNetworkBackground";
import "../assets/css-custom/quiz.css";

const QuizSelection = () => {
  const navigate = useNavigate();

  // Xử lý khi người dùng chọn một bài trắc nghiệm
  const handleQuizSelect = (quizType) => {
    navigate(`/quiz/${quizType}`);
  };

  // Dữ liệu các bài trắc nghiệm
  const quizzes = [
    {
      id: "mbti",
      title: "MBTI Personality Test",
      vi: "Bài Trắc Nghiệm MBTI",
      description: "Khám phá 16 loại tính cách Myers-Briggs. Bài trắc nghiệm 8 câu hỏi để xác định điểm mạnh, điểm yếu và hướng nghề nghiệp phù hợp.",
      icon: "🧠",
      questions: 8,
      duration: "5 phút",
      color: "#4f46e5",
    },
    {
      id: "holland",
      title: "Holland Code Test",
      vi: "Bài Trắc Nghiệm Mã Holland",
      description: "Xác định 6 mã Holland về sở thích sự nghiệp. Bài trắc nghiệm 12 câu hỏi giúp bạn tìm ngành nghề phù hợp với khả năng.",
      icon: "🎯",
      questions: 12,
      duration: "8 phút",
      color: "#0891b2",
    },
  ];

  return (
    <div className="quiz-page">
      {/* Nền mạng neuron hoạt động */}
      <NeuralNetworkBackground />
      <Header />

      <div className="quiz-container">
        {/* Tiêu đề trang */}
        <div className="quiz-hero">
          <h1>Khám Phá Sự Nghiệp Của Bạn</h1>
          <p className="quiz-hero-sub">Chọn một bài trắc nghiệm để bắt đầu hành trình định hướng sự nghiệp của bạn</p>
        </div>

        {/* Lưới chọn bài trắc nghiệm */}
        <div className="quiz-selection-grid">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-card" onClick={() => handleQuizSelect(quiz.id)}>
              {/* Phần header với biểu tượng */}
              <div className="quiz-card-header" style={{ background: `linear-gradient(135deg, ${quiz.color}, ${quiz.color}99)` }}>
                <div className="quiz-icon">{quiz.icon}</div>
              </div>

              {/* Nội dung thẻ */}
              <div className="quiz-card-content">
                <h3 className="quiz-title">{quiz.vi}</h3>
                <p className="quiz-subtitle">{quiz.title}</p>
                <p className="quiz-description">{quiz.description}</p>

                {/* Thông tin về bài trắc nghiệm */}
                <div className="quiz-info">
                  <div className="quiz-info-item">
                    <span className="quiz-info-label">Câu hỏi</span>
                    <span className="quiz-info-value">{quiz.questions}</span>
                  </div>
                  <div className="quiz-info-item">
                    <span className="quiz-info-label">Thời gian</span>
                    <span className="quiz-info-value">{quiz.duration}</span>
                  </div>
                </div>

                {/* Nút bắt đầu */}
                <button className="btn-quiz" style={{ background: `linear-gradient(135deg, ${quiz.color}, ${quiz.color}99)` }}>
                  Bắt Đầu Ngay
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Phần thông tin bổ sung */}
        <section className="quiz-info-section">
          <div className="info-section-wrapper">
            <h2 className="info-section-title">Tại sao nên làm bài trắc nghiệm?</h2>
            <div className="info-cards">
              <div className="info-card">
                <div className="info-card-icon">🎯</div>
                <h3 className="info-card-title">Tìm hướng đi</h3>
                <p className="info-card-desc">Xác định những sở thích và khả năng thực sự của bạn</p>
              </div>
              <div className="info-card">
                <div className="info-card-icon">📈</div>
                <h3 className="info-card-title">Phát triển kỹ năng</h3>
                <p className="info-card-desc">Nhận lộ trình học tập được cá nhân hóa cho bạn</p>
              </div>
              <div className="info-card">
                <div className="info-card-icon">💼</div>
                <h3 className="info-card-title">Định hướng việc làm</h3>
                <p className="info-card-desc">Khám phá các nghề nghiệp phù hợp với tính cách bạn</p>
              </div>
              <div className="info-card">
                <div className="info-card-icon">🚀</div>
                <h3 className="info-card-title">Thành công sự nghiệp</h3>
                <p className="info-card-desc">Xây dựng kế hoạch phát triển dài hạn cho tương lai</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default QuizSelection;
