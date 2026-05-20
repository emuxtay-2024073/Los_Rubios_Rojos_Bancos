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

const resolveClaim = (claims, keys) => {
  if (!claims) return null;
  for (const key of keys) {
    const value = claims[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return null;
};

const getRoleFromClaims = (claims) => {
  const rawRole = resolveClaim(claims, [
    'role',
    'roles',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  ]);

  if (Array.isArray(rawRole)) {
    return String(rawRole[0] || '').trim();
  }
  return String(rawRole || '').trim();
};

const getUserIdFromClaims = (claims) => {
  return (
    resolveClaim(claims, [
      'sub',
      'id',
      'userId',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
    ]) || null
  );
};

const isAdminRole = (role) => {
  return ['ADMIN', 'ADMIN_ROLE'].includes(role?.toString().toUpperCase());
};

const isValidRole = (role) => {
  return ['ADMIN', 'ADMIN_ROLE', 'CLIENTE'].includes(role?.toString().toUpperCase());
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
      isAdmin: false,
      resetLoadingState: () => {
        set({ loading: false });
      },
      checkAuth: () => {
        const token = get().token;
        const role = get().user?.role;
        const validRole = isValidRole(role);

        if (token && !validRole) {
          set({
            user: null,
            token: null,
            refreshToken: null,
            expiresAt: null,
            isLoadingAuth: true,
            isAuthenticated: false,
            isAdmin: false,
            error: 'El acceso está restringido al personal autorizado',
          });
          return;
        }

        set({
          isLoadingAuth: false,
          isAuthenticated: Boolean(token) && validRole,
          isAdmin: isAdminRole(role),
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          expiresAt: null,
          isAuthenticated: false,
          isAdmin: false,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      login: async ({ email, password }) => {
        try {
          set({ loading: true, error: null });

          const { data } = await loginRequest({ email, password });
          const token = data?.token || data?.accessToken || data?.Token || data?.AccessToken;
          const refreshToken = data?.refreshToken || data?.RefreshToken || null;

          if (!token) {
            const message = data?.message || 'Error al iniciar sesión';
            set({ error: message, loading: false });
            return { success: false, error: message };
          }

          const claims = parseJwt(token);
          const role = getRoleFromClaims(claims) || data?.user?.role;
          const validRole = isValidRole(role);

          if (!validRole) {
            const message = 'El acceso está restringido al personal autorizado';
            set({
              user: null,
              token: null,
              refreshToken: null,
              expiresAt: null,
              isLoadingAuth: true,
              isAuthenticated: false,
              isAdmin: false,
              error: message,
              loading: false,
            });

            showError(message);
            return { success: false, error: message };
          }

          set({
            user: {
              id: getUserIdFromClaims(claims) || data?.user?.id || null,
              username:
                resolveClaim(claims, ['unique_name', 'name', 'preferred_username']) ||
                data?.user?.username ||
                null,
              email:
                resolveClaim(claims, ['email', 'upn', 'preferred_username']) ||
                data?.user?.email ||
                null,
              role: role || data?.user?.role || 'Cliente',
            },
            token,
            refreshToken,
            expiresAt: claims?.exp ? new Date(claims.exp * 1000).toISOString() : null,
            isAuthenticated: true,
            isAdmin: isAdminRole(role),
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
