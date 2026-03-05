/**
 * Servicio de ubicaciones de usuario (Supabase).
 * Sustituye base44.entities.UserLocation.
 * Usa tabla user_location_updates (user_id, alert_id, lat, lng, is_active).
 */
import { getSupabase } from '@/lib/supabaseClient';

const TABLE = 'user_location_updates';

/**
 * Obtiene ubicaciones activas por alert_id (compradores navegando hacia la alerta).
 * @param {string} alertId
 * @returns {Promise<Array<{ user_id, alert_id, latitude, longitude, is_active }>>}
 */
export async function getLocationsByAlert(alertId) {
  if (!alertId) return [];
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data: rows, error } = await supabase
    .from(TABLE)
    .select('user_id, alert_id, lat, lng, is_active, updated_at')
    .eq('alert_id', alertId)
    .eq('is_active', true)
    .order('updated_at', { ascending: false });

  if (error) return [];
  return (rows ?? []).map((r) => ({
    user_id: r.user_id,
    alert_id: r.alert_id,
    latitude: r.lat,
    longitude: r.lng,
    is_active: r.is_active ?? true,
    updated_at: r.updated_at,
  }));
}

/**
 * Upserta la ubicación del usuario para una alerta (comprador navegando).
 * @param {Object} payload - { userId, alertId, lat, lng, accuracyM? }
 * @returns {{ data, error }}
 */
export async function upsertLocationForAlert(payload) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };

  const { userId, alertId, lat, lng, accuracyM } = payload;
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        user_id: userId,
        alert_id: alertId,
        lat,
        lng,
        accuracy_m: accuracyM ?? null,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,alert_id', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) return { data: null, error };
  return { data, error: null };
}
