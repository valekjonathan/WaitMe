import { useEffect, useRef, useState, useCallback } from 'react';

const FALLBACK_CENTER = [-5.8494, 43.3619]; // [lng, lat] Oviedo
const DEFAULT_ZOOM = 15;
const DEFAULT_PITCH = 30;
const DARK_STYLE = 'mapbox://styles/mapbox/dark-v11';
const RADIUS_METERS = 1500;
const CAR_COUNT = 15;
const REFRESH_INTERVAL_MS = 40_000;

const CAR_COLORS = [
  '#FFFFFF', '#1a1a1a', '#6b7280', '#ef4444', '#3b82f6', '#22c55e',
  '#eab308', '#f97316', '#a855f7', '#92400e'
];

const TIPOS = ['normal', 'suv', 'van'];

/**
 * Generate one simulated car within radiusMeters of center.
 */
function generateOneCar(centerLat, centerLng, radiusMeters, id) {
  const kmPerDegLat = 111_000;
  const kmPerDegLng = 111_000 * Math.cos((centerLat * Math.PI) / 180);
  const radiusKm = (radiusMeters / 1000) * Math.sqrt(Math.random());
  const angle = 2 * Math.PI * Math.random();
  const dLat = (radiusKm * 1000 * Math.cos(angle)) / kmPerDegLat;
  const dLng = (radiusKm * 1000 * Math.sin(angle)) / kmPerDegLng;
  const tipo = TIPOS[Math.floor(Math.random() * TIPOS.length)];
  const precio = 3 + Math.floor(Math.random() * 5);
  const tiempoDisponible = 5 + Math.floor(Math.random() * 16);
  const color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
  return {
    id: id || `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    tipo,
    precio,
    tiempo_disponible: tiempoDisponible,
    lat: centerLat + dLat,
    lng: centerLng + dLng,
    color,
  };
}

/**
 * Generate 15 cars within 1.5km of user.
 */
function generateCars(centerLat, centerLng) {
  const cars = [];
  for (let i = 0; i < CAR_COUNT; i++) {
    cars.push(generateOneCar(centerLat, centerLng, RADIUS_METERS, `sim_${i}`));
  }
  return cars;
}

function createCarMarkerHtml(car) {
  const { tipo, precio, color } = car;
  const stroke = 'rgba(255,255,255,0.6)';
  let path = '';
  if (tipo === 'van') {
    path = `<path d="M6 10 L6 22 L40 22 L40 12 L36 10 Z" fill="${color}" stroke="${stroke}" stroke-width="1"/><circle cx="12" cy="22" r="2.5" fill="#333"/><circle cx="32" cy="22" r="2.5" fill="#333"/>`;
  } else if (tipo === 'suv') {
    path = `<path d="M8 14 L10 8 L16 6 L30 6 L36 8 L40 12 L40 20 L8 20 Z" fill="${color}" stroke="${stroke}" stroke-width="1"/><path d="M16 7 L18 10 L28 10 L30 7 Z" fill="rgba(255,255,255,0.2)"/><circle cx="14" cy="20" r="3" fill="#333"/><circle cx="34" cy="20" r="3" fill="#333"/>`;
  } else {
    path = `<path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill="${color}" stroke="${stroke}" stroke-width="1"/><path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.2)"/><circle cx="14" cy="18" r="3" fill="#333"/><circle cx="36" cy="18" r="3" fill="#333"/>`;
  }
  return `
    <div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;position:relative;">
      <svg width="28" height="28" viewBox="0 0 48 28" fill="none" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5))">
        ${path}
        <text x="24" y="26" text-anchor="middle" fill="white" font-size="6" font-weight="bold">${precio}€</text>
      </svg>
    </div>
  `;
}

function createUserMarkerHtml() {
  return `
    <div style="position:relative;width:24px;height:48px;display:flex;align-items:flex-end;justify-content:center;">
      <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:2px;height:28px;background:#a855f7;"></div>
      <div style="position:absolute;bottom:24px;left:50%;transform:translateX(-50%);width:16px;height:16px;background:#a855f7;border-radius:50%;box-shadow:0 0 12px rgba(168,85,247,0.9);border:2px solid white;"></div>
    </div>
  `;
}

export default function MapboxMap({
  userLocation,
  className = '',
  onMapLoad,
  onRecenterRef,
  children,
  ...rest
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapboxglRef = useRef(null);
  const userMarkerRef = useRef(null);
  const carMarkersRef = useRef([]);
  const carsDataRef = useRef([]);
  const refreshTimerRef = useRef(null);
  const centerRef = useRef(FALLBACK_CENTER);
  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  const getCenter = useCallback(() => {
    if (!userLocation) return FALLBACK_CENTER;
    const lat = Array.isArray(userLocation) ? userLocation[0] : userLocation?.latitude ?? userLocation?.lat;
    const lng = Array.isArray(userLocation) ? userLocation[1] : userLocation?.longitude ?? userLocation?.lng;
    if (typeof lat === 'number' && typeof lng === 'number') return [lng, lat];
    return FALLBACK_CENTER;
  }, [userLocation]);

  const flyToUser = useCallback(() => {
    const map = mapRef.current;
    if (!map?.flyTo) return;
    map.flyTo({
      center: getCenter(),
      zoom: DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH,
      duration: 800,
      essential: true,
    });
  }, [getCenter]);

  useEffect(() => {
    if (onRecenterRef) onRecenterRef.current = flyToUser;
    return () => {
      if (onRecenterRef) onRecenterRef.current = null;
    };
  }, [onRecenterRef, flyToUser]);

  useEffect(() => {
    const handler = () => flyToUser();
    window.addEventListener('waitme:goLogo', handler);
    return () => window.removeEventListener('waitme:goLogo', handler);
  }, [flyToUser]);

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
          style: DARK_STYLE,
          center: FALLBACK_CENTER,
          zoom: DEFAULT_ZOOM,
          pitch: DEFAULT_PITCH,
          bearing: 0,
          antialias: true,
          attributionControl: false,
        });

        map.on('load', () => {
          if (cancelled) return;
          mapRef.current = map;
          setMapReady(true);
          onMapLoad?.(map);
        });

        map.on('error', (e) => {
          if (e.error?.message?.includes('token')) setError('no_token');
        });
      })
      .catch(() => setError('no_token'));

    return () => {
      cancelled = true;
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      carMarkersRef.current.forEach((m) => { try { m?.remove?.(); } catch {} });
      carMarkersRef.current = [];
      if (userMarkerRef.current) { try { userMarkerRef.current.remove(); } catch {} }
      userMarkerRef.current = null;
      if (map) { try { map.remove(); } catch {} }
      mapRef.current = null;
      mapboxglRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapboxglRef.current || error) return;
    const map = mapRef.current;
    const mapboxgl = mapboxglRef.current;
    const [lng, lat] = getCenter();
    centerRef.current = [lng, lat];

    if (userMarkerRef.current) {
      try { userMarkerRef.current.remove(); } catch {}
    }
    const userEl = document.createElement('div');
    userEl.innerHTML = createUserMarkerHtml();
    userMarkerRef.current = new mapboxgl.Marker({ element: userEl.firstElementChild || userEl })
      .setLngLat([lng, lat])
      .addTo(map);

    map.flyTo({ center: [lng, lat], zoom: DEFAULT_ZOOM, pitch: DEFAULT_PITCH, duration: 600 });

    const clearCarMarkers = () => {
      carMarkersRef.current.forEach((m) => { try { m?.remove?.(); } catch {} });
      carMarkersRef.current = [];
    };

    const renderCars = (cars) => {
      clearCarMarkers();
      cars.forEach((car) => {
        const el = document.createElement('div');
        el.innerHTML = createCarMarkerHtml(car);
        el.className = 'mapbox-marker';
        const marker = new mapboxgl.Marker({ element: el.firstElementChild || el })
          .setLngLat([car.lng, car.lat])
          .addTo(map);
        carMarkersRef.current.push(marker);
      });
    };

    carsDataRef.current = generateCars(lat, lng);
    renderCars(carsDataRef.current);

    refreshTimerRef.current = setInterval(() => {
      const cars = carsDataRef.current;
      if (cars.length === 0) return;
      const [clng, clat] = centerRef.current;
      const idx = Math.floor(Math.random() * cars.length);
      const newCar = generateOneCar(clat, clng, RADIUS_METERS);
      cars[idx] = newCar;
      carsDataRef.current = cars;
      renderCars(cars);
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      if (userMarkerRef.current) { try { userMarkerRef.current.remove(); } catch {} }
      userMarkerRef.current = null;
      clearCarMarkers();
    };
  }, [mapReady, getCenter, error]);

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
