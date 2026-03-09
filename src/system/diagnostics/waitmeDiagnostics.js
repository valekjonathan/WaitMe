/**
 * Diagnóstico centralizado WaitMe — mapa, controlador, Ubícate.
 * window.__WAITME_DIAG__ es la fuente única de verdad en runtime.
 */

const DIAG_FIELDS = [
  'mapCreated',
  'mapLoadedEvent',
  'styleLoaded',
  'controllerReady',
  'controllerReadyAt',
  'lastFlyToUserCall',
  'lastFlyToResult',
  'lastFlyToError',
  'locateFailureReason',
];

/**
 * Asegura que window.__WAITME_DIAG__ existe y devuelve la referencia.
 * @returns {Record<string, unknown>|undefined}
 */
export function ensureDiag() {
  if (typeof window === 'undefined') return undefined;
  if (!window.__WAITME_DIAG__) {
    window.__WAITME_DIAG__ = {};
  }
  return window.__WAITME_DIAG__;
}

/**
 * Imprime el estado completo del diagnóstico en consola.
 */
export function logWaitmeDiagnostics() {
  if (typeof window === 'undefined') return;
  const diag = window.__WAITME_DIAG__ || {};
  const out = {};
  for (const k of DIAG_FIELDS) {
    out[k] = diag[k];
  }
  console.group('[WaitMe] Diagnóstico');
  console.log('window.waitmeMap:', !!window.waitmeMap);
  console.log('flyToUser:', typeof window.waitmeMap?.flyToUser);
  console.log('__WAITME_DIAG__:', out);
  console.groupEnd();
}

// Exponer en window para uso desde consola (ej. logWaitmeDiagnostics())
if (typeof window !== 'undefined') {
  window.logWaitmeDiagnostics = logWaitmeDiagnostics;
}
