/**
 * Utilidades para movimiento realtime de coches (tipo Uber).
 * Actualiza posiciones vía setData sin recrear layers.
 *
 * @module mapLayers/realtimeCarUtils
 */

import { updateFeaturePositionInGeoJSON } from './geojsonUtils.js';

const STATIC_CARS_SOURCE = 'waitme-static-cars';

/**
 * Actualiza la posición de un coche en el source GeoJSON.
 * Usa setData sin recrear la capa.
 *
 * @param {import('mapbox-gl').Map} map
 * @param {string} sourceId - id del source (default: waitme-static-cars)
 * @param {import('geojson').FeatureCollection} currentGeoJSON - GeoJSON actual del source
 * @param {string|number} id - id del feature (alert id, user_id)
 * @param {number} lng
 * @param {number} lat
 * @returns {import('geojson').FeatureCollection} nuevo GeoJSON (para que el caller actualice su estado)
 */
export function updateCarPosition(map, sourceId, currentGeoJSON, id, lng, lat) {
  if (!map?.getSource) return currentGeoJSON;
  const sid = sourceId || STATIC_CARS_SOURCE;
  const source = map.getSource(sid);
  if (!source?.setData) return currentGeoJSON;

  const nextGeoJSON = updateFeaturePositionInGeoJSON(currentGeoJSON, id, lng, lat);
  source.setData(nextGeoJSON);
  return nextGeoJSON;
}
