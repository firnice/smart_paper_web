import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import AppFrameLayout from "../components/layout/AppFrameLayout.jsx";
import QuestionDetailPage from "../pages/QuestionDetailPage.jsx";
import PracticePage from "../pages/PracticePage.jsx";
import MinePage from "../pages/mine/MinePage.jsx";
import StudentLoginPage from "../pages/auth/StudentLoginPage.jsx";
import WorkspacePage from "../pages/workspace/WorkspacePage.jsx";
import PrintPage from "../pages/PrintPage.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";
import { readStudentSession } from "../utils/studentSession.js";

function ParentGate({ children }) {
  const session = readStudentSession();
  if (!session?.student?.id) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function getDefaultAppRoute() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "/workspace";
  }
  return window.matchMedia("(max-width: 1023px)").matches ? "/capture" : "/workspace";
}

function RootRedirect() {
  const session = readStudentSession();
  return <Navigate to={session?.student?.id ? getDefaultAppRoute() : "/login"} replace />;
}

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<StudentLoginPage />} />
          <Route path="/student/login" element={<Navigate to="/login" replace />} />
          <Route path="/parent/login" element={<Navigate to="/login" replace />} />

          <Route
            path="/"
            element={(
              <ParentGate>
                <AppFrameLayout />
              </ParentGate>
            )}
          >
            <Route path="capture" element={<WorkspacePage defaultOpenComposer pageMode="capture" />} />
            <Route path="workspace" element={<WorkspacePage />} />
            <Route path="analysis" element={<MinePage />} />
            <Route path="print" element={<PrintPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="question/:id" element={<QuestionDetailPage />} />
            <Route path="practice/:id" element={<PracticePage />} />
          </Route>

          {/* 旧路由重定向 */}
          <Route path="/home" element={<Navigate to="/analysis" replace />} />
          <Route path="/student/dashboard" element={<Navigate to="/workspace" replace />} />
          <Route path="/bank" element={<Navigate to="/workspace" replace />} />
          <Route path="/mine" element={<Navigate to="/analysis" replace />} />
          <Route path="/upload" element={<Navigate to="/capture" replace />} />
          <Route path="/management" element={<Navigate to="/workspace" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </>
  );
}
