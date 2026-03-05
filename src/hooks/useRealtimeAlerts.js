/**
 * Hook que carga alertas activas y se suscribe a Realtime.
 * Actualiza el Zustand store.
 * Soporta esquema nuevo (seller_id, price_cents) y legacy (user_id, price).
 * No explota si la tabla no existe: setError en store.
 */
import { useEffect } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useAppStore } from '@/state/appStore';
import { subscribeActiveAlerts } from '@/services/realtime/alertsRealtime';

function normalizeRow(r) {
  const sellerId = r.seller_id ?? r.user_id;
  const price = r.price_cents != null ? r.price_cents / 100 : (r.price ?? 0);
  const meta = r.metadata || {};
  return {
    id: r.id,
    user_id: sellerId,
    seller_id: sellerId,
    lat: r.lat,
    lng: r.lng,
    latitude: r.lat,
    longitude: r.lng,
    price,
    price_cents: r.price_cents,
    vehicle_type: r.vehicle_type ?? meta.vehicle_type ?? 'car',
    status: r.status,
    reserved_by: r.reserved_by ?? null,
    created_at: r.created_at,
    expires_at: r.expires_at,
    geohash: r.geohash ?? null,
    address_text: r.address_text,
  };
}

export function useRealtimeAlerts() {
  const { setAlerts, setAlertsLoading, upsertAlert, removeAlert, setError, clearError } = useAppStore();

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    setAlertsLoading(true);
    clearError();

    supabase
      .from('parking_alerts')
      .select('*')
      .eq('status', 'active')
      .then(({ data, error }) => {
        setAlertsLoading(false);
        if (error) {
          console.error('Realtime alerts load error:', error);
          setError('realtime_error');
          return;
        }
        const items = (data || []).map(normalizeRow);
        setAlerts(items);
      })
      .catch((err) => {
        setAlertsLoading(false);
        console.error('Realtime alerts load error:', err);
        setError('realtime_error');
      });

    const unsub = subscribeActiveAlerts({
      onUpsert: (alert) => {
        if (alert.status === 'active') upsertAlert(alert);
        else removeAlert(alert.id);
      },
      onDelete: removeAlert,
    });

    return () => unsub();
  }, [setAlerts, setAlertsLoading, upsertAlert, removeAlert, setError, clearError]);
}
