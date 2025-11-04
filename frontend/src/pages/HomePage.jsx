import React, { useState, useEffect } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import "../assets/css-custom/homepage.css";
import UserAvt from "../assets/img/image-removebg-preview-avt-user-1.png";
import Career from "../assets/img/image-removebg-preview-career.png";

const HomePage = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: "📝",
      title: "Trắc Nghiệm Tính Cách",
      description:
        "Khám phá bản thân qua bài test tính cách MBTI, Holland, Big Five với AI phân tích chuyên sâu",
      color: "#4F46E5",
    },
    {
      icon: "🎯",
      title: "Định Hướng Nghề Nghiệp",
      description:
        "AI tư vấn nghề nghiệp phù hợp dựa trên tính cách, kỹ năng và xu hướng thị trường",
      color: "#0891B2",
    },
    {
      icon: "📚",
      title: "Lộ Trình Học Tập",
      description:
        "Gợi ý lộ trình học tập cá nhân hóa với các khóa học, kỹ năng cần thiết cho sự nghiệp",
      color: "#7C3AED",
    },
    {
      icon: "🔄",
      title: "Chuyển Đổi Nghề Nghiệp",
      description:
        "Hỗ trợ chuyển ngành với roadmap chi tiết, đào tạo lại kỹ năng phù hợp",
      color: "#DB2777",
    },
  ];

  const stats = [
    { number: "50,000+", label: "Người Dùng" },
    { number: "200+", label: "Nghề Nghiệp" },
    { number: "95%", label: "Hài Lòng" },
    { number: "1000+", label: "Khóa Học" },
  ];

  const testimonials = [
    {
      name: "Nguyễn Văn A",
      role: "Software Engineer",
      content:
        "Nhờ AI Career Advisor, tôi đã tìm được đam mê và chuyển sang ngành IT thành công!",
      avatar: "",
    },
    {
      name: "Trần Thị B",
      role: "Marketing Manager",
      content:
        "Lộ trình học tập rất chi tiết, giúp tôi phát triển sự nghiệp một cách có hệ thống.",
      avatar: "",
    },
    {
      name: "Lê Minh C",
      role: "Data Analyst",
      content:
        "Bài test tính cách chính xác đến ngạc nhiên, định hướng nghề nghiệp rất phù hợp!",
      avatar: "",
    },
  ];

  return (
    <div className="homepage">
      <Header />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background"></div>
        <div className="container hero-content">
          <div className="hero-text">
            <h1 className="hero-title">Khám Phá Sự Nghiệp Của Bạn Với AI</h1>
            <p className="hero-subtitle">
              Định hướng nghề nghiệp thông minh, cá nhân hóa với công nghệ AI
              tiên tiến. Tìm đúng con đường, phát triển đúng hướng!
            </p>
            <div className="hero-buttons">
              <button className="btn btn-hero-primary">Bắt Đầu Ngay </button>
              <button className="btn btn-hero-outline">Tìm Hiểu Thêm</button>
            </div>
          </div>
          <div className="hero-image">
            <div className="floating-icon">
              <img src={Career} alt="Career Illustration" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <h2 className="stat-number">{stat.number}</h2>
                <p className="stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Tính Năng Nổi Bật</h2>
            <p className="section-subtitle">
              Công nghệ AI hiện đại giúp bạn định hướng sự nghiệp một cách chính
              xác và hiệu quả
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div
                  className="feature-icon"
                  style={{
                    background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}40)`,
                  }}
                >
                  {feature.icon}
                </div>
                <h4 className="feature-title">{feature.title}</h4>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="process-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Quy Trình Hoạt Động</h2>
            <p className="section-subtitle">
              Chỉ 3 bước đơn giản để tìm ra con đường sự nghiệp phù hợp
            </p>
          </div>
          <div className="process-grid">
            <div className="process-item">
              <div
                className="process-number"
                style={{
                  background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                }}
              >
                1
              </div>
              <h4 className="process-title">Làm Bài Test</h4>
              <p className="process-description">
                Hoàn thành bài trắc nghiệm tính cách và năng lực
              </p>
            </div>
            <div className="process-item">
              <div
                className="process-number"
                style={{
                  background: "linear-gradient(135deg, #0891B2, #06B6D4)",
                }}
              >
                2
              </div>
              <h4 className="process-title">Phân Tích AI</h4>
              <p className="process-description">
                AI phân tích và đưa ra định hướng nghề nghiệp
              </p>
            </div>
            <div className="process-item">
              <div
                className="process-number"
                style={{
                  background: "linear-gradient(135deg, #DB2777, #EC4899)",
                }}
              >
                3
              </div>
              <h4 className="process-title">Nhận Lộ Trình</h4>
              <p className="process-description">
                Nhận lộ trình học tập và phát triển cá nhân hóa
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Câu Chuyện Thành Công</h2>
            <p className="section-subtitle">
              Hàng nghìn người đã tìm thấy định hướng nghề nghiệp với chúng tôi
            </p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-avatar">
                  <img src={UserAvt} alt={testimonial.name} />
                </div>
                <p className="testimonial-content">"{testimonial.content}"</p>
                <h5 className="testimonial-name">{testimonial.name}</h5>
                <p className="testimonial-role">{testimonial.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container cta-content">
          <h2 className="cta-title">Sẵn Sàng Khám Phá Tương Lai Của Bạn?</h2>
          <p className="cta-subtitle">
            Tham gia cùng hàng nghìn người đã tìm thấy con đường sự nghiệp lý
            tưởng
          </p>
          <button className="btn btn-cta">Bắt Đầu Miễn Phí Ngay</button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;
