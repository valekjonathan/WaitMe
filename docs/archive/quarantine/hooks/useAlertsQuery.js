/**
 * React Query hooks para parking_alerts (Supabase).
 * Realtime como principal; query como respaldo.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getActiveAlerts,
  getActiveAlertsNear,
  createAlert,
  reserveAlert,
  closeAlert,
} from '@/services/alertService';

export const alertsKeys = {
  all: ['parking_alerts'],
  active: (userId) => ['parking_alerts', 'active', userId],
  near: (lat, lng) => ['parking_alerts', 'near', lat, lng],
};

export function useActiveAlertsQuery(userId = null) {
  return useQuery({
    queryKey: alertsKeys.active(userId),
    queryFn: () => getActiveAlerts({ userId }).then((r) => r.data ?? []),
    staleTime: 30_000,
  });
}

export function useActiveAlertsNearQuery(lat, lng, enabled = true) {
  return useQuery({
    queryKey: alertsKeys.near(lat, lng),
    queryFn: () => getActiveAlertsNear(lat, lng).then((r) => r.data ?? []),
    enabled: enabled && lat != null && lng != null,
    staleTime: 30_000,
  });
}

export function useCreateAlertMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAlert,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: alertsKeys.all });
    },
  });
}

export function useReserveAlertMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, userId }) => reserveAlert(alertId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: alertsKeys.all }),
  });
}

export function useCloseAlertMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, status }) => closeAlert(alertId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: alertsKeys.all }),
  });
}
