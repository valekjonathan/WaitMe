import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useMapMatch } from '@/hooks/useMapMatch';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
const DEFAULT_CENTER = [-5.8494, 43.3619];
const INITIAL_ZOOM = 16;
const TRACKING_ZOOM = 17;
const FLY_SPEED = 0.8;
const LERP_FACTOR = 0.12;
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 5000,
};

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

function metersToCircleRadiusPixels(meters, zoom, lat) {
  const metersPerPixel =
    (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
  return Math.max(8, meters / metersPerPixel);
}

function MapboxMapInner({ className = '', style = MAP_STYLE }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapboxglRef = useRef(null);
  const markerRef = useRef(null);
  const initRef = useRef(false);
  const [userPosition, setUserPosition] = useState(null);
  const [error, setError] = useState(null);
  const displayPosRef = useRef(null);
  const animationRef = useRef(null);
  const [alerts, setAlerts] = useState([]);
  const [mapError, setMapError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const { addPoint, corrected } = useMapMatch(!!MAPBOX_TOKEN);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const { data } = await supabase
          .from('parking_alerts')
          .select('id, lat, lng, price, vehicle_type, status')
          .eq('status', 'active');
        setAlerts(data ?? []);
      } catch {
        setAlerts([]);
      }
    };
    loadAlerts();
    const channel = supabase
      .channel('parking_alerts_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parking_alerts' }, loadAlerts)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

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
    const handleError = (err) => setError(err.message || 'Error obteniendo ubicación');
    const watchId = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      GEOLOCATION_OPTIONS
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [addPoint]);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current || initRef.current) return;
    initRef.current = true;
    setMapError(null);

    let map = null;
    let cancelled = false;

    const init = async () => {
      try {
        await import('mapbox-gl/dist/mapbox-gl.css');
        const mapboxglModule = await import('mapbox-gl').catch(() => null);

        if (cancelled) return;
        const mapboxgl = mapboxglModule?.default ?? null;
        if (!mapboxgl) {
          setMapError('Mapbox no disponible');
          return;
        }

        mapboxgl.accessToken = MAPBOX_TOKEN;
        const center = userPosition
          ? [userPosition.lng, userPosition.lat]
          : DEFAULT_CENTER;

        map = new mapboxgl.Map({
          container: containerRef.current,
          style,
          center,
          zoom: INITIAL_ZOOM,
        });

        if (cancelled) {
          map.remove();
          return;
        }

        map.on('error', () => setMapError('Error cargando mapa'));

        map.addControl(new mapboxgl.NavigationControl(), 'top-left');

        map.on('load', () => {
          if (cancelled) return;
          try {
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
          } catch {
            setMapError('Error cargando mapa');
          }
          setMapReady(true);
        });

        mapRef.current = map;
        mapboxglRef.current = mapboxgl;
      } catch (err) {
        if (!cancelled) {
          console.error('[MapboxMap] init', err);
          setMapError('Error cargando mapa');
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      initRef.current = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (map) {
        map.remove();
      }
      mapRef.current = null;
      mapboxglRef.current = null;
      setMapReady(false);
    };
  }, [MAPBOX_TOKEN, style]);

  const effectivePosition = corrected ?? userPosition;

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !effectivePosition) return;
    map.flyTo({
      center: [effectivePosition.lng, effectivePosition.lat],
      zoom: TRACKING_ZOOM,
      speed: FLY_SPEED,
      essential: true,
    });
  }, [effectivePosition]);

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

      const accSource = map.getSource('user_accuracy_source');
      if (accSource) {
        accSource.setData({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: displayPosRef.current },
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

    if (!markerRef.current) {
      const mapboxgl = mapboxglRef.current;
      if (!mapboxgl) return;
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      el.style.cssText = `
        width: 20px; height: 20px;
        background: #ffffff;
        border: 3px solid #6D28D9;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
      `;
      markerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat(displayPosRef.current)
        .addTo(map);
    }

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

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource?.('parking_alerts_source')) return;
    const source = map.getSource('parking_alerts_source');
    if (source) source.setData(alertsToGeoJSON(alerts));
  }, [alerts]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-900 text-amber-500 ${className}`}
        style={{ minHeight: 120 }}
      >
        <p className="text-sm">Configura VITE_MAPBOX_TOKEN en .env</p>
      </div>
    );
  }

  if (mapError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-900 text-amber-500 ${className}`}
        style={{ minHeight: 120 }}
      >
        <p className="text-sm">{mapError}</p>
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

function MapPlaceholder({ msg }) {
  return (
    <div
      className="flex items-center justify-center bg-gray-900 text-amber-500"
      style={{ minHeight: 120 }}
    >
      <p className="text-sm">{msg}</p>
    </div>
  );
}

export default function MapboxMap(props) {
  try {
    return (
      <MapboxErrorBoundary fallback={<MapPlaceholder msg="Mapa no disponible" />}>
        <MapboxMapInner {...props} />
      </MapboxErrorBoundary>
    );
  } catch (e) {
    return <MapPlaceholder msg={`Mapbox: ${String(e?.message || e)}`} />;
  }
}

class MapboxErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(e) {
    return { error: e };
  }
  render() {
    if (this.state.error) return this.props.fallback;
    return this.props.children;
  }
}
