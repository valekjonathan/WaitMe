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
