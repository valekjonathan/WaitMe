import { QueryClient } from '@tanstack/react-query'

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      suspense: false,
      retry: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      keepPreviousData: true,
    },
    mutations: {
      retry: false,
    },
  },
})