/**
 * Hook que carga alertas activas y se suscribe a Realtime.
 * Actualiza el Zustand store.
 */
import { useEffect } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useAppStore } from '@/state/appStore';
import { subscribeActiveAlerts } from '@/services/realtime/alertsRealtime';

export function useRealtimeAlerts() {
  const { setAlerts, setAlertsLoading, upsertAlert, removeAlert } = useAppStore();

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    setAlertsLoading(true);

    supabase
      .from('parking_alerts')
      .select('id, user_id, lat, lng, price, vehicle_type, status, reserved_by, created_at, expires_at, geohash')
      .eq('status', 'active')
      .then(({ data, error }) => {
        setAlertsLoading(false);
        if (error) return;
        const items = (data || []).map((r) => ({
          id: r.id,
          user_id: r.user_id,
          lat: r.lat,
          lng: r.lng,
          latitude: r.lat,
          longitude: r.lng,
          price: r.price,
          vehicle_type: r.vehicle_type || 'car',
          status: r.status,
          reserved_by: r.reserved_by,
          created_at: r.created_at,
          expires_at: r.expires_at,
          geohash: r.geohash,
        }));
        setAlerts(items);
      });

    const unsub = subscribeActiveAlerts({
      onUpsert: (alert) => {
        if (alert.status === 'active') upsertAlert(alert);
        else removeAlert(alert.id);
      },
      onDelete: removeAlert,
    });

    return () => unsub();
  }, [setAlerts, setAlertsLoading, upsertAlert, removeAlert]);
}
