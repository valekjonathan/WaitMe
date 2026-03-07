/**
 * Capas del mapa — base para arquitectura GeoJSON.
 * StaticCarsLayer, UserLocationLayer listas para migración.
 * WaitMeCarLayer preparada (no implementada) para coche dinámico WAITME_ACTIVE.
 *
 * @module mapLayers
 */

export { alertsToGeoJSON, userLocationToFeature } from './geojsonUtils.js';
export { addStaticCarsLayer, addUserLocationLayer } from './layers.js';
export { addWaitMeCarLayer } from './waitMeCarLayer.js';
