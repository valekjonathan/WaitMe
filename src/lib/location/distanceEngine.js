/**
 * Motor de distancia entre dos puntos.
 * Usado para ETA, proximidad y liberación de pago.
 *
 * @module distanceEngine
 */

import { haversineKm } from '@/utils/carUtils';

/**
 * Distancia en metros entre dos puntos.
 * @param {{ lat: number, lng: number } | [number, number]} pointA — { lat, lng } o [lat, lng]
 * @param {{ lat: number, lng: number } | [number, number]} pointB
 * @returns {number} metros
 */
export function getMetersBetween(pointA, pointB) {
  const [lat1, lng1] = toLatLng(pointA);
  const [lat2, lng2] = toLatLng(pointB);
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return NaN;
  return haversineKm(lat1, lng1, lat2, lng2) * 1000;
}

/**
 * Distancia en km entre dos puntos.
 * @param {{ lat: number, lng: number } | [number, number]} pointA
 * @param {{ lat: number, lng: number } | [number, number]} pointB
 * @returns {number} km
 */
export function getKmBetween(pointA, pointB) {
  const [lat1, lng1] = toLatLng(pointA);
  const [lat2, lng2] = toLatLng(pointB);
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return NaN;
  return haversineKm(lat1, lng1, lat2, lng2);
}

/**
 * @param {{ lat?: number, lng?: number, latitude?: number, longitude?: number } | [number, number] | null | undefined} p
 * @returns {[number|null, number|null]}
 */
function toLatLng(p) {
  if (!p) return [null, null];
  if (Array.isArray(p) && p.length >= 2) return [Number(p[0]), Number(p[1])];
  const lat = p.lat ?? p.latitude;
  const lng = p.lng ?? p.longitude;
  return [lat != null ? Number(lat) : null, lng != null ? Number(lng) : null];
}
