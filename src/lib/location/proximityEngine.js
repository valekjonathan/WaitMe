/**
 * Motor de proximidad — base para liberación de pago.
 * Desacoplado de UI. Listo para validar ≤5m.
 *
 * @module proximityEngine
 */

import { getMetersBetween } from './distanceEngine.js';

/**
 * Comprueba si el usuario actual ha alcanzado el objetivo dentro del radio dado.
 *
 * @param {Object} opts
 * @param {{ lat: number, lng: number } | [number, number]} opts.currentUserLocation
 * @param {{ lat: number, lng: number } | [number, number]} opts.targetLocation
 * @param {number} [opts.maxDistanceMeters=5]
 * @param {number} [opts.minAccuracyMeters] — si la precisión reportada es peor, no considerar válido (opcional)
 * @returns {boolean}
 */
export function hasReachedTarget(opts) {
  const { currentUserLocation, targetLocation, maxDistanceMeters = 5, minAccuracyMeters } = opts;

  if (!currentUserLocation || !targetLocation) return false;

  const dist = getMetersBetween(currentUserLocation, targetLocation);
  if (!Number.isFinite(dist)) return false;

  if (minAccuracyMeters != null && opts.currentUserLocation?.accuracy != null) {
    if (opts.currentUserLocation.accuracy > minAccuracyMeters) return false;
  }

  return dist <= maxDistanceMeters;
}

/**
 * Distancia en metros al objetivo.
 * @param {Object} opts
 * @param {{ lat: number, lng: number } | [number, number]} opts.from
 * @param {{ lat: number, lng: number } | [number, number]} opts.to
 * @returns {number|null}
 */
export function getDistanceToTarget(opts) {
  const { from, to } = opts;
  if (!from || !to) return null;
  const m = getMetersBetween(from, to);
  return Number.isFinite(m) ? m : null;
}
