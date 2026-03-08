/**
 * Utilidades del demo flow.
 * @module lib/demo/demoFlowUtils
 */

export function safeCall(fn) {
  try {
    fn?.();
  } catch (error) {
    console.error('[WaitMe Error]', error);
  }
}

export function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

export function normalize(s) {
  return String(s || '')
    .trim()
    .toLowerCase();
}

export function statusToTitle(status) {
  const s = normalize(status);
  if (s === 'thinking' || s === 'me_lo_pienso' || s === 'me lo pienso' || s === 'pending')
    return 'ME LO PIENSO';
  if (s === 'extended' || s === 'prorroga' || s === 'prórroga' || s === 'prorrogada')
    return 'PRÓRROGA';
  if (s === 'cancelled' || s === 'canceled' || s === 'cancelada') return 'CANCELADA';
  if (s === 'expired' || s === 'expirada' || s === 'agotada') return 'AGOTADA';
  if (s === 'rejected' || s === 'rechazada') return 'RECHAZADA';
  if (s === 'completed' || s === 'completada') return 'COMPLETADA';
  if (s === 'reserved' || s === 'activa' || s === 'active') return 'ACTIVA';
  return 'ACTUALIZACIÓN';
}
