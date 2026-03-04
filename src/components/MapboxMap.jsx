import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/lib/supabaseClient';
import { useMapMatch } from '@/hooks/useMapMatch';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const DEFAULT_CENTER = [-5.8494, 43.3619]; // Gijón fallback
const INITIAL_ZOOM = 16;
const TRACKING_ZOOM = 17;
const FLY_SPEED = 0.8;
const LERP_FACTOR = 0.12;

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 5000,
};

/** Convierte alertas a GeoJSON FeatureCollection */
function alertsToGeoJSON(alerts) {
  const features = (alerts || [])
    .filter((a) => a?.lat != null && a?.lng != null && a?.status === 'active')
    .map((a) => ({
      type: 'Feature',
      id: a.id,
      geometry: { type: 'Point', coordinates: [Number(a.lng), Number(a.lat)] },
      properties: { id: a.id, price: a.price, vehicle_type: a.vehicle_type },
    }));
  return { type: 'FeatureCollection', features };
}

/** Convierte metros a píxeles de radio en Mapbox según zoom y latitud */
function metersToCircleRadiusPixels(meters, zoom, lat) {
  const metersPerPixel =
    (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
  return Math.max(8, meters / metersPerPixel);
}

export default function MapboxMap({
  className = '',
  style = 'mapbox://styles/mapbox/navigation-night-v1',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [userPosition, setUserPosition] = useState(null);
  const [error, setError] = useState(null);
  const displayPosRef = useRef(null);
  const animationRef = useRef(null);
  const [alerts, setAlerts] = useState([]);
  const { addPoint, corrected } = useMapMatch(!!MAPBOX_TOKEN);

  // Cargar alertas activas desde Supabase + Realtime
  useEffect(() => {
    const loadAlerts = async () => {
      const { data } = await supabase
        .from('parking_alerts')
        .select('id, lat, lng, price, vehicle_type, status')
        .eq('status', 'active');
      setAlerts(data ?? []);
    };
    loadAlerts();

    const channel = supabase
      .channel('parking_alerts_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parking_alerts' }, () => {
        loadAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Geolocalización precisa con watchPosition (incluye accuracy)
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada');
      return;
    }

    const handlePosition = (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      const acc = accuracy ?? 20;
      setUserPosition({ lng: longitude, lat: latitude, accuracy: acc });
      addPoint(latitude, longitude, acc);
      setError(null);
    };

    const handleError = (err) => {
      setError(err.message || 'Error obteniendo ubicación');
    };

    const watchId = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      GEOLOCATION_OPTIONS
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Inicializar mapa y capa parking_alerts_layer
  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return;

    const center = userPosition
      ? [userPosition.lng, userPosition.lat]
      : DEFAULT_CENTER;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style,
      center,
      zoom: INITIAL_ZOOM,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-left');

    map.on('load', () => {
      map.addSource('parking_alerts_source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'parking_alerts_layer',
        type: 'circle',
        source: 'parking_alerts_source',
        paint: {
          'circle-radius': 8,
          'circle-color': '#6D28D9',
          'circle-opacity': 0.8,
        },
      });
    });

    mapRef.current = map;

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (markerRef.current) markerRef.current.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [MAPBOX_TOKEN, style]);

  const effectivePosition = corrected ?? userPosition;

  // Seguimiento automático: flyTo al recibir nueva posición
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !effectivePosition) return;

    const center = [effectivePosition.lng, effectivePosition.lat];
    map.flyTo({
      center,
      zoom: TRACKING_ZOOM,
      speed: FLY_SPEED,
      essential: true,
    });
  }, [effectivePosition]);

  // Interpolación suave del marcador y actualización de círculo de precisión
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !effectivePosition) return;

    const target = [effectivePosition.lng, effectivePosition.lat];
    if (!displayPosRef.current) displayPosRef.current = [...target];

    const updateMarkerAndCircle = () => {
      const display = displayPosRef.current;
      if (!display) return;

      const [lng, lat] = display;
      const [tLng, tLat] = target;

      const dlng = tLng - lng;
      const dlat = tLat - lat;
      const dist = Math.sqrt(dlng * dlng + dlat * dlat);

      if (dist < 1e-7) {
        displayPosRef.current = [...target];
      } else {
        displayPosRef.current = [
          lng + dlng * LERP_FACTOR,
          lat + dlat * LERP_FACTOR,
        ];
      }

      if (markerRef.current) {
        markerRef.current.setLngLat(displayPosRef.current);
      }

      // Actualizar círculo de precisión GPS
      const accSource = map.getSource('user_accuracy_source');
      if (accSource) {
        accSource.setData({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: displayPosRef.current,
          },
          properties: { accuracy: effectivePosition.accuracy ?? userPosition?.accuracy ?? 20 },
        });
      }
      if (map.getLayer('user_accuracy_layer')) {
        const accuracy = effectivePosition.accuracy ?? userPosition?.accuracy ?? 20;
        const zoom = map.getZoom();
        const radiusPx = metersToCircleRadiusPixels(accuracy, zoom, display[1]);
        const fillColor =
          accuracy > 15 ? 'rgba(107, 114, 128, 0.25)' : 'rgba(109, 40, 217, 0.2)';
        map.setPaintProperty('user_accuracy_layer', 'circle-radius', radiusPx);
        map.setPaintProperty('user_accuracy_layer', 'circle-color', fillColor);
      }

      if (dist >= 1e-7) {
        animationRef.current = requestAnimationFrame(updateMarkerAndCircle);
      }
    };

    // Crear marcador si no existe
    if (!markerRef.current) {
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      el.style.cssText = `
        width: 20px;
        height: 20px;
        background: #ffffff;
        border: 3px solid #6D28D9;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
      `;
      markerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat(displayPosRef.current)
        .addTo(map);
    }

    // Añadir círculo de precisión cuando el mapa esté cargado
    const setupAccuracyCircle = () => {
      if (map.getLayer('user_accuracy_layer')) return;

      const coords = displayPosRef.current;
      const accuracy = effectivePosition?.accuracy ?? userPosition?.accuracy ?? 20;
      const zoom = map.getZoom();
      const radiusPx = metersToCircleRadiusPixels(accuracy, zoom, coords[1]);
      const fillColor =
        accuracy > 15 ? 'rgba(107, 114, 128, 0.25)' : 'rgba(109, 40, 217, 0.2)';

      map.addSource('user_accuracy_source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: coords },
          properties: { accuracy },
        },
      });
      map.addLayer(
        {
          id: 'user_accuracy_layer',
          type: 'circle',
          source: 'user_accuracy_source',
          paint: {
            'circle-radius': radiusPx,
            'circle-color': fillColor,
            'circle-stroke-width': 0,
          },
        },
        'parking_alerts_layer'
      );
    };

    if (map.isStyleLoaded()) {
      setupAccuracyCircle();
    } else {
      map.once('load', setupAccuracyCircle);
    }

    animationRef.current = requestAnimationFrame(updateMarkerAndCircle);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [effectivePosition, userPosition]);

  // Actualizar GeoJSON de alertas en el mapa
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource?.('parking_alerts_source')) return;
    const source = map.getSource('parking_alerts_source');
    if (source) source.setData(alertsToGeoJSON(alerts));
  }, [alerts]);

  if (!MAPBOX_TOKEN) {
    console.warn('Mapbox token missing');
    return (
      <div className={`flex items-center justify-center bg-gray-900 text-amber-500 ${className}`}>
        <p>Configura VITE_MAPBOX_TOKEN en .env</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      {error && (
        <div className="absolute bottom-2 left-2 right-2 bg-amber-900/80 text-amber-200 text-sm px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
