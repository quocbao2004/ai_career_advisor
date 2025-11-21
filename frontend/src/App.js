import "./App.css";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AdminDashboard from "./pages/AdminDashboard";
import QuizSelection from "./pages/QuizSelection";
import MBTIQuiz from "./pages/MBTIQuiz";
import HollandQuiz from "./pages/HollandQuiz";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPassWordPage from "./pages/ForgotPasswordPage";
import MainLayout from "./components/layout/MainLayout";
import "./assets/css-custom/main.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function App() {
  return (
    <div className="App">
      <MainLayout>
        <Routes>
          {/* Common */}
          <Route path="/" element={<HomePage />} />
          <Route path="/quan-tri" element={<AdminDashboard />} />

          {/* Auth */}
          <Route path="/dang-nhap" element={<LoginPage />} />
          <Route path="/dang-ky" element={<RegisterPage />} />
          <Route path="/quen-mat-khau" element={<ForgotPassWordPage />} />

          {/* Quizz */}
          <Route path="/trac-nghiem" element={<QuizSelection />} />
          <Route path="/trac-nghiem/mbti" element={<MBTIQuiz />} />
          <Route path="/trac-nghiem/holland" element={<HollandQuiz />} />
        </Routes>
      </MainLayout>
    </div>
  );
}

export default App;
