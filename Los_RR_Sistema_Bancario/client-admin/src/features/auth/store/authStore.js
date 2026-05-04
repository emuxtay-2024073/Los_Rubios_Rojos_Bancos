import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login as loginRequest, register as registerRequest } from '../../../shared/apis';
import { showError } from '../../../shared/utils/toast.js';

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,
      loading: false,
      error: null,
      isLoadingAuth: true,
      isAuthenticated: false,
      checkAuth: () => {
        const token = get().token;
        const role = get().user?.role;
        const adminRoles = ['ADMIN', 'ADMIN_ROLE'];
        const isAdmin = adminRoles.includes(role);

        if (token && !isAdmin) {
          set({
            user: null,
            token: null,
            refreshToken: null,
            expiresAt: null,
            isLoadingAuth: true,
            isAuthenticated: false,
            error: 'El acceso está restringido al personal autorizado',
          });
          return;
        }

        set({
          isLoadingAuth: false,
          isAuthenticated: Boolean(token) && isAdmin,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          expiresAt: null,
          isAuthenticated: false,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      login: async ({ email, password }) => {
        try {
          set({ loading: true, error: null });

          const { data } = await loginRequest({ email, password });
          const token = data?.token;

          if (!token) {
            const message = data?.message || 'Error al iniciar sesión';
            set({ error: message, loading: false });
            return { success: false, error: message };
          }

          const claims = parseJwt(token);
          const role = claims?.role;
          const adminRoles = ['ADMIN', 'ADMIN_ROLE'];
          if (!adminRoles.includes(role)) {
              const message = 'El acceso está restringido al personal autorizado';
            set({
              user: null,
              token: null,
              refreshToken: null,
              expiresAt: null,
              isLoadingAuth: true,
              isAuthenticated: false,
              error: message,
              loading: false,
            });

            showError(message);
            return { success: false, error: message };
          }

          set({
            user: {
              id: claims?.sub,
              username: claims?.unique_name,
              email: claims?.email,
              role: 'ADMIN',
            },
            token,
            refreshToken: null,
            expiresAt: claims?.exp ? new Date(claims.exp * 1000).toISOString() : null,
            isAuthenticated: true,
            loading: false,
          });
          return { success: true };
        } catch (err) {
          const message = err?.response?.data?.message || err?.message || 'Error al iniciar sesión';
          console.error('Login error:', err);
          set({ error: message, loading: false });
          return { success: false, error: message };
        }
      },

      register: async (formData) => {
        try {
          set({ loading: true, error: null });
          const { data } = await registerRequest(formData);
          set({ loading: false });
          return {
            success: true,
            emailVerificationRequired: data?.emailVerificationRequired,
            data,
          };
        } catch (err) {
          const message = err.response?.data?.message || 'Error al registrar usuario';
          set({ error: message, loading: false });
          return { success: false, error: message };
        }
      },
    }),
    { name: 'auth-KS-IN6AM' }
  )
);
