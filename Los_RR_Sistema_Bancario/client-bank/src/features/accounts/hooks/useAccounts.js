// client-bank/src/features/accounts/hooks/useAccounts.js

import { useState, useCallback, useEffect } from "react";
import userClient from "../../../../api/userClient.js";
import { ENDPOINTS } from "../../../shared/constants/endpoints.js";
import useAuthStore from "../../../../store/authStore.js";

export const useAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = useAuthStore.getState().token;
      if (!token) {
        setError("No hay token de autenticación");
        return;
      }
      console.log("Fetching accounts from:", ENDPOINTS.ACCOUNTS);
      const response = await userClient.get(ENDPOINTS.ACCOUNTS);
      console.log("Accounts response:", response.data);
      const data = response.data.data || response.data;
      const mappedAccounts = data.map((account) => ({
        id: account.id || account._id,
        accountNumber: account.accountNumber,
        accountType: account.type || account.accountType,
        balance: account.balance,
        currency: account.currency || "GTQ",
        status: account.isActive ? "active" : "inactive",
      }));
      setAccounts(mappedAccounts);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      const errorMessage = err.response?.data?.message || err.message || "Error al cargar cuentas";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    loading,
    error,
    refetch: fetchAccounts,
  };
};
