/**
 * Canonical factory for the ['alerts', mode, locationKey] query key.
 *
 * Using a single factory ensures every setQueryData / getQueryData /
 * invalidateQueries call in the app targets exactly the same key structure
 * as the useQuery that owns the data, eliminating key-mismatch bugs.
 *
 * For prefix-wide invalidation (all alert variants) pass no arguments:
 *   queryClient.invalidateQueries({ queryKey: alertsPrefix })
 */

import { NEARBY_REFRESH_THRESHOLD_M } from '@/config/alerts';

/** Exact key for a specific mode + location combination. */
export const alertsKey = (mode, locationKey) => ['alerts', mode, locationKey];

/** Key for nearby alerts (used by Home map in both logo and search modes). */
export const nearbyAlertsKey = (locationKey) => ['alerts', 'nearby', locationKey];

/** Key for viewport alerts (mapa en modo search, carga por bounds). */
export const viewportAlertsKey = (boundsKey, limit) => ['alerts', 'viewport', boundsKey, limit];

/** Prefix key — invalidates ALL alert query variants at once. */
export const alertsPrefix = ['alerts'];

import { toLatLngArray } from '@/lib/location';

/**
 * Extrae lat/lng de userLocation (array o objeto).
 * @param {[number,number]|{lat,lng,latitude,longitude}} userLocation
 * @returns {{ lat: number, lng: number }|null}
 */
export function extractLatLng(userLocation) {
  const arr = toLatLngArray(userLocation);
  return arr ? { lat: arr[0], lng: arr[1] } : null;
}

/**
 * Genera locationKey para nearby: solo cambia cuando el usuario se mueve
 * más de NEARBY_REFRESH_THRESHOLD_M. Evita refetches por movimientos mínimos.
 * @param {number} lat
 * @param {number} lng
 * @returns {string|null} "lat,lng" o null si inválido
 */
export function getLocationKeyForNearby(lat, lng) {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const gridDeg = NEARBY_REFRESH_THRESHOLD_M / 111000;
  const latSnap = Math.floor(lat / gridDeg) * gridDeg;
  const lngSnap = Math.floor(lng / gridDeg) * gridDeg;
  return `${latSnap.toFixed(5)},${lngSnap.toFixed(5)}`;
}

/**
 * Genera boundsKey para viewport: evita refetches por movimientos mínimos del mapa.
 * @param {{ swLat, swLng, neLat, neLng }} bounds
 * @param {number} gridDeg - tamaño de celda en grados (ej. 0.002 ≈ 220m)
 * @returns {string|null}
 */
export function getBoundsKeyForViewport(bounds, gridDeg = 0.002) {
  if (
    bounds?.swLat == null ||
    bounds?.swLng == null ||
    bounds?.neLat == null ||
    bounds?.neLng == null
  )
    return null;
  const { swLat, swLng, neLat, neLng } = bounds;
  if (
    !Number.isFinite(swLat) ||
    !Number.isFinite(swLng) ||
    !Number.isFinite(neLat) ||
    !Number.isFinite(neLng)
  )
    return null;
  const swLatSnap = Math.floor(swLat / gridDeg) * gridDeg;
  const swLngSnap = Math.floor(swLng / gridDeg) * gridDeg;
  const neLatSnap = Math.floor(neLat / gridDeg) * gridDeg;
  const neLngSnap = Math.floor(neLng / gridDeg) * gridDeg;
  return `${swLatSnap.toFixed(4)},${swLngSnap.toFixed(4)},${neLatSnap.toFixed(4)},${neLngSnap.toFixed(4)}`;
}
