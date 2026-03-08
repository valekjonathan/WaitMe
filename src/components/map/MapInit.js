/**
 * Inicialización del mapa Mapbox.
 * Creación, configuración inicial, token, estilo.
 */

export const OVIEDO_CENTER = [-5.8494, 43.3619]; // [lng, lat]
export const DEFAULT_ZOOM = 16.5;
export const DEFAULT_PITCH = 30;
export const DARK_STYLE = 'mapbox://styles/mapbox/dark-v11';
export const ACCURACY_RECENTER_THRESHOLD = 80;

/**
 * Configura el estilo del mapa tras load: desactiva relieve y capas de árboles/parques.
 */
export function setupMapStyleOnLoad(map) {
  try {
    if (map.getTerrain()) map.setTerrain(null);
  } catch (e) {
    console.error('[WaitMe Error]', e);
  }
  const style = map.getStyle();
  if (style?.layers) {
    for (const layer of style.layers) {
      const id = (layer.id || '').toLowerCase();
      if (
        id.includes('tree') ||
        id.includes('park') ||
        id.includes('landcover') ||
        id.includes('land-use')
      ) {
        try {
          map.setLayoutProperty(layer.id, 'visibility', 'none');
        } catch (e) {
          console.error('[WaitMe Error]', e);
        }
      }
    }
  }
}

/**
 * Crea el mapa Mapbox en el container.
 * @param {HTMLDivElement} container
 * @param {Object} options
 * @param {string} options.token
 * @param {boolean} options.interactive
 * @returns {Promise<import('mapbox-gl').Map>}
 */
export async function createMap(container, { token, interactive = true }) {
  const mapboxgl = (await import('mapbox-gl')).default;
  await import('mapbox-gl/dist/mapbox-gl.css');
  mapboxgl.accessToken = token;

  const map = new mapboxgl.Map({
    container,
    style: DARK_STYLE,
    center: OVIEDO_CENTER,
    zoom: DEFAULT_ZOOM,
    pitch: DEFAULT_PITCH,
    bearing: 0,
    antialias: true,
    attributionControl: false,
    dragPan: interactive,
    touchZoomRotate: interactive,
    scrollZoom: interactive,
  });

  return map;
}
