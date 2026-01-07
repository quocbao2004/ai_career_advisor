import React from "react";
import GlassCard from "./common/GlassCard";
import CountUp from "./common/CountUp";
import Sparkline from "./common/Sparkline";

const StatCard = ({ title, value, icon, color, spark = [], index = 0 }) => {
  return (
    <GlassCard
      className="stat-anim stat-card-responsive"
      style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        animationDelay: `${index * 100}ms`,
        height: "100%",
        minHeight: "140px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "8px",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="admin-stat-icon stat-icon-responsive"
            style={{ background: `${color}20`, color: color }}
          >
            {icon}
          </div>
          <h3 className="text-label stat-title-responsive" style={{ margin: 0, fontSize: "0.8rem", lineHeight: 1.3 }}>
            {title}
          </h3>
          <div
            className="stat-value-responsive"
            style={{ fontSize: "1.5rem", fontWeight: "bold", margin: "6px 0" }}
          >
            <CountUp end={value} />
          </div>
        </div>

        <div className="stat-spark-responsive" style={{ width: "60px", height: "35px", flexShrink: 0 }}>
          {/* Biểu đồ nhỏ ở góc */}
          <Sparkline data={spark} color={color} />
        </div>
      </div>
    </GlassCard>
  );
};

export default StatCard;
