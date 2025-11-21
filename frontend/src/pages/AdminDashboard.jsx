// Trang bảng điều khiển quản trị viên - Hiển thị phân tích hệ thống và chỉ số hiệu suất chính
import React, { useEffect, useState, useMemo, useRef } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import NeuralNetworkBackground from "../components/NeuralNetworkBackground";
import NeuralNetworkLoader from "../components/NeuralNetworkLoader";
import "../assets/css-custom/admin.css";

// Thành phần hiệu ứng gợn sóng - Tạo hiệu ứng gợn sóng khi click chuột
const RippleEffect = () => {
  const containerRef = useRef(null);
  // Quản lý danh sách các gợn sóng đang hoạt động
  const [ripples, setRipples] = useState([]);

  useEffect(() => {
    // Xử lý sự kiện khi nhấn chuột
    const handleMouseDown = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Lấy vị trí chuột tương đối với container
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();

      // Thêm gợn sóng mới vào danh sách
      setRipples((prev) => [...prev, { id, x, y }]);

      // Xóa gợn sóng sau khi hoàn thành hoạt động
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousedown", handleMouseDown);
    }

    return () => {
      if (container) {
        container.removeEventListener("mousedown", handleMouseDown);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      {/* Hiển thị các gợn sóng từ danh sách */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          style={{
            position: "absolute",
            left: ripple.x,
            top: ripple.y,
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(147, 112, 219, 0.8), rgba(147, 112, 219, 0))",
            transform: "translate(-50%, -50%)",
            animation: "rippleOut 0.6s ease-out",
            pointerEvents: "none",
          }}
        />
      ))}
    </div>
  );
};

// Thành phần đếm chỉ số - Hiển thị số với hiệu ứng đếm từ 0 đến giá trị cuối cùng
const CountUp = ({ end, duration = 1200 }) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = null;
    const from = 0;
    // Loại bỏ dấu phân cách hàng nghìn và chuyển đổi thành số
    const to = Number(String(end).replace(/,/g, "")) || 0;
    // Hàm vòng lặp hoạt động sử dụng requestAnimationFrame để đếm mượt
    const step = (timestamp) => {
      if (!start) start = timestamp;
      // Tính tiến độ hoàn thành (0 đến 1)
      const progress = Math.min((timestamp - start) / duration, 1);
      // Tính giá trị hiện tại dựa trên tiến độ
      const current = Math.floor(from + (to - from) * progress);
      setValue(current);
      // Tiếp tục vòng lặp nếu chưa hoàn thành
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  // Định dạng giá trị với dấu phân cách hàng nghìn
  const formatted = useMemo(() => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), [value]);
  return <span>{formatted}</span>;
};

// Thành phần biểu đồ đơn giản - Hiển thị biểu đồ đường nhỏ gọn với hiệu ứng vẽ
const Sparkline = ({ data = [], color = "#fff" }) => {
  const w = 120;
  const h = 36;
  if (!data || data.length === 0) return null;
  
  // Tìm giá trị nhỏ nhất và lớn nhất
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  // Chuyển đổi dữ liệu thành tọa độ SVG
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline className="sparkline-path" fill="none" stroke={color} strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Thành phần thẻ thống kê - Hiển thị một chỉ số với biểu tượng, giá trị, tên và biểu đồ nhỏ
const StatCard = ({ title, value, icon, color, spark = [], index = 0 }) => (
  <div className="admin-stat-card card-glass stat-anim" style={{ animationDelay: `${index * 120}ms` }}>
    <div className="admin-stat-left">
      <div className="admin-stat-icon" style={{ background: color }}>
        {icon}
      </div>
      <div className="admin-stat-body">
        <div className="admin-stat-value">
          <CountUp end={String(value)} />
        </div>
        <div className="admin-stat-title">{title}</div>
      </div>
    </div>
    {/* Hiển thị biểu đồ nhỏ cho thẻ thống kê */}
    <div className="admin-stat-spark">
      <Sparkline data={spark} color={color} />
    </div>
  </div>
);

// Thành phần Bảng Điều Khiển Quản Trị chính
const AdminDashboard = () => {
  // Dữ liệu mẫu - Thay thế bằng các cuộc gọi API để lấy dữ liệu thực tế từ backend
  const [isLoading, setIsLoading] = useState(true);

  // Mô phỏng tải dữ liệu cho bản demo - Hiển thị loader 2.5 giây
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Các chỉ số hệ thống chính - 4 thẻ thống kê hiển thị số liệu quan trọng
  const systemMetrics = [
    { title: "Tổng người dùng", value: "50,234", icon: "👥", color: "#4f46e5", spark: [10, 12, 9, 14, 18, 20, 17] },
    { title: "Người dùng hoạt động", value: "12,458", icon: "✨", color: "#0891b2", spark: [8, 10, 7, 12, 14, 16, 18] },
    { title: "Tỷ lệ chuyển đổi", value: "23.4%", icon: "📈", color: "#7c3aed", spark: [15, 18, 16, 20, 22, 25, 24] },
    { title: "Thời gian sử dụng TB", value: "45 phút", icon: "⏱️", color: "#db2777", spark: [30, 35, 40, 42, 45, 48, 50] },
  ];

  // Dữ liệu phân tích hệ thống - 4 biểu đồ xu hướng
  const analysisData = useMemo(() => {
    return {
      // Xu hướng người dùng hoạt động hàng ngày
      dailyActive: [120, 145, 158, 172, 189, 205, 218, 235, 248, 260, 275, 285, 298, 310],
      // User signups trend
      dailySignups: [8, 12, 15, 18, 22, 25, 28, 32, 35, 38, 42, 45, 48, 52],
      // Course completion rate
      courseCompletion: [65, 68, 70, 72, 75, 77, 79, 81, 82, 84, 85, 87, 88, 90],
      // Learning path engagement
      engagementRate: [55, 58, 60, 63, 65, 68, 70, 72, 74, 76, 78, 80, 82, 84],
    };
  }, []);

  // Detailed system insights
  const systemInsights = [
    {
      category: "Người dùng",
      metrics: [
        { label: "Tổng users", value: "50,234", change: "+2,456 từ tuần trước" },
        { label: "Active users", value: "12,458", change: "+8.5% tăng trưởng" },
        { label: "Churn rate", value: "2.3%", change: "-0.4% cải thiện" },
        { label: "Retention 30d", value: "78.6%", change: "+4.2% so với tháng trước" },
      ],
    },
    {
      category: "Khóa học",
      metrics: [
        { label: "Tổng khóa học", value: "1,024", change: "+42 khóa mới" },
        { label: "Hoàn thành TB", value: "23.4%", change: "+3.1% tăng" },
        { label: "Đang học", value: "8,342", change: "+12% tham gia" },
        { label: "Rating TB", value: "4.2/5", change: "↑ 0.3 điểm" },
      ],
    },
    {
      category: "Lộ trình học",
      metrics: [
        { label: "Lộ trình tích cực", value: "412", change: "+28 lộ trình" },
        { label: "Hoàn thành", value: "3,256", change: "+18% hoàn thành" },
        { label: "Tỷ lệ kết thúc", value: "67.8%", change: "+5.2% cải thiện" },
        { label: "Thời gian TB", value: "24 ngày", change: "-3 ngày ngắn hơn" },
      ],
    },
    {
      category: "Hệ thống",
      metrics: [
        { label: "Uptime", value: "99.98%", change: "Ổn định" },
        { label: "Avg Response", value: "245ms", change: "-50ms nhanh hơn" },
        { label: "Error rate", value: "0.02%", change: "-0.01% cải thiện" },
        { label: "API Calls", value: "2.5M/ngày", change: "+15% lưu lượng" },
      ],
    },
  ];

  return (
    <div className="admin-page">
      <NeuralNetworkBackground />
      <NeuralNetworkLoader isVisible={isLoading} />
      <RippleEffect />
      <Header />

      <main className="admin-container">
        <header className="admin-hero">
          <div>
            <h1>Thống kê</h1>
            <p className="admin-hero-sub">Phân tích chi tiết về hoạt động và hiệu suất hệ thống AI Career Advisor</p>
          </div>
          <div className="admin-hero-actions">
            <button className="btn btn-outline-gold">Export Report</button>
            <button className="btn btn-gold">Tạo báo cáo</button>
          </div>
        </header>

        {/* Key System Metrics */}
        <section className="admin-stats">
          {systemMetrics.map((m, i) => (
            <StatCard key={i} index={i} {...m} />
          ))}
        </section>

        {/* Detailed Analysis Charts */}
        <section className="admin-analysis-charts">
          <div className="analysis-chart-row">
            <div className="admin-panel panel-chart card-glass">
              <h3>Người dùng hoạt động hằng ngày (14 ngày)</h3>
              <div className="chart-container">
                <Sparkline data={analysisData.dailyActive} color="#4f46e5" />
              </div>
              <div className="chart-stats">
                <span>Cao nhất: 310 | Thấp nhất: 120 | TB: 209</span>
              </div>
            </div>

            <div className="admin-panel panel-chart card-glass">
              <h3>Đăng ký người dùng mới (14 ngày)</h3>
              <div className="chart-container">
                <Sparkline data={analysisData.dailySignups} color="#0891b2" />
              </div>
              <div className="chart-stats">
                <span>Cao nhất: 52 | Thấp nhất: 8 | TB: 30</span>
              </div>
            </div>
          </div>

          <div className="analysis-chart-row">
            <div className="admin-panel panel-chart card-glass">
              <h3>Tỷ lệ hoàn thành khóa học (%)</h3>
              <div className="chart-container">
                <Sparkline data={analysisData.courseCompletion} color="#7c3aed" />
              </div>
              <div className="chart-stats">
                <span>Cao nhất: 90% | Thấp nhất: 65% | TB: 78%</span>
              </div>
            </div>

            <div className="admin-panel panel-chart card-glass">
              <h3>Mức độ engagement (%)</h3>
              <div className="chart-container">
                <Sparkline data={analysisData.engagementRate} color="#db2777" />
              </div>
              <div className="chart-stats">
                <span>Cao nhất: 84% | Thấp nhất: 55% | TB: 70%</span>
              </div>
            </div>
          </div>
        </section>

        {/* System Insights Grid */}
        <section className="admin-insights-section">
          <h2 className="insights-title">Chi tiết phân tích hệ thống</h2>
          <div className="insights-grid">
            {systemInsights.map((insight, idx) => (
              <div key={idx} className="admin-panel insight-card card-glass">
                <h4 className="insight-category">{insight.category}</h4>
                <div className="insight-metrics">
                  {insight.metrics.map((metric, midx) => (
                    <div key={midx} className="metric-row">
                      <div className="metric-label">{metric.label}</div>
                      <div className="metric-value">{metric.value}</div>
                      <div className="metric-change">{metric.change}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
