/**
 * Utilidades GeoJSON para capas del mapa.
 * Base para migración futura de DOM markers a GeoJSON source/layers.
 *
 * @module mapLayers/geojsonUtils
 */

/**
 * Convierte alertas a GeoJSON FeatureCollection para coches estáticos.
 * @param {Array<{id?:string, latitude?:number, lat?:number, longitude?:number, lng?:number, vehicle_type?:string, vehicle_color?:string, color?:string, price?:number}>} alerts
 * @returns {import('geojson').FeatureCollection}
 */
export function alertsToGeoJSON(alerts) {
  const features = (alerts || [])
    .filter((a) => a != null)
    .map((a) => {
      const lat = a.latitude ?? a.lat;
      const lng = a.longitude ?? a.lng;
      if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        type: 'Feature',
        id: a.id ?? a.user_id ?? `alert-${lat}-${lng}`,
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: {
          id: a.id ?? a.user_id,
          vehicle_type: a.vehicle_type ?? 'car',
          color: a.vehicle_color ?? a.color ?? 'gray',
          price: a.price ?? 0,
        },
      };
    })
    .filter(Boolean);
  return { type: 'FeatureCollection', features };
}

/**
 * Crea Feature para ubicación del usuario.
 * @param {{lat:number, lng:number}|[number,number]|null} loc
 * @returns {import('geojson').Feature|null}
 */
export function userLocationToFeature(loc) {
  if (!loc) return null;
  const lat = Array.isArray(loc) ? loc[0] : (loc?.lat ?? loc?.latitude);
  const lng = Array.isArray(loc) ? loc[1] : (loc?.lng ?? loc?.longitude);
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: {},
  };
}
