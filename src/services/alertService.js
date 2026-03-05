/**
 * Servicio de alertas de parking (Supabase).
 * Sustituye base44.entities.ParkingAlert cuando se complete la migración.
 */
import { getSupabase } from '@/lib/supabaseClient';
import { encode, getNeighborPrefixes } from '@/lib/geohash';

const TABLE = 'parking_alerts';

/**
 * Crea una nueva alerta de parking.
 */
export async function createAlert({ userId, lat, lng, price, vehicleType = 'car', expiresAt }) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };

  const geohash = encode(lat, lng, 7);
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      lat,
      lng,
      price,
      vehicle_type: vehicleType,
      status: 'active',
      geohash,
      expires_at: expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Obtiene alertas activas.
 */
export async function getActiveAlerts({ userId } = {}) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };

  let query = supabase
    .from(TABLE)
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  return { data, error };
}

/**
 * Obtiene alertas activas cerca de (lat, lng) usando geohash.
 */
export async function getActiveAlertsNear(lat, lng, radiusKm = 2) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };

  const geohash = encode(lat, lng, 7);
  const prefixes = getNeighborPrefixes(geohash, radiusKm);
  const orFilter = prefixes.map((p) => `geohash.ilike.${p}%`).join(',');
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('status', 'active')
    .or(orFilter)
    .order('created_at', { ascending: false });

  if (error) return { data: null, error };
  return { data: data ?? [], error: null };
}

/**
 * Reserva una alerta (comprador).
 */
export async function reserveAlert(alertId, reservedByUserId) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: 'reserved',
      reserved_by: reservedByUserId,
    })
    .eq('id', alertId)
    .eq('status', 'active')
    .select()
    .single();

  return { data, error };
}

/**
 * Cierra una alerta (cancela, expira o completa).
 */
export async function closeAlert(alertId, newStatus = 'cancelled') {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };

  const { data, error } = await supabase
    .from(TABLE)
    .update({ status: newStatus })
    .eq('id', alertId)
    .select()
    .single();

  return { data, error };
}
