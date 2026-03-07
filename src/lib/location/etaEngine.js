/**
 * Motor de ETA — estimación de tiempo de llegada.
 * Base para "llegando en X min", distancia restante, animación.
 *
 * @module etaEngine
 */

import { getMetersBetween } from './distanceEngine.js';

const WALKING_SPEED_M_PER_MIN = 80;
const DRIVING_SPEED_KMH = 25;

/**
 * ETA en minutos según distancia y modo.
 *
 * @param {Object} opts
 * @param {number} opts.distanceMeters
 * @param {'walking'|'driving'} [opts.mode='walking']
 * @returns {number|null} minutos, o null si no calculable
 */
export function getEtaMinutes(opts) {
  const { distanceMeters, mode = 'walking' } = opts;
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) return null;

  if (mode === 'walking') {
    return Math.max(0, distanceMeters / WALKING_SPEED_M_PER_MIN);
  }

  if (mode === 'driving') {
    const km = distanceMeters / 1000;
    const hours = km / DRIVING_SPEED_KMH;
    return Math.max(0, hours * 60);
  }

  return null;
}

/**
 * ETA desde dos puntos (calcula distancia y ETA).
 *
 * @param {Object} opts
 * @param {{ lat: number, lng: number } | [number, number]} opts.from
 * @param {{ lat: number, lng: number } | [number, number]} opts.to
 * @param {'walking'|'driving'} [opts.mode='walking']
 * @returns {{ distanceMeters: number, etaMinutes: number } | null}
 */
export function getEtaFromPoints(opts) {
  const { from, to, mode = 'walking' } = opts;
  const distanceMeters = getMetersBetween(from, to);
  if (!Number.isFinite(distanceMeters)) return null;

  const etaMinutes = getEtaMinutes({ distanceMeters, mode });
  if (etaMinutes == null) return null;

  return { distanceMeters, etaMinutes };
}
