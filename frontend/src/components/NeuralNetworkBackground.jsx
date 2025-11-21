// Component nền mạng neuron hoạt động - Được tái sử dụng ở nhiều trang
import React, { useEffect, useRef } from "react";

// Thành phần nền mạng neuron hoạt động - Tạo hiệu ứng hình ảnh đẹp mắt bằng Canvas API
const NeuralNetworkBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let animationFrameId;
    let time = 0;

    // Tạo các nút ngẫu nhiên phân bố trên canvas
    const nodeCount = 60;
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }

    // Hàm vòng lặp hoạt động chính
    const animate = () => {
      time += 0.01;

      // Làm mờ dần với hiệu ứng fade
      ctx.fillStyle = "rgba(15, 23, 42, 0.05)";
      ctx.fillRect(0, 0, width, height);

      // Cập nhật và vẽ các nút
      nodes.forEach((node) => {
        // Di chuyển các nút
        node.x += node.vx;
        node.y += node.vy;

        // Phản xạ khi chạm cạnh
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Vẽ các nút
        const pulse = Math.sin(time + nodes.indexOf(node)) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(79, 70, 229, ${(node.opacity + pulse * 0.2) * 0.8})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size + pulse * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Vẽ các kết nối giữa các nút gần nhau
      ctx.strokeStyle = "rgba(79, 70, 229, 0.1)";
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.globalAlpha = (1 - dist / 150) * 0.3;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Xử lý thay đổi kích thước cửa sổ
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
};

export default NeuralNetworkBackground;
