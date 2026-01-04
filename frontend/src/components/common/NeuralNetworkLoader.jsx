import React, { useEffect, useState } from "react";
// import "../assets/css-custom/NeuralNetworkLoader.css";

const Loader = () => {
  const [particles, setParticles] = useState([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // tạo particle
    const newParticles = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 20,
        duration: 10 + Math.random() * 10,
      });
    }
    setParticles(newParticles);

    // ⏳ bắt đầu đếm 3 giây
    const minTime = new Promise((resolve) => {
      setTimeout(resolve, 3000);
    });

    // 🖼 đợi trang load xong
    const pageLoaded = new Promise((resolve) => {
      window.addEventListener("load", resolve, { once: true });
    });

    Promise.all([minTime, pageLoaded]).then(() => setVisible(false));
  }, []);

  if (!visible) return null;

  return (
    <div className="loader-wrapper">
      {/* Background orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      <div className="particles-container">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.left}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Grid background */}
      <div className="grid-bg"></div>

      {/* Main content */}
      <div className="loader-container">
        <div className="loader-content">
          {/* AI Neural Network Visualization */}
          <div className="ai-visualization">
            <svg viewBox="0 0 200 200" className="neural-network">
              {/* Central node */}
              <circle cx="100" cy="100" r="8" className="node node-center" />

              {/* Connecting lines */}
              <line x1="100" y1="100" x2="60" y2="50" className="connection" />
              <line x1="100" y1="100" x2="140" y2="50" className="connection" />
              <line x1="100" y1="100" x2="50" y2="100" className="connection" />
              <line
                x1="100"
                y1="100"
                x2="150"
                y2="100"
                className="connection"
              />
              <line x1="100" y1="100" x2="60" y2="150" className="connection" />
              <line
                x1="100"
                y1="100"
                x2="140"
                y2="150"
                className="connection"
              />

              {/* Peripheral nodes */}
              <circle cx="60" cy="50" r="5" className="node node-peripheral" />
              <circle cx="140" cy="50" r="5" className="node node-peripheral" />
              <circle cx="50" cy="100" r="5" className="node node-peripheral" />
              <circle
                cx="150"
                cy="100"
                r="5"
                className="node node-peripheral"
              />
              <circle cx="60" cy="150" r="5" className="node node-peripheral" />
              <circle
                cx="140"
                cy="150"
                r="5"
                className="node node-peripheral"
              />
            </svg>
          </div>

          {/* Text content */}
          <div className="text-content">
            <h1 className="title">
              <span className="gradient-text">AI</span> Career Advisor
            </h1>
            <p className="subtitle">Powered by Artificial Intelligence</p>
          </div>

          {/* Spinner */}
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>

          {/* Loading text */}
          <div className="loading-text">
            Analyzing your potential
            <span className="dots">
              <span className="dot">.</span>
              <span className="dot">.</span>
              <span className="dot">.</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
