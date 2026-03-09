/**
 * Trazabilidad forense del flujo auth.
 * Solo activo con VITE_DEBUG_OAUTH=true o import.meta.env.DEV.
 * Para ver traces en build iOS: VITE_DEBUG_OAUTH=true npm run ios:fresh
 */
const ENABLED = import.meta.env.DEV || import.meta.env.VITE_DEBUG_OAUTH === 'true';

let _traceCounter = 0;
const nextId = () => {
  _traceCounter += 1;
  return _traceCounter;
};

export function authTrace(id, file, fn, msg, ...args) {
  if (!ENABLED) return;
  const n = typeof id === 'number' ? id : nextId();
  console.log(`[AUTH TRACE ${n}][${file}][${fn}] ${msg}`, ...args);
}

export function updateAuthDebug(updates) {
  if (!ENABLED) return;
  if (typeof window === 'undefined') return;
  window.__WAITME_AUTH_DEBUG = {
    ...(window.__WAITME_AUTH_DEBUG || {}),
    ...updates,
    _lastUpdate: Date.now(),
  };
}

export function getAuthDebug() {
  return (typeof window !== 'undefined' && window.__WAITME_AUTH_DEBUG) || {};
}
