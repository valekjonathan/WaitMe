/**
 * Servicio de alertas de parking (Supabase).
 * Sustituye base44.entities.ParkingAlert cuando se complete la migración.
 */
import { supabase } from '@/lib/supabaseClient';

const TABLE = 'parking_alerts';

/**
 * Crea una nueva alerta de parking.
 * @param {Object} params
 * @param {string} params.userId - UUID del usuario (profiles.id)
 * @param {number} params.lat - Latitud
 * @param {number} params.lng - Longitud
 * @param {number} params.price - Precio
 * @param {string} [params.vehicleType='car'] - Tipo de vehículo
 * @param {Date|string} params.expiresAt - Fecha de expiración
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createAlert({ userId, lat, lng, price, vehicleType = 'car', expiresAt }) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      lat,
      lng,
      price,
      vehicle_type: vehicleType,
      status: 'active',
      expires_at: expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Obtiene alertas activas.
 * @param {Object} [options]
 * @param {string} [options.userId] - Filtrar por usuario (mis alertas)
 * @returns {Promise<{data: object[]|null, error: object|null}>}
 */
export async function getActiveAlerts({ userId } = {}) {
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
 * Reserva una alerta (comprador).
 * @param {string} alertId - UUID de la alerta
 * @param {string} reservedByUserId - UUID del usuario que reserva (profiles.id)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function reserveAlert(alertId, reservedByUserId) {
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
 * @param {string} alertId - UUID de la alerta
 * @param {string} newStatus - 'cancelled' | 'expired' | 'completed'
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function closeAlert(alertId, newStatus = 'cancelled') {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status: newStatus })
    .eq('id', alertId)
    .select()
    .single();

  return { data, error };
}
