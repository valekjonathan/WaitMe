/**
 * Listeners de mapa: move, moveend.
 */

/**
 * Adjunta listeners de move y moveend al mapa.
 * @param {import('mapbox-gl').Map} map
 * @param {{ onMove?: (center: [number, number]) => void; onMoveEnd?: (payload: Object) => void }} callbacks
 * @returns {() => void} cleanup
 */
export function attachMoveListeners(map, { onMove, onMoveEnd }) {
  const onMoveHandler = () => {
    const c = map.getCenter();
    onMove?.([c.lat, c.lng]);
  };
  const onMoveEndHandler = () => {
    const c = map.getCenter();
    const b = map.getBounds?.();
    const zoom = map.getZoom?.();
    const payload = {
      center: [c.lat, c.lng],
      bounds: b
        ? {
            swLat: b.getSouth(),
            swLng: b.getWest(),
            neLat: b.getNorth(),
            neLng: b.getEast(),
          }
        : null,
      zoom: typeof zoom === 'number' ? zoom : null,
    };
    onMoveEnd?.(payload);
  };
  map.on('move', onMoveHandler);
  map.on('moveend', onMoveEndHandler);
  return () => {
    map.off('move', onMoveHandler);
    map.off('moveend', onMoveEndHandler);
  };
}
