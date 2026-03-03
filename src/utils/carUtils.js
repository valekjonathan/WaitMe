/**
 * Shared car-related utilities used across multiple components.
 */

export const CAR_COLOR_MAP = {
  blanco:   '#FFFFFF',
  negro:    '#1a1a1a',
  gris:     '#6b7280',
  plata:    '#d1d5db',
  rojo:     '#ef4444',
  azul:     '#3b82f6',
  verde:    '#22c55e',
  amarillo: '#eab308',
  naranja:  '#f97316',
  morado:   '#7c3aed',
  rosa:     '#ec4899',
  beige:    '#d4b483',
  marron:   '#92400e',
};

/**
 * Returns a hex color for a Spanish car color name.
 * @param {string} colorName - e.g. "azul", "rojo"
 * @returns {string} hex color string
 */
export function getCarFill(colorName) {
  if (!colorName) return '#6b7280';
  const key = String(colorName)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return CAR_COLOR_MAP[key] ?? '#6b7280';
}

/**
 * Formats a Spanish license plate string as "NNNN LLL".
 * @param {string} plate
 * @returns {string}
 */
export function formatPlate(plate) {
  const p = String(plate || '').replace(/\s+/g, '').toUpperCase();
  if (!p) return '0000 XXX';
  return `${p.slice(0, 4)} ${p.slice(4)}`.trim();
}

/**
 * Haversine distance in kilometres between two lat/lon points.
 * @returns {number} km
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Haversine distance in metres.
 * @returns {number} metres
 */
export function haversineMeters(lat1, lon1, lat2, lon2) {
  return haversineKm(lat1, lon1, lat2, lon2) * 1000;
}
