// client-bank/src/features/movements/hooks/useMovements.js

import { useState, useCallback, useEffect } from "react";
import axios from "axios";
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
      const response = await axios.get(`${ENDPOINTS.TRANSACTIONS}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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
      setError(err.response?.data?.message || "Error al cargar movimientos");
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
