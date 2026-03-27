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
      const isDemoAttempt = email === "demo@example.com" && password === "demo123";
      if (isDemoAttempt && error.response?.status === 401) {
        try {
          const registerResponse = await api.auth.register({
            full_name: "Demo User",
            email: "demo@example.com",
            company_name: "Demo Co",
            pan_number: "ABCDE1234F",
            gstin: "29ABCDE1234F1Z5",
            password: "demo123"
          });
          localStorage.setItem(TOKEN_KEY, registerResponse.access_token);
          setToken(registerResponse.access_token);
          setUser(registerResponse.user);
          navigate("/dashboard");
          return registerResponse;
        } catch (registerError) {
          try {
            const fallbackResponse = await api.auth.login({
              email: "demo@example.com",
              password: "Demo12345"
            });
            localStorage.setItem(TOKEN_KEY, fallbackResponse.access_token);
            setToken(fallbackResponse.access_token);
            setUser(fallbackResponse.user);
            navigate("/dashboard");
            return fallbackResponse;
          } catch (fallbackError) {
            toast.error("Demo login is unavailable right now");
            throw fallbackError;
          }
        }
      }
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
