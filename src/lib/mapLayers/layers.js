/**
 * Capas GeoJSON para Mapbox — arquitectura unificada.
 * Usado por MapboxMap, ParkingMap y SellerLocationTracker.
 *
 * @module mapLayers/layers
 */

import { alertsToGeoJSON, userLocationToFeature } from './geojsonUtils.js';

const STATIC_CARS_SOURCE = 'waitme-static-cars';
const STATIC_CARS_LAYER = 'waitme-static-cars-layer';
const USER_LOCATION_SOURCE = 'waitme-user-location';
const USER_LOCATION_LAYER = 'waitme-user-location-layer';
const SELLER_LOCATION_SOURCE = 'waitme-seller-location';
const SELLER_LOCATION_LAYER = 'waitme-seller-layer';
const SELECTED_POSITION_SOURCE = 'waitme-selected-position';
const SELECTED_POSITION_LAYER = 'waitme-selected-position-layer';

/**
 * Añade o actualiza capa de coches estáticos (GeoJSON).
 * @param {import('mapbox-gl').Map} map
 * @param {Array} alerts
 * @param {(alert: object) => void} [onAlertClick]
 * @param {import('geojson').FeatureCollection} [precomputedGeoJSON] - opcional, para realtime (evita recalcular)
 */
export function addStaticCarsLayer(map, alerts, onAlertClick, precomputedGeoJSON) {
  if (!map?.getStyle?.()) return;
  const geojson = precomputedGeoJSON ?? alertsToGeoJSON(alerts || []);

  if (map.getSource(STATIC_CARS_SOURCE)) {
    map.getSource(STATIC_CARS_SOURCE).setData(geojson);
  } else {
    map.addSource(STATIC_CARS_SOURCE, { type: 'geojson', data: geojson });
    map.addLayer({
      id: STATIC_CARS_LAYER,
      type: 'circle',
      source: STATIC_CARS_SOURCE,
      minzoom: 0,
      paint: {
        'circle-radius': 12,
        'circle-color': ['get', 'fill'],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });
    map.on('mouseenter', STATIC_CARS_LAYER, () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', STATIC_CARS_LAYER, () => {
      map.getCanvas().style.cursor = '';
    });
  }

  if (onAlertClick && map.getLayer(STATIC_CARS_LAYER)) {
    map.off('click', STATIC_CARS_LAYER);
    const handler = (e) => {
      const f = e.features?.[0];
      const id = f?.id ?? f?.properties?.id;
      if (id != null) {
        const alert = (alerts || []).find((a) => (a.id ?? a.user_id) === id);
        if (alert) onAlertClick(alert);
      }
    };
    map.on('click', STATIC_CARS_LAYER, handler);
  }
}

/**
 * Añade o actualiza capa de ubicación del usuario (GeoJSON).
 * @param {import('mapbox-gl').Map} map
 * @param {{lat:number,lng:number}|[number,number]|null} userLoc
 */
export function addUserLocationLayer(map, userLoc) {
  if (!map?.getStyle?.()) return;
  const feature = userLocationToFeature(userLoc);

  if (map.getSource(USER_LOCATION_SOURCE)) {
    map
      .getSource(USER_LOCATION_SOURCE)
      .setData(feature || { type: 'FeatureCollection', features: [] });
  } else if (feature) {
    map.addSource(USER_LOCATION_SOURCE, { type: 'geojson', data: feature });
    map.addLayer({
      id: USER_LOCATION_LAYER,
      type: 'circle',
      source: USER_LOCATION_SOURCE,
      paint: {
        'circle-radius': 10,
        'circle-color': '#a855f7',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });
  }
}

/**
 * Añade o actualiza capa de ubicación del vendedor (GeoJSON).
 * @param {import('mapbox-gl').Map} map
 * @param {{lat:number,lng:number}|[number,number]|null} sellerLoc
 */
export function addSellerLocationLayer(map, sellerLoc) {
  if (!map?.getStyle?.()) return;
  const feature = userLocationToFeature(sellerLoc);
  const geojson = feature
    ? { type: 'FeatureCollection', features: [feature] }
    : { type: 'FeatureCollection', features: [] };

  if (map.getSource(SELLER_LOCATION_SOURCE)) {
    map.getSource(SELLER_LOCATION_SOURCE).setData(geojson);
    return;
  }
  if (feature) {
    map.addSource(SELLER_LOCATION_SOURCE, { type: 'geojson', data: geojson });
    map.addLayer({
      id: SELLER_LOCATION_LAYER,
      type: 'circle',
      source: SELLER_LOCATION_SOURCE,
      paint: {
        'circle-radius': 12,
        'circle-color': '#22c55e',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });
  }
}

/**
 * Añade o actualiza capa de posición seleccionada (pin al elegir ubicación).
 * @param {import('mapbox-gl').Map} map
 * @param {{lat:number,lng:number}|[number,number]|null} pos
 */
export function addSelectedPositionLayer(map, pos) {
  if (!map?.getStyle?.()) return;
  const feature = userLocationToFeature(pos);
  const geojson = feature
    ? { type: 'FeatureCollection', features: [feature] }
    : { type: 'FeatureCollection', features: [] };

  if (map.getSource(SELECTED_POSITION_SOURCE)) {
    map.getSource(SELECTED_POSITION_SOURCE).setData(geojson);
    return;
  }
  if (feature) {
    map.addSource(SELECTED_POSITION_SOURCE, { type: 'geojson', data: geojson });
    map.addLayer({
      id: SELECTED_POSITION_LAYER,
      type: 'circle',
      source: SELECTED_POSITION_SOURCE,
      paint: {
        'circle-radius': 10,
        'circle-color': '#a855f7',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });
  }
}
