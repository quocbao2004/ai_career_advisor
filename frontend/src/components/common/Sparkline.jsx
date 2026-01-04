import React from "react";

const Sparkline = ({ data = [], color = "#fff", width = 100, height = 40 }) => {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Tính toán toạ độ SVG
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100; // Dùng % để responsive
      const y = 100 - ((d - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ overflow: "visible" }}
    >
      <polyline
        className="sparkline-path"
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke" // Giữ độ dày nét vẽ khi scale
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Sparkline;
