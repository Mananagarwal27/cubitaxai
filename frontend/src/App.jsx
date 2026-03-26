import { Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/common/ProtectedRoute";
import PublicOnlyRoute from "./components/common/PublicOnlyRoute";
import DashboardPage from "./pages/DashboardPage";
import DeadlinesPage from "./pages/DeadlinesPage";
import DocumentsPage from "./pages/DocumentsPage";
import GSTPage from "./pages/GSTPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ReportsPage from "./pages/ReportsPage";
import TDSPage from "./pages/TDSPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/documents"
        element={
          <ProtectedRoute>
            <DocumentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/gst"
        element={
          <ProtectedRoute>
            <GSTPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/tds"
        element={
          <ProtectedRoute>
            <TDSPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/deadlines"
        element={
          <ProtectedRoute>
            <DeadlinesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

