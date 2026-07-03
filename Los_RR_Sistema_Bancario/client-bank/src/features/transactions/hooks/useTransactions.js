// client-bank/src/features/transactions/hooks/useTransactions.js

import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { ENDPOINTS } from "../../../shared/constants/endpoints.js";
import useAuthStore from "../../../../store/authStore.js";

export const useTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
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
      setTransactions(data);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar transacciones");
    } finally {
      setLoading(false);
    }
  }, []);

  const createTransfer = useCallback(async (transferData) => {
    setLoading(true);
    setError(null);
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.post(`${ENDPOINTS.TRANSACTIONS}/transfer`, transferData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = response.data.data || response.data;
      await fetchTransactions();
      return { success: true, data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Error al realizar transferencia";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchTransactions]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
    createTransfer,
  };
};
