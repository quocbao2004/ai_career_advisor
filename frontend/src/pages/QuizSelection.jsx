import React from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/common/GlassCard";
import "../assets/css-custom/quiz.css";

const QuizSelection = () => {
  const navigate = useNavigate();

  const quizzes = [
    {
      id: "mbti",
      title: "MBTI Personality Test",
      vi: "Trắc Nghiệm Tính Cách MBTI",
      description:
        "Khám phá 16 nhóm tính cách Myers-Briggs. Xác định điểm mạnh, điểm yếu và môi trường làm việc lý tưởng.",
      icon: "",
      questions: "71 Câu hỏi",
      duration: "12-15 phút",
      difficulty: "Trung bình",
      color: "#4f46e5",
      btnColor: "linear-gradient(90deg, #4f46e5, #6366f1)",
    },
    {
      id: "holland",
      title: "Holland Code Test",
      vi: "Trắc Nghiệm Mật Mã Holland",
      description:
        "Xác định 6 nhóm sở thích nghề nghiệp (RIASEC). Tìm ra ngành nghề phù hợp nhất với năng lực tự nhiên.",
      icon: "",
      questions: "18 Câu hỏi",
      duration: "5-7 phút",
      difficulty: "Dễ",
      color: "#0891b2",
      btnColor: "linear-gradient(90deg, #0891b2, #06b6d4)",
    },
  ];

  const benefits = [
    {
      icon: "",
      title: "Tìm hướng đi",
      desc: "Xác định sở thích và năng lực thực sự",
    },
    {
      icon: "",
      title: "Phát triển",
      desc: "Nhận lộ trình học tập cá nhân hóa",
    },
    {
      icon: "",
      title: "Việc làm",
      desc: "Khám phá nghề nghiệp phù hợp xu hướng",
    },
    {
      icon: "",
      title: "Tương lai",
      desc: "Xây dựng kế hoạch dài hạn bền vững",
    },
  ];

  return (
    <div className="quiz-page-content">
      <div className="container">
        {/* 1. Hero Section */}
        <div className="quiz-hero text-center">
          <h1 className="gradient-text">Khám Phá Tiềm Năng Sự Nghiệp</h1>
          <p className="sub-text">
            Chọn một bài trắc nghiệm chuẩn quốc tế để bắt đầu hành trình thấu
            hiểu bản thân
          </p>
        </div>

        <div className="quiz-selection-grid">
          {quizzes.map((quiz) => (
            <GlassCard
              key={quiz.id}
              className="quiz-card-glass"
              onClick={() => navigate(`/trac-nghiem/${quiz.id}`)}
            >
              <div
                className="quiz-icon-wrapper"
                style={{
                  background: `${quiz.color}20`,
                  border: `1px solid ${quiz.color}40`,
                }}
              >
                <span style={{ fontSize: "2.5rem" }}>{quiz.icon}</span>
              </div>

              <div className="quiz-content">
                <h3 className="quiz-title-vi">{quiz.vi}</h3>
                <p className="quiz-title-en">{quiz.title}</p>
                <p className="quiz-desc">{quiz.description}</p>

                <div className="quiz-tags">
                  <span className="tag"> {quiz.questions}</span>
                  <span className="tag"> {quiz.duration}</span>
                  <span className={`tag difficulty difficulty-${quiz.id}`} style={{ color: quiz.color }}>
                    {quiz.difficulty}
                  </span>
                </div>

                <button
                  className="btn-start-quiz"
                  style={{ background: quiz.btnColor }}
                >
                  Bắt Đầu Ngay
                </button>
              </div>
            </GlassCard>
          ))}
        </div>

        <section className="quiz-benefits">
          <h2 className="section-title text-center mb-5">
            Tại sao nên làm trắc nghiệm?
          </h2>
          <div className="benefits-grid">
            {benefits.map((item, index) => (
              <GlassCard key={index} className="benefit-card">
                <div className="benefit-icon">{item.icon}</div>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </GlassCard>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default QuizSelection;
