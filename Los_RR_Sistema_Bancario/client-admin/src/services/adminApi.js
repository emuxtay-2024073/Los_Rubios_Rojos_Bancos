import { axiosAdmin, axiosAuth } from '../shared/apis/api.js';
import { normalizeList } from '../shared/utils/banking.js';

const withFormData = (payload) => (payload instanceof FormData ? { headers: { 'Content-Type': undefined } } : {});

export const getAccounts = async () => {
  const { data } = await axiosAdmin.get('/api/accounts');
  return normalizeList(data, ['accounts']);
};

export const getAccountByNumber = async (accountNumber) => {
  const { data } = await axiosAdmin.get('/api/accounts', { params: { accountNumber } });
  return normalizeList(data, ['accounts']);
};

export const createAccount = async (payload) => {
  const { data } = await axiosAdmin.post('/api/accounts/create', payload, withFormData(payload));
  return data;
};

export const updateAccountType = async (accountId, newType) => {
  const { data } = await axiosAdmin.put(`/api/accounts/${accountId}/update-type`, { newType });
  return data;
};

export const depositToAccount = async (payload) => {
  const { data } = await axiosAdmin.post('/api/accounts/deposit', payload);
  return data;
};

export const withdrawFromAccount = async (payload) => {
  const { data } = await axiosAdmin.post('/api/accounts/withdraw', payload);
  return data;
};

export const getBeneficiaries = async () => {
  const { data } = await axiosAdmin.get('/api/beneficiaries');
  return normalizeList(data, ['beneficiaries']);
};

export const createBeneficiary = async (payload) => {
  const { data } = await axiosAdmin.post('/api/beneficiaries', payload);
  return data;
};

export const updateBeneficiary = async (id, payload) => {
  const { data } = await axiosAdmin.put(`/api/beneficiaries/${id}`, payload);
  return data;
};

export const deleteBeneficiary = async (id) => {
  const { data } = await axiosAdmin.delete(`/api/beneficiaries/${id}`);
  return data;
};

export const toggleBeneficiaryFavorite = async (id) => {
  const { data } = await axiosAdmin.patch(`/api/beneficiaries/${id}/favorite`);
  return data;
};

export const getTransactions = async () => {
  const { data } = await axiosAdmin.get('/api/transactions');
  return normalizeList(data, ['transactions']);
};

export const transferMoney = async (payload) => {
  const { data } = await axiosAdmin.post('/api/transactions/transfer', payload);
  return data;
};

export const getAccountHistory = async (accountId, params = {}) => {
  const { data } = await axiosAdmin.get(`/api/accounts/${accountId}/history`, { params });
  return normalizeList(data, ['transactions']);
};

export const requestAccountDisable = async (accountId, payload) => {
  const { data } = await axiosAdmin.post(`/api/accounts/${accountId}/disable-request`, payload);
  return data;
};

export const requestAccountReactivation = async (accountId, payload) => {
  const { data } = await axiosAdmin.post(`/api/accounts/${accountId}/reactivate-request`, payload);
  return data;
};

export const getDisableAccountRequests = async (status) => {
  const { data } = await axiosAdmin.get('/api/accounts/disable-requests', {
    params: status ? { status } : undefined,
  });
  return normalizeList(data, ['requests']);
};

export const approveDisableAccountRequest = async (requestId, payload = {}) => {
  const { data } = await axiosAdmin.post(`/api/accounts/disable-requests/${requestId}/approve`, payload);
  return data;
};

export const rejectDisableAccountRequest = async (requestId, payload = {}) => {
  const { data } = await axiosAdmin.post(`/api/accounts/disable-requests/${requestId}/reject`, payload);
  return data;
};

export const getCurrentLimits = async () => {
  const { data } = await axiosAdmin.get('/api/limits/all');
  return normalizeList(data, ['limits']);
};

export const getAllLimits = async () => {
  const { data } = await axiosAdmin.get('/api/limits/all');
  return normalizeList(data, ['limits']);
};

export const createUserLimit = async (payload) => {
  const { data } = await axiosAdmin.post('/api/limits/user', payload);
  return data;
};

export const createDefaultLimit = async (payload) => {
  const { data } = await axiosAdmin.post('/api/limits/default', payload);
  return data;
};

export const deleteLimit = async (limitId) => {
  const { data } = await axiosAdmin.delete(`/api/limits/${limitId}`);
  return data;
};

export const getReversals = async () => {
  const { data } = await axiosAdmin.get('/api/reversals');
  return normalizeList(data, ['reversals']);
};

export const getReactivateAccountRequests = async (status) => {
  const { data } = await axiosAdmin.get('/api/accounts/reactivate-requests', { params: status && status !== 'ALL' ? { status } : undefined });
  return normalizeList(data, ['requests']);
};

export const approveReactivateAccountRequest = async (requestId, payload = {}) => {
  const { data } = await axiosAdmin.post(`/api/accounts/reactivate-requests/${requestId}/approve`, payload);
  return data;
};

export const rejectReactivateAccountRequest = async (requestId, payload = {}) => {
  const { data } = await axiosAdmin.post(`/api/accounts/reactivate-requests/${requestId}/reject`, payload);
  return data;
};

export const getPendingReversals = async () => {
  const { data } = await axiosAdmin.get('/api/reversals/pending');
  return normalizeList(data, ['reversals']);
};

export const requestReversal = async (payload) => {
  const { data } = await axiosAdmin.post('/api/reversals/request', payload);
  return data;
};

export const approveReversal = async (reversalId) => {
  const { data } = await axiosAdmin.post(`/api/reversals/${reversalId}/approve`);
  return data;
};

export const rejectReversal = async (reversalId, payload) => {
  const { data } = await axiosAdmin.post(`/api/reversals/${reversalId}/reject`, payload);
  return data;
};

export const cancelReversal = async (reversalId) => {
  const { data } = await axiosAdmin.delete(`/api/reversals/${reversalId}/cancel`);
  return data;
};

export const getExchangeRate = async (fromCurrency, toCurrency) => {
  const { data } = await axiosAdmin.get('/api/currency/rate', {
    params: { fromCurrency, toCurrency },
  });
  return data;
};

export const convertCurrency = async (payload) => {
  const { data } = await axiosAdmin.post('/api/currency/convert', payload);
  return data;
};

export const getExchangeRates = async () => {
  const { data } = await axiosAdmin.get('/api/currency/rates');
  return normalizeList(data, ['exchangeRates', 'rates']);
};

export const addExchangeRate = async (payload) => {
  const { data } = await axiosAdmin.post('/api/currency/rates', payload);
  return data;
};

export const deleteExchangeRate = async (rateId) => {
  const { data } = await axiosAdmin.delete(`/api/currency/rates/${rateId}`);
  return data;
};

export const getConversionHistory = async () => {
  const { data } = await axiosAdmin.get('/api/currency/history');
  return normalizeList(data, ['history', 'conversions']);
};

export const getUsers = async () => {
  const adminUsers = [];
  const authUsers = [];
  let adminError = null;
  let authError = null;

  const extractUsers = (data) => {
    if (Array.isArray(data)) return data;
    return normalizeList(data, ['users']);
  };

  try {
    const { data } = await axiosAdmin.get('/api/users/admin/all');
    adminUsers.push(...extractUsers(data));
  } catch (error) {
    adminError = error;
  }

  try {
    const { data } = await axiosAuth.get('/auth/users');
    authUsers.push(...extractUsers(data));
  } catch (error) {
    authError = error;
  }

  const combinedUsers = [...adminUsers, ...authUsers];
  if (combinedUsers.length > 0) {
    const uniqueUsers = Object.values(
      combinedUsers.reduce((acc, user) => {
        const key =
          user.email?.toString().toLowerCase() ||
          user.username?.toString().toLowerCase() ||
          user.id?.toString() ||
          user._id?.toString();
        if (!key) return acc;

        const existing = acc[key] || {};
        acc[key] = {
          ...existing,
          ...user,
          _id: existing._id || user._id,
        };
        return acc;
      }, {})
    );
    return uniqueUsers;
  }

  if (adminError) {
    const status = adminError.response?.status;
    if (status === 403 || status === 404) {
      if (authError) throw authError;
      return authUsers;
    }
    throw adminError;
  }

  if (authError) {
    throw authError;
  }

  return [];
};

export const updateUserRole = async (userId, newRole) => {
  const { data } = await axiosAdmin.put(`/api/users/${userId}/role`, { newRole });
  return data;
};

export const deactivateUser = async (userId) => {
  const { data } = await axiosAdmin.put(`/api/users/${userId}/deactivate`);
  return data;
};

export const reactivateUser = async (userId) => {
  const { data } = await axiosAdmin.put(`/api/users/${userId}/reactivate`);
  return data;
};