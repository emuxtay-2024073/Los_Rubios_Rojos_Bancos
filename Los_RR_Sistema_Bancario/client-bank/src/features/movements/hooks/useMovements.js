// client-bank/src/features/movements/hooks/useMovements.js

import { useState, useCallback, useEffect } from "react";
import userClient from "../../../../api/userClient.js";
import { ENDPOINTS } from "../../../shared/constants/endpoints.js";
import useAuthStore from "../../../../store/authStore.js";

export const useMovements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = useAuthStore.getState().token;
      if (!token) {
        setError("No hay token de autenticación");
        return;
      }
      console.log("Fetching movements from:", ENDPOINTS.TRANSACTIONS);
      const response = await userClient.get(ENDPOINTS.TRANSACTIONS);
      console.log("Movements response:", response.data);
      const data = response.data.data || response.data;
      const mappedMovements = data.map((movement) => ({
        id: movement.id || movement._id,
        date: movement.date || movement.createdAt,
        description: movement.description,
        amount: movement.amount,
        type: movement.type,
        balanceAfter: movement.balanceAfter,
      }));
      setMovements(mappedMovements);
    } catch (err) {
      console.error("Error fetching movements:", err);
      const errorMessage = err.response?.data?.message || err.message || "Error al cargar movimientos";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return {
    movements,
    loading,
    error,
    refetch: fetchMovements,
  };
};
