/**
 * WaitMeCarLayer — capa para el coche dinámico (comprador navegando).
 *
 * DECISIÓN TÉCNICA (B): Preparada y aislada para el siguiente paso.
 * No implementada porque:
 * - El flujo actual usa SellerLocationTracker con su propio mapa y DOM markers
 * - Integrar requeriría unificar MapboxMap + SellerLocationTracker
 * - Solo 1 coche dinámico, solo con WAITME_ACTIVE, solo en "Estoy aparcado aquí"
 *
 * Cuando se implemente:
 * - Usar source/layer GeoJSON limpio (sin DOM markers)
 * - Solo visible cuando carsMovementMode === WAITME_ACTIVE
 * - Datos de buyerLocations desde userLocations.getLocationsByAlert
 *
 * @module mapLayers/waitMeCarLayer
 */

const WAITME_CAR_SOURCE = 'waitme-car-dynamic';
const WAITME_CAR_LAYER = 'waitme-car-dynamic-layer';

/**
 * Añade o actualiza capa del coche dinámico (comprador en ruta).
 * Por ahora no-op: preparada para implementación futura.
 *
 * @param {import('mapbox-gl').Map} map
 * @param {Array<{ latitude: number, longitude: number }>} buyerLocations
 * @param {string} carsMode - CARS_MOVEMENT_MODE
 */
export function addWaitMeCarLayer(map, buyerLocations, carsMode) {
  if (!map?.getStyle?.()) return;
  // Solo con WAITME_ACTIVE; por ahora no implementado
  if (carsMode !== 'WAITME_ACTIVE' || !buyerLocations?.length) {
    if (map.getSource(WAITME_CAR_SOURCE)) {
      map.getSource(WAITME_CAR_SOURCE).setData({ type: 'FeatureCollection', features: [] });
    }
    return;
  }
  // TODO: crear GeoJSON, addSource, addLayer cuando se migre SellerLocationTracker
}
