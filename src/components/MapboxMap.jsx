import { useEffect, useRef, useState, useCallback } from 'react';

const OVIEDO_CENTER = [-5.8494, 43.3619]; // [lng, lat]
const FALLBACK_ZOOM = 14;
const DEFAULT_ZOOM = 15;
const DEFAULT_PITCH = 30;
const DARK_STYLE = 'mapbox://styles/mapbox/dark-v11';
const RADIUS_METERS = 1500;
const CAR_COUNT = 15;
const REFRESH_INTERVAL_MS = 40_000;
const GPS_TIMEOUT_MS = 2500;
const ACCURACY_RECENTER_THRESHOLD = 80;
const SNAP_QUERY_PX = 50;
const SNAP_MAX_RETRIES = 5;

const CAR_COLORS = [
  '#FFFFFF', '#1a1a1a', '#6b7280', '#ef4444', '#3b82f6', '#22c55e',
  '#eab308', '#f97316', '#a855f7', '#92400e'
];

const TIPOS = ['normal', 'suv', 'van'];

const ROAD_LAYER_PATTERNS = ['road', 'street', 'secondary', 'primary', 'tertiary', 'motorway', 'trunk'];

function isRoadLayer(layerId) {
  const id = (layerId || '').toLowerCase();
  return ROAD_LAYER_PATTERNS.some((p) => id.includes(p));
}

/**
 * Closest point on segment [a,b] to point p.
 * Returns { point: [lng, lat], dist: number }
 */
function closestPointOnSegment(p, a, b) {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { point: a, dist: Math.hypot(px - ax, py - ay) };
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + t * dx;
  const qy = ay + t * dy;
  return { point: [qx, qy], dist: Math.hypot(px - qx, py - qy) };
}

/**
 * Snap [lng, lat] to nearest road using map.queryRenderedFeatures.
 */
function snapToRoad(map, lng, lat) {
  if (!map?.project || !map?.queryRenderedFeatures) return [lng, lat];
  try {
    const pt = map.project([lng, lat]);
    const size = SNAP_QUERY_PX;
    const bbox = [[pt.x - size, pt.y - size], [pt.x + size, pt.y + size]];
    const features = map.queryRenderedFeatures(bbox);
    let best = { point: [lng, lat], dist: Infinity };
    const target = [lng, lat];

    for (const f of features) {
      if (!isRoadLayer(f.layer?.id)) continue;
      const geom = f.geometry;
      if (geom?.type !== 'LineString' || !Array.isArray(geom.coordinates)) continue;
      const coords = geom.coordinates;
      for (let i = 0; i < coords.length - 1; i++) {
        const r = closestPointOnSegment(target, coords[i], coords[i + 1]);
        if (r.dist < best.dist) best = r;
      }
    }

    return best.dist < Infinity ? best.point : [lng, lat];
  } catch {
    return [lng, lat];
  }
}

function generateOneCarRaw(centerLat, centerLng, radiusMeters, id) {
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
    <div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
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
  const centerRef = useRef(OVIEDO_CENTER);
  const accuracyRef = useRef(null);
  const watchIdRef = useRef(null);
  const gpsTimeoutRef = useRef(null);
  const hasFlownToUserRef = useRef(false);

  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [location, setLocation] = useState(() => ({
    lat: null,
    lng: null,
    accuracy: null,
    timestamp: null,
  }));

  const effectiveCenter = location.lat != null && location.lng != null
    ? [location.lng, location.lat]
    : OVIEDO_CENTER;

  const flyToUser = useCallback(() => {
    const map = mapRef.current;
    if (!map?.flyTo) return;
    const c = location.lat != null && location.lng != null ? [location.lng, location.lat] : OVIEDO_CENTER;
    map.flyTo({
      center: c,
      zoom: DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH,
      duration: 800,
      essential: true,
    });
  }, [location.lat, location.lng]);

  useEffect(() => {
    if (onRecenterRef) onRecenterRef.current = flyToUser;
    return () => { if (onRecenterRef) onRecenterRef.current = null; };
  }, [onRecenterRef, flyToUser]);

  useEffect(() => {
    const handler = () => flyToUser();
    window.addEventListener('waitme:goLogo', handler);
    return () => window.removeEventListener('waitme:goLogo', handler);
  }, [flyToUser]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: 43.3619, lng: -5.8494, accuracy: 500, timestamp: Date.now() });
      return;
    }

    let resolved = false;
    gpsTimeoutRef.current = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      setLocation((prev) => {
        if (prev.lat != null && prev.lng != null) return prev;
        return { lat: 43.3619, lng: -5.8494, accuracy: 500, timestamp: Date.now() };
      });
    }, GPS_TIMEOUT_MS);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const acc = typeof accuracy === 'number' ? accuracy : 100;
        setLocation({
          lat: latitude,
          lng: longitude,
          accuracy: acc,
          timestamp: Date.now(),
        });
        if (!resolved) {
          resolved = true;
          clearTimeout(gpsTimeoutRef.current);
        }
      },
      () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(gpsTimeoutRef.current);
          setLocation({ lat: 43.3619, lng: -5.8494, accuracy: 500, timestamp: Date.now() });
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    return () => {
      clearTimeout(gpsTimeoutRef.current);
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

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
          center: OVIEDO_CENTER,
          zoom: FALLBACK_ZOOM,
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
      if (map) {
        try {
          if (map.getLayer('user-accuracy-fill')) map.removeLayer('user-accuracy-fill');
          if (map.getSource('user-accuracy')) map.removeSource('user-accuracy');
        } catch {}
        try { map.remove(); } catch {}
      }
      mapRef.current = null;
      mapboxglRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapboxglRef.current || error) return;
    const map = mapRef.current;
    const mapboxgl = mapboxglRef.current;
    const [lng, lat] = effectiveCenter;
    const accuracy = location.accuracy ?? 50;
    centerRef.current = [lng, lat];
    accuracyRef.current = accuracy;

    if (userMarkerRef.current) {
      try { userMarkerRef.current.remove(); } catch {}
    }
    const userEl = document.createElement('div');
    userEl.innerHTML = createUserMarkerHtml();
    userMarkerRef.current = new mapboxgl.Marker({ element: userEl.firstElementChild || userEl })
      .setLngLat([lng, lat])
      .addTo(map);

    const shouldRecenter = accuracy <= ACCURACY_RECENTER_THRESHOLD && lat !== 43.3619 && lng !== -5.8494;
    if (shouldRecenter && !hasFlownToUserRef.current) {
      hasFlownToUserRef.current = true;
      map.flyTo({ center: [lng, lat], zoom: DEFAULT_ZOOM, pitch: DEFAULT_PITCH, duration: 600 });
    } else if (shouldRecenter) {
      map.flyTo({ center: [lng, lat], zoom: DEFAULT_ZOOM, pitch: DEFAULT_PITCH, duration: 400 });
    }

    if (map.getSource('user-accuracy')) {
      try { map.removeLayer('user-accuracy-fill'); } catch {}
      try { map.removeSource('user-accuracy'); } catch {}
    }
    const radiusMeters = Math.min(accuracy, 200);
    const kmPerDegLat = 111_000;
    const kmPerDegLng = 111_000 * Math.cos((lat * Math.PI) / 180);
    const radiusLat = radiusMeters / kmPerDegLat;
    const radiusLng = radiusMeters / kmPerDegLng;
    const points = 64;
    const coords = [];
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      coords.push([lng + radiusLng * Math.cos(angle), lat + radiusLat * Math.sin(angle)]);
    }
    coords.push(coords[0]);
    map.addSource('user-accuracy', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [coords] },
      },
    });
    map.addLayer({
      id: 'user-accuracy-fill',
      type: 'fill',
      source: 'user-accuracy',
      paint: {
        'fill-color': '#a855f7',
        'fill-opacity': 0.15,
        'fill-outline-color': 'rgba(168,85,247,0.3)',
      },
    });
  }, [mapReady, effectiveCenter, location.accuracy, error]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapboxglRef.current || error) return;
    const map = mapRef.current;
    const mapboxgl = mapboxglRef.current;
    const [lng, lat] = effectiveCenter;

    const snapCar = (car) => {
      for (let r = 0; r < SNAP_MAX_RETRIES; r++) {
        const [slng, slat] = snapToRoad(map, car.lng, car.lat);
        if (slng !== car.lng || slat !== car.lat) {
          return { ...car, lng: slng, lat: slat };
        }
        car = generateOneCarRaw(lat, lng, RADIUS_METERS, car.id);
      }
      return car;
    };

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

    const setupCars = () => {
      const initialCars = [];
      for (let i = 0; i < CAR_COUNT; i++) {
        const raw = generateOneCarRaw(lat, lng, RADIUS_METERS, `sim_${i}`);
        initialCars.push(snapCar(raw));
      }
      carsDataRef.current = initialCars;
      renderCars(initialCars);
    };

    if (map.isStyleLoaded && map.isStyleLoaded()) {
      setupCars();
    } else {
      map.once('idle', setupCars);
    }

    refreshTimerRef.current = setInterval(() => {
      const cars = carsDataRef.current;
      if (cars.length === 0) return;
      const [clng, clat] = centerRef.current;
      const idx = Math.floor(Math.random() * cars.length);
      const raw = generateOneCarRaw(clat, clng, RADIUS_METERS);
      const snapped = snapCar(raw);
      cars[idx] = snapped;
      carsDataRef.current = cars;
      const oldMarker = carMarkersRef.current[idx];
      if (oldMarker) {
        try { oldMarker.remove(); } catch {}
        carMarkersRef.current[idx] = null;
      }
      const el = document.createElement('div');
      el.innerHTML = createCarMarkerHtml(snapped);
      el.className = 'mapbox-marker';
      const marker = new mapboxgl.Marker({ element: el.firstElementChild || el })
        .setLngLat([snapped.lng, snapped.lat])
        .addTo(map);
      carMarkersRef.current[idx] = marker;
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      clearCarMarkers();
    };
  }, [mapReady, effectiveCenter, error]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    const acc = accuracyRef.current;
    if (acc == null) return;
    const [lng, lat] = centerRef.current;
    if (map.getSource('user-accuracy')) {
      const radiusMeters = Math.min(acc, 200);
      const kmPerDegLat = 111_000;
      const kmPerDegLng = 111_000 * Math.cos((lat * Math.PI) / 180);
      const radiusLat = radiusMeters / kmPerDegLat;
      const radiusLng = radiusMeters / kmPerDegLng;
      const points = 64;
      const coords = [];
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * 2 * Math.PI;
        coords.push([lng + radiusLng * Math.cos(angle), lat + radiusLat * Math.sin(angle)]);
      }
      coords.push(coords[0]);
      map.getSource('user-accuracy').setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [coords] },
      });
    }
  }, [mapReady, location.accuracy]);

  if (error) {
    return (
      <div className="relative w-full h-full min-h-[200px]">
        <div
          className={`flex items-center justify-center bg-[#0B0B0F] text-gray-500 text-sm ${className}`}
          style={{ width: '100%', height: '100%' }}
        >
          Mapa no disponible
        </div>
        {import.meta.env.DEV && (
          <div className="absolute top-2 left-2 right-2 py-1 px-2 bg-red-900/90 text-red-200 text-xs rounded z-50">
            Mapbox error
          </div>
        )}
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
