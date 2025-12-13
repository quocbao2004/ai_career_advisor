import React, { lazy, Suspense } from "react";
import NeuralNetworkBackground from "../background/NeuralNetworkBackground";
import Header from "../header";
import Footer from "../footer";
// const AIChat = lazy(() => import("../../pages/AIChat"));

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
        <Suspense fallback={null}>{/* <AIChat /> */}</Suspense>
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
