import React, { useMemo } from "react";
import GlassCard from "../components/common/GlassCard";
import StatCard from "../components/StatCard";
import Sparkline from "../components/common/Sparkline";

const AdminDashboard = () => {
  // --- DỮ LIỆU MẪU ---
  const systemMetrics = [
    {
      title: "Tổng User",
      value: "50234",
      icon: "👥",
      color: "#4f46e5",
      spark: [10, 15, 12, 18, 20, 25, 22],
    },
    {
      title: "Đang hoạt động",
      value: "12458",
      icon: "✨",
      color: "#0891b2",
      spark: [8, 9, 12, 10, 14, 16, 15],
    },
    {
      title: "Doanh thu",
      value: "89200",
      icon: "💰",
      color: "#fbbf24",
      spark: [15, 20, 25, 30, 28, 35, 40],
    },
    {
      title: "Hiệu suất",
      value: "98",
      icon: "🚀",
      color: "#10b981",
      spark: [90, 92, 95, 94, 98, 97, 99],
    },
  ];

  const chartData = useMemo(
    () => ({
      dailyActive: [
        120, 145, 158, 172, 189, 205, 218, 235, 248, 260, 275, 285, 298, 310,
      ],
      dailySignups: [8, 12, 15, 18, 22, 25, 28, 32, 35, 38, 42, 45, 48, 52],
    }),
    []
  );

  const insights = [
    {
      category: "Người dùng",
      metrics: [
        { l: "Mới", v: "+120" },
        { l: "Rời bỏ", v: "2%" },
      ],
    },
    {
      category: "Hệ thống",
      metrics: [
        { l: "CPU", v: "45%" },
        { l: "RAM", v: "3.2GB" },
      ],
    },
  ];

  return (
    <div className="admin-container">
      {/* 1. Hero Section */}
      <section className="admin-hero">
        <div>
          <h1>Dashboard Thống Kê</h1>
          <p style={{ opacity: 0.8 }}>
            Tổng quan hiệu suất hệ thống thời gian thực
          </p>
        </div>
        <div>
          <button className="btn btn-outline-gold">Xuất báo cáo</button>
          <button className="btn btn-gold">Cài đặt</button>
        </div>
      </section>

      {/* 2. Stats Cards */}
      <section className="admin-stats">
        {systemMetrics.map((item, index) => (
          <StatCard key={index} index={index} {...item} />
        ))}
      </section>

      {/* 3. Main Charts Area */}
      <section className="admin-analysis-charts">
        <div className="analysis-chart-row">
          {/* Chart 1: Tái sử dụng GlassCard */}
          <GlassCard style={{ padding: "24px" }}>
            <h3 style={{ margin: "0 0 20px 0" }}>Lưu lượng truy cập</h3>
            <div className="chart-container">
              <Sparkline data={chartData.dailyActive} color="#4f46e5" />
            </div>
            <div className="text-label" style={{ textAlign: "center" }}>
              Dữ liệu 14 ngày gần nhất
            </div>
          </GlassCard>

          {/* Chart 2 */}
          <GlassCard style={{ padding: "24px" }}>
            <h3 style={{ margin: "0 0 20px 0" }}>Đăng ký mới</h3>
            <div className="chart-container">
              <Sparkline data={chartData.dailySignups} color="#0891b2" />
            </div>
            <div className="text-label" style={{ textAlign: "center" }}>
              Tăng trưởng ổn định
            </div>
          </GlassCard>
        </div>
      </section>

      {/* 4. Insights Grid */}
      <section className="insights-grid">
        {insights.map((group, idx) => (
          <GlassCard key={idx} style={{ padding: "20px" }}>
            <h4
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                paddingBottom: "10px",
              }}
            >
              {group.category}
            </h4>
            {group.metrics.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "10px",
                }}
              >
                <span className="text-label">{m.l}</span>
                <span className="text-value">{m.v}</span>
              </div>
            ))}
          </GlassCard>
        ))}
      </section>
    </div>
  );
};

export default AdminDashboard;
