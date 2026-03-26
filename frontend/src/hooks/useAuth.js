import { useContext } from "react";

import { AuthContext } from "../context/AuthContext";

/**
 * Access the shared authentication context.
 * @returns {import("../context/AuthContext").AuthContext}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

