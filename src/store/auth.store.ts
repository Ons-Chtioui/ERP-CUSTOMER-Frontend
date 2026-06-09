import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  // Actions
  setAuth: (user: AuthUser, token: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  // Helper permissions
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
  hasAllPermissions: (...permissions: string[]) => boolean;
}

// Fonctions utilitaires pour les cookies (côté client uniquement)
const setCookie = (name: string, value: string, days: number = 1) => {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

const deleteCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) => {
        // Mettre à jour l'état
        set({ user, accessToken, isAuthenticated: true });
        // Stocker aussi dans un cookie pour le middleware
        setCookie('access_token', accessToken, 1);
      },

      setAccessToken: (accessToken) => {
        set({ accessToken });
        if (accessToken) {
          setCookie('access_token', accessToken, 1);
        }
      },

      clearAuth: () => {
        set({ user: null, accessToken: null, isAuthenticated: false });
        deleteCookie('access_token');
      },

      hasPermission: (permission) =>
        get().user?.permissions?.includes(permission) ?? false,

      hasAnyPermission: (...permissions) =>
        permissions.some((p) => get().user?.permissions?.includes(p) ?? false),

      hasAllPermissions: (...permissions) =>
        permissions.every((p) => get().user?.permissions?.includes(p) ?? false),
    }),
    {
      name: 'erp-auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      // Ne stocker que l'utilisateur (pas le token) en storage
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      // Hydrater l'état au chargement
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          // Si un token existe dans le state, le synchroniser avec le cookie
          setCookie('access_token', state.accessToken, 1);
        } else {
          // Sinon, essayer de récupérer depuis le cookie
          const cookieToken = getCookie('access_token');
          if (cookieToken && state) {
            state.accessToken = cookieToken;
          }
        }
      },
    },
  ),
);