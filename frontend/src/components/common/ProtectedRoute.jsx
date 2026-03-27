import { Navigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

/**
 * Guard authenticated routes.
 * @param {{ children: import("react").ReactNode }} props
 * @returns {JSX.Element}
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

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

  return children;
}
