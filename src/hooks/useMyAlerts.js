/**
 * Shared hook and query options for the ['myAlerts'] query.
 *
 * Single source of truth for staleTime, refetchOnMount, refetchOnWindowFocus,
 * and the queryFn. Used by Home.jsx, History.jsx and BottomNav.jsx so all
 * three read from the exact same cache entry with the exact same policy.
 *
 * Policy rationale:
 *   - staleTime: 15 s  → data is fresh for 15 s; no redundant network requests
 *                         while the user quickly navigates between pages.
 *   - refetchOnMount: false → navigating back to a page does NOT fire a request
 *                             if data is still fresh; prevents badge flashes.
 *   - refetchOnWindowFocus: true → when the user returns to the browser tab the
 *                                  badge and lists stay up-to-date.
 *   - refetchOnReconnect: true → recover from lost connectivity.
 *   - placeholderData: keepPrevious → lists/badge never become empty while
 *                                     re-fetching; no white flashes on navigate.
 */

import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export const MY_ALERTS_QUERY_KEY = ['myAlerts'];

export const MY_ALERTS_OPTIONS = {
  staleTime: 15_000,
  gcTime: 5 * 60 * 1000,
  refetchInterval: false,
  refetchOnMount: false,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  placeholderData: (prev) => prev,
};

async function fetchMyAlerts(userId, userEmail) {
  if (!userId && !userEmail) return [];
  if (userId) return (await base44.entities.ParkingAlert.filter({ user_id: userId })) || [];
  return (await base44.entities.ParkingAlert.filter({ user_email: userEmail })) || [];
}

/**
 * Drop-in replacement for the three inline useQuery(['myAlerts']) calls.
 * Returns the full query result so callers can destructure exactly what they need:
 *   const { data: myAlerts = [], isLoading, isFetched, isFetching } = useMyAlerts();
 */
export function useMyAlerts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: MY_ALERTS_QUERY_KEY,
    enabled: !!(user?.id || user?.email),
    ...MY_ALERTS_OPTIONS,
    queryFn: () => fetchMyAlerts(user?.id, user?.email),
  });
}
