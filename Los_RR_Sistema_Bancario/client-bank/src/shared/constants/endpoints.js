// client-bank/src/shared/constants/endpoints.js

export const ENDPOINTS = {
  AUTH: process.env.EXPO_PUBLIC_AUTH_URL || "http://localhost:3000/api/auth",
  USER: process.env.EXPO_PUBLIC_USER_URL || "http://localhost:3000/api/users",
  ACCOUNTS: process.env.EXPO_PUBLIC_ACCOUNTS_URL || "http://localhost:3000/api/accounts",
  TRANSACTIONS: process.env.EXPO_PUBLIC_TRANSACTIONS_URL || "http://localhost:3000/api/transactions",
  CARDS: process.env.EXPO_PUBLIC_CARDS_URL || "http://localhost:3000/api/cards",
};
