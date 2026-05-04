import { axiosAuth } from './api.js';

export const login = async ({ email, password }) => {
  return await axiosAuth.post('/auth/login', {
    Email: email,
    Password: password,
  });
};

export const getAllUsers = async () => {
  const { data } = await axiosAuth.get('/auth/users');
  return { users: data };
};

export const register = async (data) => {
  return await axiosAuth.post('/auth/register', data);
};

export const verifyEmail = async (token) => {
  return await axiosAuth.post('/auth/verify-email', { token });
};
