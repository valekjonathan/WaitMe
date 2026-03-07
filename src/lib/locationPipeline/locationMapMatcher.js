/**
 * Map matching — preparado para Mapbox Map Matching API.
 * Por ahora: identity (devuelve posición tal cual).
 *
 * @module locationMapMatcher
 */

/**
 * Ajusta posición a la carretera más cercana.
 * Preparado para: Mapbox Map Matching API (snap to road).
 *
 * @param {{ lat: number, lng: number, accuracy?: number, speed?: number, heading?: number, timestamp?: number }} position
 * @returns {Promise<{ lat: number, lng: number, accuracy?: number, speed?: number, heading?: number, timestamp?: number }>}
 */
export async function snapToRoad(position) {
  return Promise.resolve({
    lat: position.lat,
    lng: position.lng,
    accuracy: position.accuracy,
    speed: position.speed,
    heading: position.heading,
    timestamp: position.timestamp,
  });
}

/**
 * Versión síncrona (identity).
 * @param {{ lat: number, lng: number }} position
 * @returns {{ lat: number, lng: number }}
 */
export function snapToRoadSync(position) {
  return { lat: position.lat, lng: position.lng };
}
