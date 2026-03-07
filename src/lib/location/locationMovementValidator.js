/**
 * Validador de movimiento de ubicación.
 * Verifica speed, heading y consistencia de trayectoria.
 * Rechaza teleports y saltos imposibles.
 *
 * @module locationMovementValidator
 */

import { getMetersBetween } from './distanceEngine.js';
import { checkLocationFraud } from './locationFraudDetector.js';

const MAX_JUMP_M = 200;
const MAX_SPEED_KMH = 150;
const MIN_HEADING_CONSISTENCY = 0.7;

/**
 * Valida que el movimiento sea físico y consistente.
 * @param {{ lat: number, lng: number } | [number, number]} prev
 * @param {{ lat: number, lng: number } | [number, number]} current
 * @param {{ timestamp?: number, prevTimestamp?: number, speed?: number, heading?: number, mock?: boolean, userId?: string } | null} meta
 * @returns {{ valid: boolean, reason?: string, speed?: number }}
 */
export function validateMovement(prev, current, meta = null) {
  if (!prev || !current) return { valid: false, reason: 'missing_position' };

  const metaBase = {
    timestamp: meta?.timestamp ?? Date.now(),
    speed: meta?.speed ?? null,
    accuracy: meta?.accuracy ?? null,
    mock: meta?.mock ?? false,
    userId: meta?.userId ?? 'unknown',
  };

  checkLocationFraud(prev, {
    ...metaBase,
    timestamp: meta?.prevTimestamp ?? metaBase.timestamp - 1000,
  });
  const result = checkLocationFraud(current, metaBase);

  if (result.fraud) return { valid: false, reason: result.reason };

  const distance = getMetersBetween(prev, current);
  if (!Number.isFinite(distance)) return { valid: false, reason: 'invalid_distance' };
  if (distance > MAX_JUMP_M) return { valid: false, reason: 'teleport' };

  const dtSec =
    meta?.timestamp && meta?.prevTimestamp ? (meta.timestamp - meta.prevTimestamp) / 1000 : null;
  if (dtSec != null && dtSec > 0) {
    const impliedSpeedMps = distance / dtSec;
    const impliedSpeedKmh = (impliedSpeedMps * 3600) / 1000;
    if (impliedSpeedKmh > MAX_SPEED_KMH) {
      return { valid: false, reason: 'speed_impossible', speed: impliedSpeedKmh };
    }
  }

  if (meta?.speed != null) {
    const speedKmh = (meta.speed * 3600) / 1000;
    if (speedKmh > MAX_SPEED_KMH) {
      return { valid: false, reason: 'speed_impossible', speed: speedKmh };
    }
  }

  return { valid: true };
}

/**
 * Indica si una ubicación puede usarse para transacciones (sin fraude).
 * @param {{ lat: number, lng: number } | [number, number]} location
 * @param {{ speed?: number, accuracy?: number, mock?: boolean } | null} meta
 * @returns {boolean}
 */
export function isMovementValidForTransaction(location, meta = null) {
  const result = checkLocationFraud(location, {
    ...meta,
    timestamp: meta?.timestamp ?? Date.now(),
  });
  return !result.fraud;
}
