// client-bank/src/features/accounts/hooks/useAccounts.js

import { useState, useCallback, useEffect } from "react";
import axios from "axios";
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
      const response = await axios.get(`${ENDPOINTS.ACCOUNTS}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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
      setError(err.response?.data?.message || "Error al cargar cuentas");
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
