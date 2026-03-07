/**
 * Motor de transacción basado en proximidad.
 * Reglas antifraude: distance ≤6m, accuracy ≤20m, speed ≤3kmh, durante ≥10s.
 * Verificación doble: distance(userA,userB) Y distance(userB,alertLocation).
 * Requiere arrivalConfidence >= 80 para liberar pago.
 *
 * @module transactionEngine
 */

import { getMetersBetween } from '@/lib/location';
import { checkLocationFraud } from '@/lib/location/locationFraudDetector.js';
import { getArrivalConfidence, getRecentFraudFlags } from './arrivalConfidenceEngine.js';
import { logArrivalConfidence } from './arrivalConfidenceLogger.js';

const ARRIVAL_THRESHOLD_M = 6;
const CANCEL_THRESHOLD_M = 7;
const RESET_DISTANCE_M = 7;
const STABILITY_DURATION_MS = 10000;
const MAX_ACCURACY_M = 20;
const MAX_SPEED_KMH = 3;
const ARRIVAL_CONFIDENCE_THRESHOLD = 80;
const POLL_INTERVAL_MS = 500;

/** @type {ReturnType<typeof setInterval>|null} */
let intervalId = null;

/** @type {boolean} */
let hasCalledOnArrived = false;

/** @type {number|null} */
let stabilityStartMs = null;

/**
 * @typedef {Object} MonitoringOptions
 * @property {() => { lat: number, lng: number } | [number, number] | null} getUserALocation
 * @property {() => { lat: number, lng: number } | [number, number] | null} getUserBLocation
 * @property {() => { lat: number, lng: number } | [number, number] | null} [getAlertLocation] — ubicación plaza (verificación doble)
 * @property {() => number|null} [getUserAAccuracy]
 * @property {() => number|null} [getUserBAccuracy]
 * @property {() => number|null} [getUserBSpeed] — km/h (debe ser ≤3 para completar)
 * @property {() => void} [onArrived]
 * @property {(ctx?: object) => void} [onCompleted]
 */

/**
 * Inicia el monitoreo de proximidad.
 * Evalúa cada 500ms.
 *
 * @param {MonitoringOptions} opts
 */
export function startTransactionMonitoring(opts) {
  if (intervalId != null) return;

  const {
    getUserALocation,
    getUserBLocation,
    getAlertLocation = () => null,
    getUserAAccuracy = () => null,
    getUserBAccuracy = () => null,
    getUserBSpeed = () => null,
    onArrived = () => {},
    onCompleted = () => {},
  } = opts;

  hasCalledOnArrived = false;
  stabilityStartMs = null;

  intervalId = setInterval(() => {
    const now = Date.now();
    const locA = getUserALocation?.();
    const locB = getUserBLocation?.();
    const alertLoc = getAlertLocation?.();

    if (!locA || !locB) return;

    const accA = getUserAAccuracy?.() ?? null;
    const accB = getUserBAccuracy?.() ?? null;
    if (accA != null && accA > MAX_ACCURACY_M) return;
    if (accB != null && accB > MAX_ACCURACY_M) return;

    const speedB = getUserBSpeed?.() ?? null;
    if (speedB != null && speedB > MAX_SPEED_KMH) return;

    const fraudCheck = checkLocationFraud(locB, {
      timestamp: Date.now(),
      speed: speedB != null ? (speedB * 1000) / 3600 : null,
      accuracy: accB,
    });
    if (fraudCheck.fraud) return;

    const distanceAB = getMetersBetween(locA, locB);
    if (!Number.isFinite(distanceAB)) return;

    let distanceBAlert = distanceAB;
    if (alertLoc) {
      distanceBAlert = getMetersBetween(locB, alertLoc);
      if (!Number.isFinite(distanceBAlert)) return;
    }

    const distanceOk = distanceAB <= ARRIVAL_THRESHOLD_M;
    const alertOk = !alertLoc || distanceBAlert <= ARRIVAL_THRESHOLD_M;
    const bothOk = distanceOk && alertOk;

    if (distanceAB > RESET_DISTANCE_M || (alertLoc && distanceBAlert > RESET_DISTANCE_M)) {
      stabilityStartMs = null;
      return;
    }

    const recentFraud = getRecentFraudFlags();
    const stabilityMs = stabilityStartMs != null ? now - stabilityStartMs : 0;
    const { score: arrivalScore, invalid } = getArrivalConfidence({
      userALocation: locA,
      userBLocation: locB,
      alertLocation: alertLoc,
      accuracyA: accA,
      accuracyB: accB,
      speedB,
      stabilityMs,
      recentFraudFlags: recentFraud,
    });

    logArrivalConfidence({
      timestamp: Date.now(),
      score: arrivalScore,
      distanceAB,
      distanceBAlert: alertLoc ? distanceBAlert : null,
      accuracyA: accA,
      accuracyB: accB,
      speedB,
      stabilityMs,
      fraudFlags: recentFraud.length ? recentFraud : null,
    });

    if (invalid || arrivalScore < ARRIVAL_CONFIDENCE_THRESHOLD) {
      stabilityStartMs = null;
      return;
    }

    if (bothOk) {
      if (!hasCalledOnArrived) {
        hasCalledOnArrived = true;
        try {
          onArrived();
        } catch (e) {
          if (import.meta.env.DEV) console.warn('[transactionEngine] onArrived error', e);
        }
      }

      if (stabilityStartMs == null) {
        stabilityStartMs = now;
      } else if (now - stabilityStartMs >= STABILITY_DURATION_MS) {
        stopTransactionMonitoring();
        const ctx = {
          distance: distanceAB,
          distanceBAlert: alertLoc ? distanceBAlert : null,
          accuracyA: accA,
          accuracyB: accB,
          speedB,
          arrivalConfidence: arrivalScore,
        };
        try {
          onCompleted(ctx);
        } catch (e) {
          if (import.meta.env.DEV) console.warn('[transactionEngine] onCompleted error', e);
        }
      }
    } else {
      stabilityStartMs = null;
    }
  }, POLL_INTERVAL_MS);
}

/**
 * Detiene el monitoreo.
 */
export function stopTransactionMonitoring() {
  if (intervalId != null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  stabilityStartMs = null;
}
