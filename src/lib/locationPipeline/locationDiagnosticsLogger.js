/**
 * Logger de diagnósticos de localización.
 * Registra: accuracy, speed, distance jumps, fraud flags, pipeline output.
 *
 * @module locationDiagnosticsLogger
 */

const MAX_LOGS = 100;
/** @type {Array<object>} */
const logs = [];

export function logLocationDiagnostic(evt) {
  const entry = {
    timestamp: Date.now(),
    stage: evt.stage ?? 'unknown',
    raw: evt.raw ?? null,
    result: evt.result ?? null,
    reason: evt.reason ?? null,
  };
  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.shift();
}

export function getLocationDiagnostics() {
  return [...logs];
}

export function clearLocationDiagnostics() {
  logs.length = 0;
}
