import React from "react";
import GlassCard from "./common/GlassCard";
import CountUp from "./common/CountUp";
import Sparkline from "./common/Sparkline";

const StatCard = ({ title, value, icon, color, spark = [], index = 0 }) => {
  return (
    <GlassCard
      className="stat-anim"
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            className="admin-stat-icon"
            style={{ background: `${color}20`, color: color }}
          >
            {icon}
          </div>
          <h3 className="text-label" style={{ margin: 0 }}>
            {title}
          </h3>
          <div
            style={{ fontSize: "1.8rem", fontWeight: "bold", margin: "8px 0" }}
          >
            <CountUp end={value} />
          </div>
        </div>

        <div style={{ width: "80px", height: "40px" }}>
          {/* Biểu đồ nhỏ ở góc */}
          <Sparkline data={spark} color={color} />
        </div>
      </div>
    </GlassCard>
  );
};

export default StatCard;
