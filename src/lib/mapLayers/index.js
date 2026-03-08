/**
 * Capas del mapa — base para arquitectura GeoJSON.
 * StaticCarsLayer, UserLocationLayer listas para migración.
 * WaitMeCarLayer implementada: coche dinámico (comprador) solo con WAITME_ACTIVE.
 *
 * @module mapLayers
 */

export {
  alertsToGeoJSON,
  userLocationToFeature,
  updateFeaturePositionInGeoJSON,
} from './geojsonUtils.js';
export {
  addStaticCarsLayer,
  addUserLocationLayer,
  addSellerLocationLayer,
  addSelectedPositionLayer,
} from './layers.js';
export { addWaitMeCarLayer } from './waitMeCarLayer.js';
export { updateCarPosition } from './realtimeCarUtils.js';
export { interpolatePosition } from './interpolatePosition.js';
