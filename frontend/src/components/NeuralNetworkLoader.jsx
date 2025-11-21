// Thành phần hoạt động tải mạng neuron - Hiển thị khi trang đang tải dữ liệu
import React, { useEffect, useRef } from "react";

const NeuralNetworkLoader = ({ isVisible = false }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = 300;
    canvas.height = 300;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    let animationFrameId;
    let time = 0;

    // Tạo các nút sắp xếp trong 3 lớp tròn
    const layers = [
      { radius: 40, count: 3, phase: 0 },
      { radius: 80, count: 6, phase: Math.PI / 6 },
      { radius: 120, count: 8, phase: Math.PI / 8 },
    ];

    // Khởi tạo tất cả các nút từ các lớp
    const nodes = [];
    layers.forEach((layer, layerIdx) => {
      for (let i = 0; i < layer.count; i++) {
        const angle = (i / layer.count) * Math.PI * 2 + layer.phase;
        nodes.push({
          x: centerX + Math.cos(angle) * layer.radius,
          y: centerY + Math.sin(angle) * layer.radius,
          layer: layerIdx,
          angle,
          radius: layer.radius,
          baseSize: 6 + layerIdx * 2,
        });
      }
    });

    // Hàm vòng lặp hoạt động chính
    const animate = () => {
      time += 0.01;

      // Làm mờ dần với hiệu ứng để lại dấu vết
      ctx.fillStyle = "rgba(15, 23, 42, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Vẽ các kết nối giữa các nút gần nhau
      ctx.strokeStyle = "rgba(79, 70, 229, 0.2)";
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          // Kết nối các nút gần nhau
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.globalAlpha = Math.max(0, 1 - dist / 150) * 0.3;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      // Draw and animate nodes
      nodes.forEach((node, idx) => {
        const pulse = Math.sin(time * 3 + idx * 0.3) * 0.5 + 0.5;
        const nodeSize = node.baseSize * (0.6 + pulse * 0.4);

        // Outer glow
        ctx.fillStyle = `rgba(147, 112, 219, ${pulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize + 8, 0, Math.PI * 2);
        ctx.fill();

        // Node body
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, nodeSize);
        gradient.addColorStop(0, `rgba(168, 85, 247, ${0.9 + pulse * 0.1})`);
        gradient.addColorStop(1, `rgba(124, 58, 237, ${0.6 + pulse * 0.2})`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright spot
        ctx.fillStyle = `rgba(220, 180, 255, ${pulse * 0.8})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(15, 23, 42, 0.95)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          marginBottom: "30px",
          filter: "drop-shadow(0 0 30px rgba(79, 70, 229, 0.3))",
        }}
      />
      <div
        style={{
          color: "#ffffff",
          fontSize: "18px",
          fontWeight: "600",
          letterSpacing: "2px",
          textTransform: "uppercase",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      >
        Đang tải...
      </div>
    </div>
  );
};

export default NeuralNetworkLoader;
