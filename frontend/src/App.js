// Ứng dụng chính - Định tuyến
import "./App.css";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AdminDashboard from "./pages/AdminDashboard";
import QuizSelection from "./pages/QuizSelection";
import MBTIQuiz from "./pages/MBTIQuiz";
import HollandQuiz from "./pages/HollandQuiz";

// Thành phần chính của ứng dụng
function App() {
  return (
    <div className="App">
      <Routes>
        {/* Các tuyến đường chung */}
        <Route path="/" element={<HomePage />} />
        <Route path="/quan tri" element={<AdminDashboard />} />
        
        {/* Các tuyến đường trắc nghiệm */}
        <Route path="/trac nghiem" element={<QuizSelection />} />
        <Route path="/trac nghiem/mbti" element={<MBTIQuiz />} />
        <Route path="/trac nghiem/holland" element={<HollandQuiz />} />
      </Routes>
    </div>
  );
}

export default App;
