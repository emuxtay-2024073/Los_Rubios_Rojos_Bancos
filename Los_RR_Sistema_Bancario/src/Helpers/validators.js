import mongoose from 'mongoose';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9]{8,15}$/;
const dpiRegex = /^[0-9]{13}$/;

export const isEmailValid = (value) => {
  return typeof value === 'string' && emailRegex.test(value.trim().toLowerCase());
};

export const isPhoneValid = (value) => {
  return typeof value === 'string' && phoneRegex.test(value.trim());
};

export const isDPIValid = (value) => {
  return typeof value === 'string' && dpiRegex.test(value.trim());
};

export const isNonEmptyString = (value) => {
  return typeof value === 'string' && value.trim().length > 0;
};

export const isValidPassword = (value) => {
  return typeof value === 'string' && value.trim().length >= 6;
};

export const isPositiveAmount = (value) => {
  const amount = Number(value);
  return !Number.isNaN(amount) && amount > 0;
};

export const isValidObjectId = (value) => {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
};

export const normalizeEmail = (value) => {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
};
