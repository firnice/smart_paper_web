import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../pages/HomePage.jsx";
import UploadPage from "../pages/paper/UploadPage.jsx";
import ResultPage from "../pages/paper/ResultPage.jsx";
import { PaperProvider } from "../context/PaperContext.jsx";

export default function App() {
  return (
    <PaperProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </PaperProvider>
  );
}
