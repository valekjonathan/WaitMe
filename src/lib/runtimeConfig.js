/**
 * Validación centralizada de configuración en runtime.
 * Se ejecuta al inicio; no lanza errores silenciosos.
 * Permite saber exactamente qué falta.
 *
 * @module runtimeConfig
 */

const PLACEHOLDERS = [
  'PEGA_AQUI_EL_TOKEN',
  'YOUR_MAPBOX_PUBLIC_TOKEN',
  'tu_anon_key',
  'TU_PROYECTO',
];

function isPlaceholder(val) {
  if (!val || typeof val !== 'string') return true;
  const v = val.trim();
  if (!v) return true;
  return PLACEHOLDERS.some((p) => v.includes(p) || v === p);
}

function getEnv(key) {
  try {
    const v = import.meta.env[key];
    return v != null ? String(v).trim() : '';
  } catch {
    return '';
  }
}

/**
 * Resultado de validación.
 * @typedef {Object} RuntimeConfigResult
 * @property {boolean} ok - true si la app puede arrancar
 * @property {string[]} missing - variables que faltan o son placeholder
 * @property {boolean} hasSupabase - Supabase configurado
 * @property {boolean} hasMapbox - Mapbox token configurado
 * @property {boolean} canBoot - mínimo para no crashear (Supabase)
 */

let _cached = null;

/**
 * Valida todas las variables críticas al inicio.
 * @returns {RuntimeConfigResult}
 */
export function getRuntimeConfig() {
  if (_cached) return _cached;

  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const mapboxToken = getEnv('VITE_MAPBOX_TOKEN');

  const missing = [];
  if (!supabaseUrl || isPlaceholder(supabaseUrl)) missing.push('VITE_SUPABASE_URL');
  if (!supabaseKey || isPlaceholder(supabaseKey)) missing.push('VITE_SUPABASE_ANON_KEY');
  if (!mapboxToken || isPlaceholder(mapboxToken)) missing.push('VITE_MAPBOX_TOKEN');

  const hasSupabase =
    !missing.includes('VITE_SUPABASE_URL') && !missing.includes('VITE_SUPABASE_ANON_KEY');
  const hasMapbox = !missing.includes('VITE_MAPBOX_TOKEN');

  _cached = {
    ok: missing.length === 0,
    missing,
    hasSupabase,
    hasMapbox,
    canBoot: hasSupabase,
  };
  return _cached;
}

/**
 * Resetea caché (para tests).
 */
export function resetRuntimeConfig() {
  _cached = null;
}
