/**
 * Pipeline de localización profesional.
 * GPS raw → fraud detector → movement validator → kalman → smoothing → map matching → output.
 *
 * @module locationPipeline
 */

import { checkLocationFraud } from './locationFraudDetector.js';
import { validateMovement } from './locationMovementValidator.js';
import { createKalmanFilter } from './locationKalmanFilter.js';
import { createAdvancedSmoother } from './locationSmoothingAdvanced.js';
import { snapToRoadSync } from './locationMapMatcher.js';
import { logLocationDiagnostic } from './locationDiagnosticsLogger.js';

/** @type {ReturnType<typeof createKalmanFilter>|null} */
let kalman = null;
/** @type {ReturnType<typeof createAdvancedSmoother>|null} */
let smoother = null;
/** @type {{ lat: number, lng: number, timestamp: number }|null} */
let lastValid = null;

/**
 * Procesa posición raw por el pipeline completo.
 * @param {{ lat: number, lng: number, accuracy?: number, speed?: number, heading?: number, timestamp?: number, mock?: boolean }} raw
 * @returns {{ lat: number, lng: number, accuracy?: number, speed?: number, heading?: number, timestamp: number }|null} null si descartada por fraude
 */
export function processLocation(raw) {
  const ts = raw.timestamp ?? Date.now();
  const meta = {
    timestamp: ts,
    speed: raw.speed,
    accuracy: raw.accuracy ?? null,
    mock: raw.mock ?? false,
  };

  const fraud = checkLocationFraud({ lat: raw.lat, lng: raw.lng }, meta);
  if (fraud.fraud) {
    logLocationDiagnostic({ stage: 'fraud_rejected', raw, reason: fraud.reason });
    return null;
  }

  if (lastValid) {
    const valid = validateMovement(
      { lat: lastValid.lat, lng: lastValid.lng },
      { lat: raw.lat, lng: raw.lng },
      { ...meta, prevTimestamp: lastValid.timestamp }
    );
    if (!valid.valid) {
      logLocationDiagnostic({ stage: 'movement_rejected', raw, reason: valid.reason });
      return null;
    }
  }

  if (!kalman) kalman = createKalmanFilter();
  if (!smoother) smoother = createAdvancedSmoother();

  const kalmanOut = kalman.update({ lat: raw.lat, lng: raw.lng, accuracy: raw.accuracy });
  const smoothIn = { ...kalmanOut, accuracy: raw.accuracy, speed: raw.speed, timestamp: ts };
  const smoothOut = smoother.update(smoothIn);
  const snapped = snapToRoadSync({ lat: smoothOut.lat, lng: smoothOut.lng });

  lastValid = { lat: snapped.lat, lng: snapped.lng, timestamp: ts };

  const result = {
    lat: snapped.lat,
    lng: snapped.lng,
    accuracy: raw.accuracy ?? null,
    speed: raw.speed ?? null,
    heading: raw.heading ?? null,
    timestamp: ts,
  };

  logLocationDiagnostic({ stage: 'output', raw, result });
  return result;
}

/**
 * Resetea estado del pipeline.
 */
export function resetPipeline() {
  if (kalman) kalman.reset();
  if (smoother) smoother.reset();
  kalman = null;
  smoother = null;
  lastValid = null;
}
