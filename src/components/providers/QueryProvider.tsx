'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

/**
 * Lit le cookie `access_token` côté client et le réhydrate dans le store Zustand.
 * Nécessaire après un rechargement de page car le token n'est pas persisté
 * dans sessionStorage (sécurité).
 */
function TokenRehydrator() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (accessToken) return; // Déjà dans le store

    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith('access_token='));

    if (match) {
      const token = match.split('=')[1];
      if (token) setAccessToken(token);
    }
  }, [accessToken, setAccessToken]);

  return null;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TokenRehydrator />
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
