// client-bank/src/features/auth/hooks/useAuth.js

import { useState } from "react";
import authClient from "../../../../api/authClient.js";
import useAuthStore from "../../../../store/authStore.js";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login, logout } = useAuthStore();

  const handleLogin = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authClient.post("/login", {
        email,
        password,
      });
      const { accessToken, refreshToken, user } = response.data;

      await login(accessToken, user, refreshToken);

      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Error al iniciar sesión";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const registerData = { ...userData, clientType: "mobile" };
      const response = await authClient.post("/register", registerData);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Error al registrar usuario";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    handleLogin,
    handleRegister,
    loading,
    error,
    logout,
  };
};
