import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

const OVIEDO_CENTER = [-5.8494, 43.3619]; // [lng, lat] for Mapbox
const DEFAULT_ZOOM = 14;
const DEFAULT_PITCH = 30;
const DARK_STYLE = 'mapbox://styles/mapbox/dark-v11';

// Car colors for markers (matches app palette)
const CAR_COLORS = [
  '#FFFFFF', '#1a1a1a', '#6b7280', '#ef4444', '#3b82f6', '#22c55e',
  '#eab308', '#f97316', '#a855f7', '#92400e'
];

/**
 * Generate random car positions within 2km of Oviedo.
 * Uses seeded random for stable positions across re-renders.
 */
function generateSimulatedCars(count = 12) {
  const centerLat = 43.3619;
  const centerLng = -5.8494;
  const kmPerDegLat = 111;
  const kmPerDegLng = 111 * Math.cos((centerLat * Math.PI) / 180);

  const cars = [];
  let seed = 42;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 0; i < count; i++) {
    const radiusKm = 2 * Math.sqrt(random());
    const angle = 2 * Math.PI * random();
    const dLat = (radiusKm * Math.cos(angle)) / kmPerDegLat;
    const dLng = (radiusKm * Math.sin(angle)) / kmPerDegLng;
    cars.push({
      id: `sim_${i}`,
      lng: centerLng + dLng,
      lat: centerLat + dLat,
      color: CAR_COLORS[Math.floor(random() * CAR_COLORS.length)],
    });
  }
  return cars;
}

function createCarMarkerHtml(color) {
  return `
    <div style="width:28px;height:18px;display:flex;align-items:center;justify-content:center;">
      <svg width="28" height="18" viewBox="0 0 48 24" fill="none" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5))">
        <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill="${color}" stroke="rgba(255,255,255,0.6)" stroke-width="1"/>
        <path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.25)" stroke-width="0.5"/>
        <circle cx="14" cy="18" r="3" fill="#333"/>
        <circle cx="36" cy="18" r="3" fill="#333"/>
      </svg>
    </div>
  `;
}

export default function MapboxMap({
  center = OVIEDO_CENTER,
  zoom = DEFAULT_ZOOM,
  pitch = DEFAULT_PITCH,
  bearing = 0,
  className = '',
  style: mapStyle = DARK_STYLE,
  showSimulatedCars = true,
  simulatedCarCount = 12,
  onMapLoad,
  onRecenterRef,
  children,
  ...rest
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapboxglRef = useRef(null);
  const markersRef = useRef([]);
  const [error, setError] = useState(null);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);

  const simulatedCars = useMemo(
    () => (showSimulatedCars ? generateSimulatedCars(simulatedCarCount) : []),
    [showSimulatedCars, simulatedCarCount]
  );

  const flyToCenter = useCallback(() => {
    const map = mapRef.current;
    if (!map?.flyTo) return;
    map.flyTo({
      center: Array.isArray(center) ? center : OVIEDO_CENTER,
      zoom: zoom ?? DEFAULT_ZOOM,
      pitch: pitch ?? DEFAULT_PITCH,
      bearing: bearing ?? 0,
      duration: 800,
      essential: true,
    });
  }, [center, zoom, pitch, bearing]);

  useEffect(() => {
    if (onRecenterRef) onRecenterRef.current = flyToCenter;
    return () => {
      if (onRecenterRef) onRecenterRef.current = null;
    };
  }, [onRecenterRef, flyToCenter]);

  useEffect(() => {
    const handler = () => flyToCenter();
    window.addEventListener('waitme:goLogo', handler);
    return () => window.removeEventListener('waitme:goLogo', handler);
  }, [flyToCenter]);

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token || String(token).trim() === '' || token === 'PEGA_AQUI_EL_TOKEN') {
      setError('no_token');
      return;
    }
    if (!containerRef.current) return;

    let map = null;
    let cancelled = false;

    import('mapbox-gl')
      .then((mod) => {
        if (cancelled || !containerRef.current) return;
        const mapboxgl = mod.default;
        mapboxglRef.current = mapboxgl;
        import('mapbox-gl/dist/mapbox-gl.css');
        mapboxgl.accessToken = token;
        map = new mapboxgl.Map({
          container: containerRef.current,
          style: mapStyle,
          center: Array.isArray(center) ? center : OVIEDO_CENTER,
          zoom: zoom ?? DEFAULT_ZOOM,
          pitch: pitch ?? DEFAULT_PITCH,
          bearing: bearing ?? 0,
          antialias: true,
          attributionControl: false,
        });

        map.on('load', () => {
          if (cancelled) return;
          mapRef.current = map;
          setMapboxLoaded(true);
          onMapLoad?.(map);
        });

        map.on('error', (e) => {
          if (e.error?.message?.includes('token')) setError('no_token');
        });
      })
      .catch(() => setError('no_token'));

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => {
        try { m?.remove?.(); } catch {}
      });
      markersRef.current = [];
      if (map) {
        try { map.remove(); } catch {}
      }
      mapRef.current = null;
      mapboxglRef.current = null;
      setMapboxLoaded(false);
    };
  }, []);

  useEffect(() => {
    if (!mapboxLoaded || !mapRef.current || !mapboxglRef.current || error) return;
    const map = mapRef.current;
    const mapboxgl = mapboxglRef.current;

    markersRef.current.forEach((m) => {
      try { m?.remove?.(); } catch {}
    });
    markersRef.current = [];

    simulatedCars.forEach((car) => {
      const el = document.createElement('div');
      el.innerHTML = createCarMarkerHtml(car.color);
      el.className = 'mapbox-marker';
      const marker = new mapboxgl.Marker({ element: el.firstElementChild || el })
        .setLngLat([car.lng, car.lat])
        .addTo(map);
      markersRef.current.push(marker);
    });
  }, [mapboxLoaded, simulatedCars, error]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-[#0B0B0F] text-gray-500 text-sm ${className}`}
        style={{ width: '100%', height: '100%' }}
      >
        Mapa no disponible
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
