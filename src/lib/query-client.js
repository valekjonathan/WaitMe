// src/lib/query-client.js
import { QueryClient } from '@tanstack/react-query'

// ⚠️ CLAVE para eliminar pantallas blancas/negras al navegar:
// - No refetch al cambiar de pantalla
// - Cache suficiente para no “vaciar” la UI
// - Reintentos mínimos

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: 1,
      staleTime: 60 * 1000,      // 1 minuto sin refetch
      gcTime: 10 * 60 * 1000,    // 10 minutos en memoria
      suspense: false
    },
    mutations: {
      retry: 0
    }
  }
})