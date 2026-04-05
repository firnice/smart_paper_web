import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { UserProvider } from "../context/UserContext.jsx";
import AppFrameLayout from "../components/layout/AppFrameLayout.jsx";
import HomePage from "../pages/HomePage.jsx";
import UploadPage from "../pages/paper/UploadPage.jsx";
import QuestionBankPage from "../pages/QuestionBankPage.jsx";
import QuestionDetailPage from "../pages/QuestionDetailPage.jsx";
import PracticePage from "../pages/PracticePage.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";
import PrintPage from "../pages/PrintPage.jsx";
import InsightsPage from "../pages/InsightsPage.jsx";

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppFrameLayout />}>
            <Route index element={<HomePage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="bank" element={<QuestionBankPage />} />
            <Route path="question/:id" element={<QuestionDetailPage />} />
            <Route path="practice/:id" element={<PracticePage />} />
            <Route path="print" element={<PrintPage />} />
            <Route path="insights" element={<InsightsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </UserProvider>
  );
}
