/**
 * Validador de movimiento — pipeline version.
 * Detecta: teleports, trayectorias imposibles, cambios de heading extremos.
 *
 * @module locationPipeline/locationMovementValidator
 */

import { getMetersBetween } from '@/lib/location/distanceEngine.js';
import { checkLocationFraud } from './locationFraudDetector.js';

const MAX_JUMP_M = 200;
const MAX_SPEED_KMH = 150;

/**
 * @param {{ lat: number, lng: number } | [number, number]} prev
 * @param {{ lat: number, lng: number } | [number, number]} current
 * @param {{ timestamp?: number, prevTimestamp?: number, speed?: number, heading?: number }} meta
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateMovement(prev, current, meta = null) {
  if (!prev || !current) return { valid: false, reason: 'missing_position' };

  const metaBase = {
    timestamp: meta?.timestamp ?? Date.now(),
    speed: meta?.speed ?? null,
    accuracy: meta?.accuracy ?? null,
    mock: meta?.mock ?? false,
  };

  checkLocationFraud(prev, {
    ...metaBase,
    timestamp: meta?.prevTimestamp ?? metaBase.timestamp - 1000,
  });
  const fraudResult = checkLocationFraud(current, metaBase);

  if (fraudResult.fraud) return { valid: false, reason: fraudResult.reason };

  const distance = getMetersBetween(prev, current);
  if (!Number.isFinite(distance)) return { valid: false, reason: 'invalid_distance' };
  if (distance > MAX_JUMP_M) return { valid: false, reason: 'teleport' };

  const dtSec =
    meta?.timestamp && meta?.prevTimestamp ? (meta.timestamp - meta.prevTimestamp) / 1000 : null;
  if (dtSec != null && dtSec > 0) {
    const impliedSpeedKmh = (distance / dtSec) * 3.6;
    if (impliedSpeedKmh > MAX_SPEED_KMH) {
      return { valid: false, reason: 'speed_impossible' };
    }
  }

  return { valid: true };
}
