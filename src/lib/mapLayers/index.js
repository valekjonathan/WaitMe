/**
 * Capas del mapa — base para arquitectura GeoJSON.
 * StaticCarsLayer, UserLocationLayer listas para migración.
 * MapboxMap sigue con DOM markers; activar cuando se migre.
 *
 * @module mapLayers
 */

export { alertsToGeoJSON, userLocationToFeature } from './geojsonUtils.js';
export { addStaticCarsLayer, addUserLocationLayer } from './layers.js';
