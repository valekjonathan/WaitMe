/**
 * Icono de coche — MISMO que el botón "¡Estoy aparcado aquí!" (CarIconProfile).
 * Reutilizado en mapa, tarjetas y botón publicar.
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
 * SVG idéntico a CarIconProfile (botón "¡Estoy aparcado aquí!").
 * @param {string} color - white | black | blue | red | ... (o español)
 * @returns {string} HTML del marcador
 */
export function getCarIconHtml(color = 'gray') {
  const hex = toHexColor(color);
  const svg = `<svg width="48" height="24" viewBox="0 0 48 24" fill="none">
    <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill="${hex}" stroke="white" stroke-width="1.5"/>
    <path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.3)" stroke="white" stroke-width="0.5"/>
    <circle cx="14" cy="18" r="4" fill="#333" stroke="white" stroke-width="1"/>
    <circle cx="14" cy="18" r="2" fill="#666"/>
    <circle cx="36" cy="18" r="4" fill="#333" stroke="white" stroke-width="1"/>
    <circle cx="36" cy="18" r="2" fill="#666"/>
  </svg>`;
  return `<div style="width:48px;height:24px;cursor:pointer;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">${svg}</div>`;
}
