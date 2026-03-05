/**
 * Iconos de vehículo para el mapa.
 * Tipos: car, suv, van
 * Colores: white, black, blue, red, green, yellow, purple, orange
 */

const COLOR_MAP = {
  white: '#FFFFFF',
  black: '#1a1a1a',
  blue: '#3b82f6',
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  orange: '#f97316',
  gray: '#6b7280',
  gris: '#6b7280',
  blanco: '#FFFFFF',
  negro: '#1a1a1a',
  azul: '#3b82f6',
  rojo: '#ef4444',
  verde: '#22c55e',
  amarillo: '#eab308',
  morado: '#a855f7',
  naranja: '#f97316',
};

function toHexColor(color) {
  if (!color || typeof color !== 'string') return COLOR_MAP.gray;
  const key = String(color).toLowerCase().trim();
  return COLOR_MAP[key] ?? COLOR_MAP.gray;
}

/**
 * Devuelve el SVG del coche con el tipo y color indicados.
 * @param {string} type - car | suv | van
 * @param {string} color - white | black | blue | red | green | yellow | purple | orange (o español)
 * @returns {string} HTML del marcador (div con SVG)
 */
export function getVehicleIcon(type = 'car', color = 'gray') {
  const hex = toHexColor(color);
  const t = String(type || 'car').toLowerCase();

  let path = '';
  if (t === 'van') {
    path = `<path d="M6 12 L6 24 L42 24 L42 14 L38 12 Z" fill="${hex}" stroke="white" stroke-width="1.5"/><circle cx="14" cy="24" r="3" fill="#333"/><circle cx="34" cy="24" r="3" fill="#333"/>`;
  } else if (t === 'suv') {
    path = `<path d="M8 18 L10 10 L16 8 L32 8 L38 10 L42 16 L42 24 L8 24 Z" fill="${hex}" stroke="white" stroke-width="1.5"/><circle cx="14" cy="24" r="4" fill="#333"/><circle cx="36" cy="24" r="4" fill="#333"/>`;
  } else {
    path = `<path d="M8 20 L10 14 L16 12 L32 12 L38 14 L42 18 L42 24 L8 24 Z" fill="${hex}" stroke="white" stroke-width="1.5"/><circle cx="14" cy="24" r="4" fill="#333"/><circle cx="36" cy="24" r="4" fill="#333"/>`;
  }

  const svg = `<svg width="48" height="30" viewBox="0 0 48 30" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">${path}</svg>`;
  return `<div style="width:48px;height:30px;cursor:pointer;">${svg}</div>`;
}
