// client-bank/src/features/transactions/hooks/useTransactions.js

import { useState, useCallback, useEffect } from "react";
import userClient from "../../../../api/userClient.js";
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
      if (!token) {
        setError("No hay token de autenticación");
        return;
      }
      console.log("Fetching transactions from:", ENDPOINTS.TRANSACTIONS);
      const response = await userClient.get(ENDPOINTS.TRANSACTIONS);
      console.log("Transactions response:", response.data);
      const data = response.data.data || response.data;
      setTransactions(data);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      const errorMessage = err.response?.data?.message || err.message || "Error al cargar transacciones";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTransfer = useCallback(async (transferData) => {
    setLoading(true);
    setError(null);
    try {
      const token = useAuthStore.getState().token;
      if (!token) {
        setError("No hay token de autenticación");
        return { success: false, error: "No hay token de autenticación" };
      }
      const response = await userClient.post(`${ENDPOINTS.TRANSACTIONS}/transfer`, transferData);
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
