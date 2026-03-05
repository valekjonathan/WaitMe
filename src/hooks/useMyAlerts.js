/**
 * Shared hook and query options for the ['myAlerts'] query.
 *
 * Single source of truth for staleTime, refetchOnMount, refetchOnWindowFocus,
 * and the queryFn. Used by Home.jsx, History.jsx and BottomNav.jsx so all
 * three read from the exact same cache entry with the exact same policy.
 *
 * Migrated to Supabase: uses alertsSupabase.getMyAlerts + subscribeAlerts.
 *
 * Policy rationale:
 *   - staleTime: 0  → data is always considered stale; explicit invalidation
 *                      controls when to refetch (no silent staleness window).
 *   - refetchOnMount: false → navigating back to a page does NOT auto-refetch;
 *                             prevents badge flashes on navigation.
 *   - refetchOnWindowFocus: true → when the user returns to the browser tab the
 *                                  badge and lists stay up-to-date.
 *   - refetchOnReconnect: true → recover from lost connectivity.
 *   - placeholderData: keepPrevious → lists/badge never become empty while
 *                                     re-fetching; no white flashes on navigate.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getMyAlerts, getAlertsReservedByMe, subscribeAlerts } from '@/services/alertsSupabase';
import { useAuth } from '@/lib/AuthContext';

export const MY_ALERTS_QUERY_KEY = ['myAlerts'];

export const MY_ALERTS_OPTIONS = {
  staleTime: 0,
  gcTime: 5 * 60 * 1000,
  refetchInterval: false,
  refetchOnMount: false,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  placeholderData: (prev) => prev,
};

async function fetchMyAlerts(userId) {
  if (!userId) return [];
  const [sellerRes, buyerRes] = await Promise.all([
    getMyAlerts(userId),
    getAlertsReservedByMe(userId),
  ]);
  const asSeller = sellerRes.data ?? [];
  const asBuyer = buyerRes.data ?? [];
  const seen = new Set(asSeller.map((a) => a.id));
  const merged = [...asSeller];
  for (const a of asBuyer) {
    if (!seen.has(a.id)) {
      seen.add(a.id);
      merged.push(a);
    }
  }
  merged.sort((a, b) => toMs(b.created_at) - toMs(a.created_at));
  return merged;
}

function toMs(v) {
  if (v == null) return 0;
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v > 1e12 ? v : v * 1000;
  if (typeof v === 'string') {
    const t = new Date(v).getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  return 0;
}

/**
 * Drop-in replacement for the three inline useQuery(['myAlerts']) calls.
 * Returns the full query result so callers can destructure exactly what they need:
 *   const { data: myAlerts = [], isLoading, isFetched, isFetching } = useMyAlerts();
 */
export function useMyAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const result = useQuery({
    queryKey: MY_ALERTS_QUERY_KEY,
    enabled: !!userId,
    ...MY_ALERTS_OPTIONS,
    queryFn: () => fetchMyAlerts(userId),
  });

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeAlerts({
      onUpsert: (alert) => {
        if (alert?.seller_id === userId || alert?.user_id === userId) {
          queryClient.invalidateQueries({ queryKey: MY_ALERTS_QUERY_KEY });
        }
      },
      onDelete: () => {
        queryClient.invalidateQueries({ queryKey: MY_ALERTS_QUERY_KEY });
      },
    });
    return unsub;
  }, [userId, queryClient]);

  return result;
}
