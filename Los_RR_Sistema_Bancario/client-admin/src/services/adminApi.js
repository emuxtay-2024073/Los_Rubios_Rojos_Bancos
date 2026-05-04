import { axiosAdmin } from '../shared/apis/api.js';
import { normalizeList } from '../shared/utils/banking.js';

const withFormData = (payload) => (payload instanceof FormData ? { headers: { 'Content-Type': undefined } } : {});

export const getAccounts = async () => {
  const { data } = await axiosAdmin.get('/accounts');
  return normalizeList(data, ['accounts']);
};

export const createAccount = async (payload) => {
  const { data } = await axiosAdmin.post('/accounts/create', payload, withFormData(payload));
  return data;
};

export const depositToAccount = async (payload) => {
  const { data } = await axiosAdmin.post('/accounts/deposit', payload);
  return data;
};

export const withdrawFromAccount = async (payload) => {
  const { data } = await axiosAdmin.post('/accounts/withdraw', payload);
  return data;
};

export const getBeneficiaries = async () => {
  const { data } = await axiosAdmin.get('/beneficiaries');
  return normalizeList(data, ['beneficiaries']);
};

export const createBeneficiary = async (payload) => {
  const { data } = await axiosAdmin.post('/beneficiaries', payload);
  return data;
};

export const updateBeneficiary = async (id, payload) => {
  const { data } = await axiosAdmin.put(`/beneficiaries/${id}`, payload);
  return data;
};

export const deleteBeneficiary = async (id) => {
  const { data } = await axiosAdmin.delete(`/beneficiaries/${id}`);
  return data;
};

export const toggleBeneficiaryFavorite = async (id) => {
  const { data } = await axiosAdmin.patch(`/beneficiaries/${id}/favorite`);
  return data;
};

export const getTransactions = async () => {
  const { data } = await axiosAdmin.get('/transactions');
  return normalizeList(data, ['transactions']);
};

export const transferMoney = async (payload) => {
  const { data } = await axiosAdmin.post('/transactions/transfer', payload);
  return data;
};

export const getCurrentLimits = async () => {
  const { data } = await axiosAdmin.get('/limits');
  return normalizeList(data, ['limits']);
};

export const getAllLimits = async () => {
  const { data } = await axiosAdmin.get('/limits/all');
  return normalizeList(data, ['limits']);
};

export const createUserLimit = async (payload) => {
  const { data } = await axiosAdmin.post('/limits/user', payload);
  return data;
};

export const createDefaultLimit = async (payload) => {
  const { data } = await axiosAdmin.post('/limits/default', payload);
  return data;
};

export const deleteLimit = async (limitId) => {
  const { data } = await axiosAdmin.delete(`/limits/${limitId}`);
  return data;
};

export const getReversals = async () => {
  const { data } = await axiosAdmin.get('/reversals');
  return normalizeList(data, ['reversals']);
};

export const getPendingReversals = async () => {
  const { data } = await axiosAdmin.get('/reversals/pending');
  return normalizeList(data, ['reversals']);
};

export const requestReversal = async (payload) => {
  const { data } = await axiosAdmin.post('/reversals/request', payload);
  return data;
};

export const approveReversal = async (reversalId) => {
  const { data } = await axiosAdmin.post(`/reversals/${reversalId}/approve`);
  return data;
};

export const rejectReversal = async (reversalId, payload) => {
  const { data } = await axiosAdmin.post(`/reversals/${reversalId}/reject`, payload);
  return data;
};

export const cancelReversal = async (reversalId) => {
  const { data } = await axiosAdmin.delete(`/reversals/${reversalId}/cancel`);
  return data;
};

export const getExchangeRate = async (fromCurrency, toCurrency) => {
  const { data } = await axiosAdmin.get('/currency/rate', {
    params: { fromCurrency, toCurrency },
  });
  return data;
};

export const convertCurrency = async (payload) => {
  const { data } = await axiosAdmin.post('/currency/convert', payload);
  return data;
};

export const getExchangeRates = async () => {
  const { data } = await axiosAdmin.get('/currency/rates');
  return normalizeList(data, ['exchangeRates', 'rates']);
};

export const addExchangeRate = async (payload) => {
  const { data } = await axiosAdmin.post('/currency/rates', payload);
  return data;
};

export const deleteExchangeRate = async (rateId) => {
  const { data } = await axiosAdmin.delete(`/currency/rates/${rateId}`);
  return data;
};

export const getConversionHistory = async () => {
  const { data } = await axiosAdmin.get('/currency/history');
  return normalizeList(data, ['history', 'conversions']);
};

export const getUsers = async () => {
  const { data } = await axiosAdmin.get('/users');
  return normalizeList(data, ['users']);
};

export const updateUserRole = async (userId, newRole) => {
  const { data } = await axiosAdmin.patch(`/users/${userId}/role`, { newRole });
  return data;
};

export const deactivateUser = async (userId) => {
  const { data } = await axiosAdmin.patch(`/users/${userId}/deactivate`);
  return data;
};

export const reactivateUser = async (userId) => {
  const { data } = await axiosAdmin.patch(`/users/${userId}/reactivate`);
  return data;
};
