/**
 * Motor de transacción basado en proximidad.
 * Monitorea distancia entre usuario A (vendedor) y B (comprador).
 * Cuando ambos están ≤5m durante 8s continuos → onCompleted.
 *
 * @module transactionEngine
 */

import { getMetersBetween } from '@/lib/location';

const ARRIVAL_THRESHOLD_M = 5;
const CANCEL_THRESHOLD_M = 7;
const STABILITY_DURATION_MS = 8000;
const MAX_ACCURACY_M = 30;
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
 * @property {() => number|null} [getUserAAccuracy] — si > 30, no activar
 * @property {() => number|null} [getUserBAccuracy]
 * @property {() => void} [onArrived] — cuando distance ≤ 5m por primera vez
 * @property {() => void} [onCompleted] — cuando distance ≤ 5m durante 8s
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
    getUserAAccuracy = () => null,
    getUserBAccuracy = () => null,
    onArrived = () => {},
    onCompleted = () => {},
  } = opts;

  hasCalledOnArrived = false;
  stabilityStartMs = null;

  intervalId = setInterval(() => {
    const locA = getUserALocation?.();
    const locB = getUserBLocation?.();

    if (!locA || !locB) return;

    const accA = getUserAAccuracy?.() ?? null;
    const accB = getUserBAccuracy?.() ?? null;
    if (accA != null && accA > MAX_ACCURACY_M) return;
    if (accB != null && accB > MAX_ACCURACY_M) return;

    const distance = getMetersBetween(locA, locB);
    if (!Number.isFinite(distance)) return;

    if (distance > CANCEL_THRESHOLD_M) {
      stabilityStartMs = null;
      return;
    }

    if (distance <= ARRIVAL_THRESHOLD_M) {
      if (!hasCalledOnArrived) {
        hasCalledOnArrived = true;
        try {
          onArrived();
        } catch (e) {
          if (import.meta.env.DEV) console.warn('[transactionEngine] onArrived error', e);
        }
      }

      const now = Date.now();
      if (stabilityStartMs == null) {
        stabilityStartMs = now;
      } else if (now - stabilityStartMs >= STABILITY_DURATION_MS) {
        stopTransactionMonitoring();
        const ctx = { distance, accuracyA: accA, accuracyB: accB };
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
