import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      // NO “pantallas de carga” por refetch constante
      staleTime: 5 * 60 * 1000,     // 5 min “fresh”
      gcTime: 30 * 60 * 1000,       // 30 min en caché
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: 1
    }
  }
});