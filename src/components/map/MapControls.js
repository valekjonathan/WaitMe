/**
 * Controles del mapa: interactive, padding, estilo de calles.
 */

/**
 * Habilita o deshabilita la interacción del mapa.
 */
export function setInteractive(map, interactive) {
  if (!map) return;
  try {
    if (interactive) {
      map.dragPan?.enable?.();
      map.touchZoomRotate?.enable?.();
      map.scrollZoom?.enable?.();
    } else {
      map.dragPan?.disable?.();
      map.touchZoomRotate?.disable?.();
      map.scrollZoom?.disable?.();
    }
  } catch (e) {
    console.error('[WaitMe Error]', e);
  }
}

/**
 * Establece el padding del mapa.
 */
export function setMapPadding(map, padding) {
  if (!map) return;
  map.setPadding(padding);
}

/**
 * Aplica estilo de calles (brillo/contraste) cuando centerPaddingBottom > 0.
 */
export function applyRoadStyleForCreate(map) {
  if (!map) return;
  const style = map.getStyle();
  if (!style?.layers) return;
  const ROAD_COLOR = '#8b5cf6';
  for (const layer of style.layers) {
    const id = (layer.id || '').toLowerCase();
    if (id.includes('road') && layer.type === 'line') {
      try {
        map.setPaintProperty(layer.id, 'line-color', ROAD_COLOR);
        map.setPaintProperty(layer.id, 'line-opacity', 1);
        const w = map.getPaintProperty(layer.id, 'line-width');
        if (typeof w === 'number') map.setPaintProperty(layer.id, 'line-width', w + 0.5);
      } catch (e) {
        console.error('[WaitMe Error]', e);
      }
    }
  }
}
