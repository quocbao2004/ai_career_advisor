import React from "react";
import NeuralNetworkBackground from "../background/NeuralNetworkBackground";
import Header from "../header";
import Footer from "../footer";

const MainLayout = ({ children }) => {
  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <NeuralNetworkBackground />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <Header />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
