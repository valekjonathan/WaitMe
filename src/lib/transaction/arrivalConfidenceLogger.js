/**
 * Logger de Arrival Confidence Score.
 * Registra score y métricas para auditoría y debugging.
 *
 * @module arrivalConfidenceLogger
 */

const MAX_LOGS = 100;

/** @type {Array<{ timestamp: number, score: number, distanceAB?: number, distanceBAlert?: number, accuracyA?: number, accuracyB?: number, speedB?: number, stabilityMs?: number, fraudFlags?: string[] }>} */
const logs = [];

export function logArrivalConfidence(evt) {
  const entry = {
    timestamp: evt.timestamp ?? Date.now(),
    score: evt.score ?? 0,
    distanceAB: evt.distanceAB ?? null,
    distanceBAlert: evt.distanceBAlert ?? null,
    accuracyA: evt.accuracyA ?? null,
    accuracyB: evt.accuracyB ?? null,
    speedB: evt.speedB ?? null,
    stabilityMs: evt.stabilityMs ?? null,
    fraudFlags: evt.fraudFlags ?? null,
  };
  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.shift();
}

export function getArrivalConfidenceLogs() {
  return [...logs];
}

export function clearArrivalConfidenceLogs() {
  logs.length = 0;
}
