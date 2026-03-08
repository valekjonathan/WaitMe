import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as transactions from '@/data/transactions';
import { useMyAlerts } from '@/hooks/useMyAlerts';

export function useHistoryQueries(userId) {
  const queryClient = useQueryClient();
  const { data: myAlerts = [], isLoading: loadingAlerts } = useMyAlerts();

  const { data: transactionsData = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['myTransactions', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: false,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    queryFn: async () => {
      try {
        const { data, error } = await transactions.listTransactions(userId, { limit: 5000 });
        if (error) throw error;
        return data ?? [];
      } catch {
        return [];
      }
    },
  });

  return {
    myAlerts,
    transactionsData,
    loadingAlerts,
    loadingTransactions,
    queryClient,
  };
}
