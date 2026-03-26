import { Navigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

/**
 * Prevent authenticated users from visiting auth pages.
 * @param {{ children: import("react").ReactNode }} props
 * @returns {JSX.Element}
 */
export default function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-accent border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

