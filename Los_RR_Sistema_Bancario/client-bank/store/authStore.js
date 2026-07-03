// client-bank/store/authStore.js

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,

      checkAuth: () => {
        const token = get().token;
        const user = get().user;
        const isAuthenticated = Boolean(token && user);
        set({
          isAuthenticated,
          _hasHydrated: true,
        });
      },

      login: async (accessToken, user, refreshToken) => {
        try {
          await SecureStore.setItemAsync("refreshToken", refreshToken);
          set({
            token: accessToken,
            user,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error("Error al guardar refreshToken:", error);
        }
      },

      logout: async () => {
        try {
          await SecureStore.deleteItemAsync("refreshToken");
          set({
            token: null,
            user: null,
            isAuthenticated: false,
          });
        } catch (error) {
          console.error("Error al eliminar refreshToken:", error);
        }
      },

      setAccessToken: (accessToken) => {
        set({ token: accessToken });
      },

      updateUser: (userData) => {
        set({ user: userData });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        console.log("AuthStore rehydrating, state:", state);
        state && (state._hasHydrated = true);
        console.log("AuthStore hydrated, _hasHydrated:", state?._hasHydrated);
      },
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
