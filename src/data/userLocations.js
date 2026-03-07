/**
 * Data Adapter para ubicaciones de usuario.
 * Normaliza retorno a API consistente para consumidores.
 */
import * as provider from '@/services/userLocationsSupabase';

/**
 * @param {string} alertId
 * @returns {Promise<Array<{ user_id, alert_id, latitude, longitude, is_active }>>}
 */
export async function getLocationsByAlert(alertId) {
  const result = await provider.getLocationsByAlert(alertId);
  return result.error ? [] : (result.data ?? []);
}

export const upsertLocationForAlert = provider.upsertLocationForAlert;
