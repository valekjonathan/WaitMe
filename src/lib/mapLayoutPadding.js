/**
 * Fuente única de verdad para padding del mapa y geometría del layout.
 * Usado por MapboxMap, CreateAlertCard y validación de layout.
 *
 * Reglas:
 * - centerGapExpected = (headerBottom + cardTop) / 2 — punto medio entre header y tarjeta
 * - gapCardNav = 15px exactos (FASE 3)
 * - padding mapa: top = headerBottom, bottom = cardHeight + 15 + navHeight
 */
const HEADER_H = 69; // --header-h en globals.css

/**
 * Mide el layout actual y devuelve padding para Mapbox easeTo/flyTo.
 * @returns {{ top: number, bottom: number, left: number, right: number } | undefined}
 */
export function getMapLayoutPadding() {
  if (typeof document === 'undefined') return undefined;
  const header = document.querySelector('[data-waitme-header]');
  const nav = document.querySelector('[data-waitme-nav]');
  const panel = document.querySelector('[data-map-screen-panel]');
  const headerRect = header?.getBoundingClientRect();
  const navRect = nav?.getBoundingClientRect();
  const panelRect = panel?.getBoundingClientRect();
  const top = headerRect?.bottom ?? HEADER_H;
  const cardHeight = panelRect?.height ?? 200;
  const navHeight = navRect ? window.innerHeight - navRect.top : 80;
  const bottom = cardHeight + 15 + navHeight;
  return { top, bottom, left: 0, right: 0 };
}

/**
 * Mide el layout para validación/debug.
 * En dev, se expone en window.__measureMapLayout para tests.
 * @returns {Object} Medidas en px
 */
export function measureMapLayout() {
  if (typeof document === 'undefined') return null;
  const header = document.querySelector('[data-waitme-header]');
  const nav = document.querySelector('[data-waitme-nav]');
  const panel = document.querySelector('[data-map-screen-panel]');
  const inner = document.querySelector('[data-map-screen-panel-inner]');
  const card = document.querySelector('[data-create-alert-card]');
  const pin = document.querySelector('[data-center-pin]');
  const headerRect = header?.getBoundingClientRect();
  const navRect = nav?.getBoundingClientRect();
  const panelRect = panel?.getBoundingClientRect();
  const innerRect = inner?.getBoundingClientRect();
  const cardRect = card?.getBoundingClientRect();
  const pinRect = pin?.getBoundingClientRect();

  const headerBottom = headerRect?.bottom ?? HEADER_H;
  const cardTop = (innerRect ?? cardRect ?? panelRect)?.top ?? 0;
  const cardBottom = (innerRect ?? cardRect ?? panelRect)?.bottom ?? 0;
  const navTop = navRect?.top ?? window.innerHeight;
  const pinBottomY = pinRect ? pinRect.bottom : null;
  const centerGapExpected = (headerBottom + cardTop) / 2;
  const gapCardNav = navTop - cardBottom;

  return {
    headerBottom,
    cardTop,
    cardBottom,
    navTop,
    pinBottomY,
    centerGapExpected,
    gapCardNav,
    ok: {
      gap: Math.abs(gapCardNav - 15) <= 1,
      pin: pinBottomY != null && Math.abs(pinBottomY - centerGapExpected) <= 2,
    },
  };
}
