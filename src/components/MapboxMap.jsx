import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const OVIEDO_CENTER = [-5.84476, 43.36139];
const DEFAULT_ZOOM = 15;
const DEFAULT_PITCH = 45;

export default function MapboxMap({
  center = OVIEDO_CENTER,
  zoom = DEFAULT_ZOOM,
  pitch = DEFAULT_PITCH,
  bearing = 0,
  className = '',
  style: mapStyle = 'mapbox://styles/mapbox/dark-v11',
  onMapLoad,
  children,
  ...rest
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token || token === 'PEGA_AQUI_EL_TOKEN') {
      setError('VITE_MAPBOX_TOKEN');
      return;
    }
    if (!containerRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: Array.isArray(center) ? center : OVIEDO_CENTER,
      zoom: zoom ?? DEFAULT_ZOOM,
      pitch: pitch ?? DEFAULT_PITCH,
      bearing: bearing ?? 0,
      antialias: true,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-left');

    map.on('load', () => {
      mapRef.current = map;
      onMapLoad?.(map);
    });

    map.on('error', (e) => {
      if (e.error?.message?.includes('token')) setError('VITE_MAPBOX_TOKEN');
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-[#1a1a1a] text-gray-500 text-sm ${className}`}
        style={{ width: '100%', height: '100%' }}
      >
        Configura VITE_MAPBOX_TOKEN en .env
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', minHeight: 200 }}
      {...rest}
    >
      {children}
    </div>
  );
}
