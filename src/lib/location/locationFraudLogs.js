/**
 * Logs de fraude de ubicación.
 * Registra eventos para auditoría y debugging.
 *
 * @module locationFraudLogs
 */

const MAX_LOGS = 200;
/** @type {Array<{ timestamp: number, user: string, reason: string, distanceJump?: number, speed?: number, accuracy?: number, location?: { lat: number, lng: number } }>} */
const logs = [];

export function logLocationFraud(evt) {
  const entry = {
    timestamp: evt.timestamp ?? Date.now(),
    user: evt.user ?? 'unknown',
    reason: evt.reason ?? 'unknown',
    distanceJump: evt.distanceJump ?? null,
    speed: evt.speed ?? null,
    accuracy: evt.accuracy ?? null,
    location: evt.location ?? null,
  };
  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.shift();
}

export function getLocationFraudLogs() {
  return [...logs];
}

export function clearLocationFraudLogs() {
  logs.length = 0;
}
