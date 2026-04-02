import { Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/common/ProtectedRoute";
import PublicOnlyRoute from "./components/common/PublicOnlyRoute";
import ChatPage from "./pages/ChatPage";
import Dashboard from "./pages/Dashboard";
import Deadlines from "./pages/Deadlines";
import Documents from "./pages/Documents";
import GSTCompliance from "./pages/GSTCompliance";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import TDSWorkbench from "./pages/TDSWorkbench";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/documents"
        element={
          <ProtectedRoute>
            <Documents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/gst"
        element={
          <ProtectedRoute>
            <GSTCompliance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/tds"
        element={
          <ProtectedRoute>
            <TDSWorkbench />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/deadlines"
        element={
          <ProtectedRoute>
            <Deadlines />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
