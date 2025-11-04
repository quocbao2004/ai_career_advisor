import "./App.css";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";

function App() {
  return (
    <div className="App">
      <Routes>
        {/* common */}
        <Route path="/" element={<HomePage />} />
      </Routes>
    </div>
  );
}

export default App;
