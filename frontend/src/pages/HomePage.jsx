import React from "react";
import { Link } from "react-router-dom";
import GlassCard from "../components/common/GlassCard";
import CountUp from "../components/common/CountUp"; // Tận dụng component đếm số
import UserAvt from "../assets/img/image-removebg-preview-avt-user-1.png";
import Career from "../assets/img/image-removebg-preview-career.png";
import "../assets/css-custom/homepage.css";

// --- DỮ LIỆU TĨNH (Đưa ra ngoài để component gọn hơn) ---
const features = [
  {
    icon: "📝",
    title: "Trắc Nghiệm Tính Cách",
    description:
      "Khám phá bản thân qua bài test MBTI, Holland, Big Five với AI phân tích chuyên sâu.",
    color: "#4F46E5",
  },
  {
    icon: "🎯",
    title: "Định Hướng Nghề Nghiệp",
    description:
      "AI tư vấn nghề nghiệp phù hợp dựa trên tính cách, kỹ năng và xu hướng thị trường.",
    color: "#0891B2",
  },
  {
    icon: "📚",
    title: "Lộ Trình Học Tập",
    description:
      "Gợi ý lộ trình học tập cá nhân hóa với các khóa học, kỹ năng cần thiết.",
    color: "#7C3AED",
  },
  {
    icon: "🔄",
    title: "Chuyển Đổi Nghề Nghiệp",
    description:
      "Hỗ trợ chuyển ngành với roadmap chi tiết, đào tạo lại kỹ năng phù hợp.",
    color: "#DB2777",
  },
];

const stats = [
  { number: 50000, label: "Người Dùng", suffix: "+" },
  { number: 200, label: "Nghề Nghiệp", suffix: "+" },
  { number: 95, label: "Hài Lòng", suffix: "%" },
  { number: 1000, label: "Khóa Học", suffix: "+" },
];

const testimonials = [
  {
    name: "Nguyễn Văn A",
    role: "Software Engineer",
    content:
      "Nhờ AI Career Advisor, tôi đã tìm được đam mê và chuyển sang ngành IT thành công!",
    avatar: UserAvt,
  },
  {
    name: "Trần Thị B",
    role: "Marketing Manager",
    content:
      "Lộ trình học tập rất chi tiết, giúp tôi phát triển sự nghiệp một cách có hệ thống.",
    avatar: UserAvt,
  },
  {
    name: "Lê Minh C",
    role: "Data Analyst",
    content:
      "Bài test tính cách chính xác đến ngạc nhiên, định hướng nghề nghiệp rất phù hợp!",
    avatar: UserAvt,
  },
];

const HomePage = () => {
  return (
    <div className="homepage-content">
      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-text">
            <h1 className="hero-title">
              Khám Phá Sự Nghiệp <br />
              <span className="text-gradient">Cùng Trí Tuệ Nhân Tạo</span>
            </h1>
            <p className="hero-subtitle">
              Định hướng nghề nghiệp thông minh, cá nhân hóa với công nghệ AI
              tiên tiến. Tìm đúng con đường, phát triển đúng hướng ngay hôm nay.
            </p>
            <div className="hero-buttons">
              <Link to="/trac-nghiem" className="btn btn-hero-primary">
                Bắt Đầu Ngay
              </Link>
              <Link to="/about" className="btn btn-hero-outline">
                Tìm Hiểu Thêm
              </Link>
            </div>
          </div>

          <div className="hero-image-wrapper">
            <div className="floating-img">
              <img src={Career} alt="AI Career" />
            </div>
            {/* Hiệu ứng glow phía sau ảnh */}
            <div className="glow-effect"></div>
          </div>
        </div>
      </section>

      {/* 2. Stats Section - Sử dụng GlassCard và CountUp */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <GlassCard key={index} className="stat-card-home">
                <h2 className="stat-number">
                  <CountUp end={stat.number} duration={2000} />
                  {stat.suffix}
                </h2>
                <p className="stat-label">{stat.label}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Tính Năng Nổi Bật</h2>
            <p className="section-subtitle">
              Công nghệ AI hiện đại giúp bạn định hướng chính xác
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <GlassCard key={index} className="feature-card-home">
                <div
                  className="feature-icon"
                  style={{
                    background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}40)`,
                    color: feature.color,
                  }}
                >
                  {feature.icon}
                </div>
                <h4 className="feature-title">{feature.title}</h4>
                <p className="feature-description">{feature.description}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section className="process-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Quy Trình Hoạt Động</h2>
            <p className="section-subtitle">
              3 bước đơn giản để tìm ra con đường sự nghiệp
            </p>
          </div>
          <div className="process-grid">
            {/* Step 1 */}
            <div className="process-item">
              <div className="process-step-bg"></div>
              <div className="process-number num-1">1</div>
              <h4 className="process-title">Làm Bài Test</h4>
              <p>
                Hoàn thành bài trắc nghiệm tính cách và năng lực chuẩn quốc tế.
              </p>
            </div>
            {/* Step 2 */}
            <div className="process-item">
              <div className="process-step-bg"></div>
              <div className="process-number num-2">2</div>
              <h4 className="process-title">AI Phân Tích</h4>
              <p>
                Hệ thống AI đối chiếu dữ liệu và đưa ra gợi ý nghề nghiệp phù
                hợp nhất.
              </p>
            </div>
            {/* Step 3 */}
            <div className="process-item">
              <div className="process-step-bg"></div>
              <div className="process-number num-3">3</div>
              <h4 className="process-title">Nhận Lộ Trình</h4>
              <p>
                Nhận lộ trình học tập chi tiết và bắt đầu hành trình phát triển.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Câu Chuyện Thành Công</h2>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((item, index) => (
              <GlassCard key={index} className="testimonial-card">
                <div className="testimonial-header">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="user-avatar"
                  />
                  <div>
                    <h5 className="user-name">{item.name}</h5>
                    <span className="user-role">{item.role}</span>
                  </div>
                </div>
                <p className="user-quote">"{item.content}"</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CTA Section */}
      <section className="cta-section">
        <GlassCard className="container cta-box">
          <h2 className="cta-title">Sẵn Sàng Khám Phá Tương Lai?</h2>
          <p>
            Tham gia cùng hàng nghìn người đã tìm thấy con đường sự nghiệp lý
            tưởng.
          </p>
          <Link to="/dang-ky" className="btn btn-hero-primary btn-lg">
            Đăng Ký Miễn Phí
          </Link>
        </GlassCard>
      </section>
    </div>
  );
};

export default HomePage;
