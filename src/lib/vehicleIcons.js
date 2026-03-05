/**
 * Iconos de vehículo — mapa, tarjetas, botón "¡Estoy aparcado aquí!".
 * Tipos: car, suv, van. Colores del perfil del usuario.
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

function getCarSvgPath(type, hex) {
  const t = String(type || 'car').toLowerCase();
  if (t === 'van') {
    return `<path d="M6 12 L6 24 L42 24 L42 14 L38 12 Z" fill="${hex}" stroke="white" stroke-width="1.5"/><circle cx="14" cy="24" r="3" fill="#333"/><circle cx="34" cy="24" r="3" fill="#333"/>`;
  }
  if (t === 'suv') {
    return `<path d="M8 18 L10 10 L16 8 L32 8 L38 10 L42 16 L42 24 L8 24 Z" fill="${hex}" stroke="white" stroke-width="1.5"/><circle cx="14" cy="24" r="4" fill="#333"/><circle cx="36" cy="24" r="4" fill="#333"/>`;
  }
  return `<path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill="${hex}" stroke="white" stroke-width="1.5"/><path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.3)" stroke="white" stroke-width="0.5"/><circle cx="14" cy="18" r="4" fill="#333" stroke="white" stroke-width="1"/><circle cx="14" cy="18" r="2" fill="#666"/><circle cx="36" cy="18" r="4" fill="#333" stroke="white" stroke-width="1"/><circle cx="36" cy="18" r="2" fill="#666"/>`;
}

/**
 * Icono 52px con precio centrado — para marcadores del mapa.
 * @param {string} type - car | suv | van
 * @param {string} color - white | black | blue | ...
 * @param {number} price - precio en euros
 */
export function getCarWithPriceHtml(type = 'car', color = 'gray', price = 0) {
  const hex = toHexColor(color);
  const path = getCarSvgPath(type, hex);
  const priceText = `€${Math.round(Number(price) || 0)}`;
  return `<div class="waitme-car-marker" style="width:52px;height:32px;position:relative;cursor:pointer;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">
    <svg width="52" height="32" viewBox="0 0 48 24" fill="none" style="display:block">${path}</svg>
    <div style="position:absolute;top:6px;left:0;right:0;text-align:center;font-size:11px;font-weight:700;color:white;text-shadow:0 1px 2px rgba(0,0,0,0.8)">${priceText}</div>
  </div>`;
}

/**
 * SVG idéntico a CarIconProfile (botón "¡Estoy aparcado aquí!").
 * @param {string} color - white | black | blue | ... (o español)
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
