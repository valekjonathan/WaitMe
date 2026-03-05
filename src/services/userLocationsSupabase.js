/**
 * Servicio de ubicaciones de usuario (Supabase).
 * Sustituye base44.entities.UserLocation.
 * Nota: user_locations no tiene alert_id; getLocationsByAlert devuelve [] hasta que se añada soporte.
 */
import { getSupabase } from '@/lib/supabaseClient';

/**
 * Obtiene ubicaciones activas por alert_id.
 * La tabla user_locations actual no tiene alert_id; devuelve [] hasta migración de schema.
 * @param {string} alertId
 * @returns {Promise<Array>}
 */
export async function getLocationsByAlert(alertId) {
  if (!alertId) return [];
  const supabase = getSupabase();
  if (!supabase) return [];
  // user_locations no tiene alert_id; retornar vacío (SellerLocationTracker no se mostrará)
  return [];
}
