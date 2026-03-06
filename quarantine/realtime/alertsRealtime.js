/**
 * Supabase Realtime para public.parking_alerts.
 * Escucha INSERT, UPDATE, DELETE.
 * Soporta esquema nuevo (seller_id, price_cents) y legacy (user_id, price).
 * No explota si la tabla no existe (maneja error).
 */
import { getSupabase } from '@/lib/supabaseClient';
import { useAppStore } from '@/state/appStore';

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
    .subscribe((status, err) => {
      if (err) {
        console.error('Realtime parking_alerts error:', err);
        try {
          useAppStore.getState().setError('realtime_error');
        } catch (_) {}
      }
    });

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch (_) {}
  };
}

function normalizeAlert(row) {
  const sellerId = row.seller_id ?? row.user_id;
  const price = row.price_cents != null ? row.price_cents / 100 : (row.price ?? 0);
  const meta = row.metadata || {};
  return {
    id: row.id,
    user_id: sellerId,
    seller_id: sellerId,
    lat: row.lat,
    lng: row.lng,
    latitude: row.lat,
    longitude: row.lng,
    price,
    price_cents: row.price_cents,
    vehicle_type: row.vehicle_type ?? meta.vehicle_type ?? 'car',
    status: row.status,
    reserved_by: row.reserved_by ?? null,
    created_at: row.created_at,
    expires_at: row.expires_at,
    geohash: row.geohash ?? null,
    address_text: row.address_text,
  };
}
