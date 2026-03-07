/**
 * WaitMeCarLayer — capa GeoJSON para el coche dinámico (comprador navegando).
 * Solo visible cuando WAITME_ACTIVE y hay buyerLocation.
 * 1 source, 1 layer, 1 feature máximo.
 *
 * @module mapLayers/waitMeCarLayer
 */

import { getCarFill } from '@/utils/carUtils';

const WAITME_CAR_SOURCE = 'waitme-car-source';
const WAITME_CAR_LAYER = 'waitme-car-layer';

const EMPTY_GEOJSON = { type: 'FeatureCollection', features: [] };

/**
 * Crea feature GeoJSON para el coche dinámico.
 * @param {{ lat: number, lng: number } | [number, number]} loc
 * @param {string} [color] - color del coche (ej. "azul", "gris")
 * @returns {import('geojson').Feature|null}
 */
function buyerLocationToFeature(loc, color = 'azul') {
  if (!loc) return null;
  const lat = Array.isArray(loc) ? loc[0] : (loc?.lat ?? loc?.latitude);
  const lng = Array.isArray(loc) ? loc[1] : (loc?.lng ?? loc?.longitude);
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const fill = getCarFill(color);
  return {
    type: 'Feature',
    id: 'waitme-car-dynamic',
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: {
      type: 'waitme_car',
      color: fill,
      lat,
      lng,
    },
  };
}

/**
 * Añade o actualiza capa del coche dinámico.
 * Solo con WAITME_ACTIVE y buyerLocation válida.
 *
 * @param {import('mapbox-gl').Map} map
 * @param {{ lat: number, lng: number } | [number, number] | null} buyerLocation - posición del comprador (1 solo)
 * @param {string} carsMode - CARS_MOVEMENT_MODE
 * @param {string} [carColor] - color del coche del comprador
 */
export function addWaitMeCarLayer(map, buyerLocation, carsMode, carColor = 'azul') {
  if (!map?.getStyle?.()) return;

  const showLayer =
    carsMode === 'WAITME_ACTIVE' &&
    buyerLocation != null &&
    (Array.isArray(buyerLocation)
      ? buyerLocation.length >= 2
      : (buyerLocation?.lat ?? buyerLocation?.latitude) != null &&
        (buyerLocation?.lng ?? buyerLocation?.longitude) != null);

  const feature = showLayer ? buyerLocationToFeature(buyerLocation, carColor) : null;
  const geojson = feature ? { type: 'FeatureCollection', features: [feature] } : EMPTY_GEOJSON;

  if (map.getSource(WAITME_CAR_SOURCE)) {
    map.getSource(WAITME_CAR_SOURCE).setData(geojson);
    return;
  }

  map.addSource(WAITME_CAR_SOURCE, { type: 'geojson', data: geojson });
  map.addLayer({
    id: WAITME_CAR_LAYER,
    type: 'circle',
    source: WAITME_CAR_SOURCE,
    minzoom: 0,
    paint: {
      'circle-radius': 12,
      'circle-color': ['get', 'color'],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff',
    },
  });
}
