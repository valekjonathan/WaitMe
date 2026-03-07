/**
 * Capas GeoJSON para Mapbox — base para migración de DOM markers.
 * No se usan aún; MapboxMap sigue con markers. Listas para activar cuando se migre.
 *
 * @module mapLayers/layers
 */

import { alertsToGeoJSON, userLocationToFeature } from './geojsonUtils.js';

const STATIC_CARS_SOURCE = 'waitme-static-cars';
const STATIC_CARS_LAYER = 'waitme-static-cars-layer';
const USER_LOCATION_SOURCE = 'waitme-user-location';
const USER_LOCATION_LAYER = 'waitme-user-location-layer';

/**
 * Añade o actualiza capa de coches estáticos (GeoJSON).
 * @param {import('mapbox-gl').Map} map
 * @param {Array} alerts
 * @param {(alert: object) => void} [onAlertClick]
 */
export function addStaticCarsLayer(map, alerts, onAlertClick) {
  if (!map?.getStyle?.()) return;
  const geojson = alertsToGeoJSON(alerts || []);

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
        'circle-color': [
          'match',
          ['get', 'color'],
          'white',
          '#fff',
          'black',
          '#1a1a1a',
          'blue',
          '#3b82f6',
          'red',
          '#ef4444',
          'green',
          '#22c55e',
          'purple',
          '#a855f7',
          'orange',
          '#f97316',
          'gris',
          '#6b7280',
          'gray',
          '#6b7280',
          '#6b7280',
        ],
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
