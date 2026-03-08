/**
 * Logger de transacciones por proximidad.
 * Registra eventos para debugging y auditoría.
 *
 * @module transactionLogger
 */

const MAX_LOGS = 100;
/** @type {Array<{ timestamp: number, userA: string, userB: string, distance: number, accuracyA?: number, accuracyB?: number, state: string }>} */
const logs = [];

export function logProximityEvent(evt) {
  const entry = {
    timestamp: Date.now(),
    userA: evt.userA ?? evt.userAId ?? '?',
    userB: evt.userB ?? evt.userBId ?? '?',
    distance: evt.distance ?? 0,
    accuracyA: evt.accuracyA ?? evt.accuracyUserA ?? null,
    accuracyB: evt.accuracyB ?? evt.accuracyUserB ?? null,
    state: evt.state ?? 'unknown',
    alertId: evt.alertId ?? null,
  };
  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.shift();
  if (import.meta.env.DEV) {
    try {
      console.log('[transactionLogger]', entry);
    } catch (error) {
      console.error('[WaitMe Error]', error);
    }
  }
}

export function getProximityLogs() {
  return [...logs];
}

export function clearProximityLogs() {
  logs.length = 0;
}
