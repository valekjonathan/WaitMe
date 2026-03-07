/**
 * Motor de predicción de movimiento.
 * Predice posición a 1s usando velocity y heading.
 * Solo cuando el coche de WaitMe viene hacia el usuario.
 *
 * @module locationPrediction
 */

const EARTH_RADIUS_M = 6371000;
const DEG_TO_RAD = Math.PI / 180;

/**
 * Predice posición a t segundos.
 * @param {{ lat: number, lng: number }} position
 * @param {{ speed: number, heading: number }} motion — speed en m/s, heading en grados (0=N, 90=E)
 * @param {number} [t=1] — segundos
 * @returns {{ lat: number, lng: number }}
 */
export function predictPosition(position, motion, t = 1) {
  const { lat, lng } = position;
  const speedMps = motion.speed ?? 0;
  const headingDeg = motion.heading ?? 0;

  if (speedMps <= 0) return { lat, lng };

  const d = speedMps * t;
  const headingRad = headingDeg * DEG_TO_RAD;
  const latRad = lat * DEG_TO_RAD;
  const dLat = (d / EARTH_RADIUS_M) * Math.cos(headingRad);
  const dLng = (d / (EARTH_RADIUS_M * Math.cos(latRad))) * Math.sin(headingRad);

  return {
    lat: lat + dLat / DEG_TO_RAD,
    lng: lng + dLng / DEG_TO_RAD,
  };
}

/**
 * Predice a 1 segundo (caso típico).
 */
export function predictPosition1s(position, motion) {
  return predictPosition(position, motion, 1);
}
