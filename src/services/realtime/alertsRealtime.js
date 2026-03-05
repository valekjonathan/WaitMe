/**
 * Supabase Realtime para parking_alerts.
 * Escucha INSERT, UPDATE, DELETE.
 */
import { getSupabase } from '@/lib/supabaseClient';

/**
 * @param {Object} opts
 * @param {Function} [opts.onUpsert] - (alert) => void
 * @param {Function} [opts.onDelete] - (id) => void
 * @returns {() => void} unsubscribe
 */
export function subscribeActiveAlerts({ onUpsert, onDelete } = {}) {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel('parking_alerts_realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'parking_alerts',
      },
      (payload) => {
        const row = payload.new;
        if (row && row.status === 'active' && onUpsert) {
          onUpsert(normalizeAlert(row));
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'parking_alerts',
      },
      (payload) => {
        const row = payload.new;
        if (row && onUpsert) {
          onUpsert(normalizeAlert(row));
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'parking_alerts',
      },
      (payload) => {
        const id = payload.old?.id;
        if (id && onDelete) onDelete(id);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

function normalizeAlert(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    lat: row.lat,
    lng: row.lng,
    latitude: row.lat,
    longitude: row.lng,
    price: row.price,
    vehicle_type: row.vehicle_type || 'car',
    status: row.status,
    reserved_by: row.reserved_by,
    created_at: row.created_at,
    expires_at: row.expires_at,
    geohash: row.geohash,
  };
}
