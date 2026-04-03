import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

/**
 * Guard authenticated routes.
 * @param {{ children: import("react").ReactNode }} props
 * @returns {JSX.Element}
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isClient = user?.role === "client";
  const path = location.pathname;

  if (isClient && path.startsWith("/dashboard")) {
    return <Navigate to="/portal" replace />;
  }
  if (!isClient && path.startsWith("/portal")) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
