import axios from 'axios';
import { useAuthStore } from '../../features/auth/store/authStore.js';

const ANONYMOUS_ENDPOINTS = ['/auth/verify-email', '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];

//Crear instancias de axios para cada servicio
const axiosAuth = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL || 'http://localhost:5109/api',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
});

const axiosAdmin = axios.create({
  baseURL: import.meta.env.VITE_ADMIN_URL || 'http://localhost:3000',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
});

axiosAuth.interceptors.request.use((config) => {
  config._axiosClient = 'auth';
  const token = useAuthStore.getState().token;
  config.headers = config.headers || {};
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

axiosAdmin.interceptors.request.use((config) => {
  config._axiosClient = 'admin';
  const token = useAuthStore.getState().token;
  config.headers = config.headers || {};
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

let _isRefreshing = false;
let failedQueue = [];

function _processQueue(_error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => (_error ? reject(_error) : resolve(token)));
  failedQueue = [];
}

const handleRefreshToken = async function (_error) {
  const _original = _error.config;

  // Rutas anónimas: no intentar refresh
  const requestUrl = _original?.url || '';
  const isAnonymous = ANONYMOUS_ENDPOINTS.some(ep => requestUrl.includes(ep));
  if (isAnonymous) return Promise.reject(_error);

  if (!_original || _original._retry) return Promise.reject(_error);

  const status = _error.response?.status;
  const errorCode = _error.response?.data?.error;
  const isRefreshEndpoint = requestUrl.includes('/auth/refresh');
  const shouldRefresh =
    (!isRefreshEndpoint && status === 401) ||
    (!isRefreshEndpoint && status === 403 && errorCode === 'TOKEN_EXPIRED');

  if (shouldRefresh) {
    const retryClient = _original._axiosClient === 'admin' ? axiosAdmin : axiosAuth;
    if (_isRefreshing) {
      return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
        .then((token) => { _original.headers['Authorization'] = 'Bearer ' + token; return retryClient(_original); })
        .catch((err) => Promise.reject(err));
    }
    _original._retry = true;
    _isRefreshing = true;
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      useAuthStore.getState().logout();
      return Promise.reject(_error);
    }
    try {
      const response = await axiosAuth.post('/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken, expiresIn, userDetails } = response.data;
      useAuthStore.setState({
        token: accessToken,
        refreshToken: newRefreshToken,
        expiresAt: expiresIn,
        user: userDetails || useAuthStore.getState().user,
        isAuthenticated: true,
      });
      _processQueue(null, accessToken);
      _original.headers['Authorization'] = 'Bearer ' + accessToken;
      return retryClient(_original);
    } catch (err) {
      _processQueue(err, null);
      useAuthStore.getState().logout();
      return Promise.reject(err);
    } finally {
      _isRefreshing = false;
    }
  }
  return Promise.reject(_error);
};

axiosAuth.interceptors.response.use((res) => res, handleRefreshToken);
axiosAdmin.interceptors.response.use((res) => res, handleRefreshToken);

export { axiosAuth, axiosAdmin };
export default { axiosAuth, axiosAdmin };