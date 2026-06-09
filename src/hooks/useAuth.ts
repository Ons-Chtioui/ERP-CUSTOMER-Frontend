import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth, setAuth } = useAuthStore();

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continuer même si l'API échoue
    } finally {
      // Supprimer le cookie d'accès
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      clearAuth();
      router.push('/login');
    }
  };

  const refreshProfile = async () => {
    try {
      const { data } = await api.get('/auth/me');
      const token = useAuthStore.getState().accessToken;
      if (token) setAuth(data, token);
    } catch {
      clearAuth();
      router.push('/login');
    }
  };

  return { user, isAuthenticated, logout, refreshProfile };
}
