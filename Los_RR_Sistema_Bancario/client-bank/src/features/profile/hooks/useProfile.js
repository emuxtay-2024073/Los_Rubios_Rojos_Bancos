// client-bank/src/features/profile/hooks/useProfile.js

import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { ENDPOINTS } from "../../../shared/constants/endpoints.js";
import useAuthStore from "../../../../store/authStore.js";

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { updateUser } = useAuthStore();

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.get(`${ENDPOINTS.USER}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = response.data.data || response.data;
      setProfile(data);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar perfil");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.put(`${ENDPOINTS.USER}/profile`, profileData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = response.data.data || response.data;
      setProfile(data);
      updateUser(data);
      return { success: true, data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Error al actualizar perfil";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile,
  };
};
