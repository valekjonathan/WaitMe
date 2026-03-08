/**
 * Capas GeoJSON del mapa.
 * StaticCarsLayer, UserLocationLayer, WaitMeCarLayer.
 */

import { addStaticCarsLayer, addUserLocationLayer, addWaitMeCarLayer } from '@/lib/mapLayers';
import { updateCarPosition as updateCarPositionImpl } from '@/lib/mapLayers/realtimeCarUtils.js';

const STATIC_CARS_SOURCE = 'waitme-static-cars';

/**
 * Aplica la capa de coches estáticos (alertas).
 * @param {import('geojson').FeatureCollection} [precomputedGeoJSON] - para realtime (mantiene ref)
 */
export function applyStaticCarsLayer(map, alerts, onAlertClick, precomputedGeoJSON) {
  if (!map?.getStyle?.()?.layers) return;
  addStaticCarsLayer(map, alerts, onAlertClick, precomputedGeoJSON);
}

/**
 * Actualiza la posición de un coche sin recrear la capa.
 * Usa setData en el source existente.
 * @param {import('mapbox-gl').Map} map
 * @param {import('geojson').FeatureCollection} currentGeoJSON
 * @param {string|number} id
 * @param {number} lng
 * @param {number} lat
 * @returns {import('geojson').FeatureCollection} nuevo GeoJSON (actualizar ref del caller)
 */
export function updateCarPosition(map, currentGeoJSON, id, lng, lat) {
  return updateCarPositionImpl(map, STATIC_CARS_SOURCE, currentGeoJSON, id, lng, lat);
}

/**
 * Aplica la capa de ubicación del usuario.
 */
export function applyUserLocationLayer(map, userLoc) {
  if (!map?.getStyle?.()?.layers) return;
  addUserLocationLayer(map, userLoc);
}

/**
 * Aplica la capa del coche dinámico WaitMe (comprador).
 */
export function applyWaitMeCarLayer(map, waitMeCarBuyerLocation, waitMeCarMode, waitMeCarColor) {
  if (!map?.getStyle?.()?.layers) return;
  addWaitMeCarLayer(map, waitMeCarBuyerLocation, waitMeCarMode, waitMeCarColor);
}
