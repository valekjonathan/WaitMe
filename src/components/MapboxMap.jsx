import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const DEFAULT_CENTER = [-5.8494, 43.3619]; // Gijón fallback
const INITIAL_ZOOM = 16;

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 5000,
};

export default function MapboxMap({
  className = '',
  style = 'mapbox://styles/mapbox/navigation-night-v1',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [userPosition, setUserPosition] = useState(null);
  const [error, setError] = useState(null);

  // Geolocalización precisa con watchPosition
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada');
      return;
    }

    const handlePosition = (pos) => {
      const { latitude, longitude } = pos.coords;
      setUserPosition([longitude, latitude]);
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

  // Inicializar mapa
  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return;

    const center = userPosition || DEFAULT_CENTER;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style,
      center,
      zoom: INITIAL_ZOOM,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-left');
    mapRef.current = map;

    return () => {
      if (markerRef.current) markerRef.current.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [MAPBOX_TOKEN, style]);

  // Centrar en usuario y actualizar marcador
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userPosition) {
      map.flyTo({ center: userPosition, zoom: INITIAL_ZOOM });

      // Eliminar marcador anterior
      if (markerRef.current) {
        markerRef.current.remove();
      }

      // Marcador del usuario: punto blanco, borde morado #6D28D9, sombra suave
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
        .setLngLat(userPosition)
        .addTo(map);
    }
  }, [userPosition]);

  if (!MAPBOX_TOKEN) {
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
