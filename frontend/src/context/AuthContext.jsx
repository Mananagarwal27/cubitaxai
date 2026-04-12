import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("cubitax_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("cubitax_token");
    if (token && !user) {
      api.getProfile()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem("cubitax_user", JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem("cubitax_token");
          localStorage.removeItem("cubitax_refresh_token");
          localStorage.removeItem("cubitax_user");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    setLoginLoading(true);
    try {
      const res = await api.login({ email, password });
      const { access_token, refresh_token, user: userData } = res.data;
      localStorage.setItem("cubitax_token", access_token);
      localStorage.setItem("cubitax_refresh_token", refresh_token);
      localStorage.setItem("cubitax_user", JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      const msg = err.response?.data?.detail || "Login failed. Please check your credentials.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoginLoading(false);
    }
  }, []);

  const register = useCallback(async (data) => {
    setError(null);
    setLoginLoading(true);
    try {
      const res = await api.register(data);
      const { access_token, refresh_token, user: userData } = res.data;
      localStorage.setItem("cubitax_token", access_token);
      localStorage.setItem("cubitax_refresh_token", refresh_token);
      localStorage.setItem("cubitax_user", JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      const msg = err.response?.data?.detail || "Registration failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoginLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("cubitax_token");
    localStorage.removeItem("cubitax_refresh_token");
    localStorage.removeItem("cubitax_user");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isLoading: loginLoading,
      isBootLoading: loading,
      isAuthenticated: !!user,
      error,
      login,
      register,
      logout,
      setUser,
    }),
    [user, loading, loginLoading, error, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
