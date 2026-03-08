/**
 * Interpolación suave entre coordenadas para animación de movimiento.
 * Arquitectura preparada para realtime tipo Uber. NO activado aún.
 *
 * @module mapLayers/interpolatePosition
 */

/**
 * Interpola entre dos posiciones.
 * @param {{ lat: number, lng: number } | [number, number]} from - { lat, lng } o [lat, lng]
 * @param {{ lat: number, lng: number } | [number, number]} to - { lat, lng } o [lat, lng]
 * @param {number} progress - 0..1 (0 = from, 1 = to)
 * @returns {{ lat: number, lng: number }}
 */
export function interpolatePosition(from, to, progress) {
  const fromLat = Array.isArray(from) ? from[0] : (from?.lat ?? from?.latitude);
  const fromLng = Array.isArray(from) ? from[1] : (from?.lng ?? from?.longitude);
  const toLat = Array.isArray(to) ? to[0] : (to?.lat ?? to?.latitude);
  const toLng = Array.isArray(to) ? to[1] : (to?.lng ?? to?.longitude);

  if (
    fromLat == null ||
    fromLng == null ||
    toLat == null ||
    toLng == null ||
    !Number.isFinite(progress)
  ) {
    return { lat: fromLat ?? toLat, lng: fromLng ?? toLng };
  }

  const t = Math.max(0, Math.min(1, progress));
  return {
    lat: fromLat + (toLat - fromLat) * t,
    lng: fromLng + (toLng - fromLng) * t,
  };
}
