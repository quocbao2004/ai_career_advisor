import React, { lazy, Suspense } from "react";
import NeuralNetworkBackground from "../background/NeuralNetworkBackground";
import { useLocation } from "react-router-dom";
import Header from "../header";
import Footer from "../footer";
// const AIChat = lazy(() => import("../../pages/AIChat"));

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isChatPage = location.pathname === "/chat";
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
        {!isChatPage && <Footer />}
      </div>
    </div>
  );
};

export default MainLayout;
