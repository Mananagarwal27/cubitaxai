import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { api, subscribeToUnauthorized, TOKEN_KEY } from "../api/client";

export const AuthContext = createContext(null);

/**
 * Provide authentication state and actions to the app tree.
 * @param {{ children: import("react").ReactNode }} props
 * @returns {JSX.Element}
 */
export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = Boolean(token && user);

  async function refreshUser() {
    const existingToken = localStorage.getItem(TOKEN_KEY);
    if (!existingToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await api.auth.getMe();
      setUser(profile);
      setToken(existingToken);
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email, password) {
    setIsLoading(true);
    try {
      const response = await api.auth.login({ email, password });
      localStorage.setItem(TOKEN_KEY, response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      navigate("/dashboard");
      return response;
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function register(payload) {
    setIsLoading(true);
    try {
      const response = await api.auth.register(payload);
      localStorage.setItem(TOKEN_KEY, response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      navigate("/dashboard");
      return response;
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem("cubitax_chat_session");
    setUser(null);
    setToken(null);
    navigate("/login");
  }

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToUnauthorized(() => {
      setUser(null);
      setToken(null);
      navigate("/login");
    });
    return unsubscribe;
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

