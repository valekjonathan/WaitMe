import { useEffect, useRef, useState, useCallback } from 'react';

const OVIEDO_CENTER = [-5.8494, 43.3619]; // [lng, lat]
const FALLBACK_ZOOM = 14;
const DEFAULT_ZOOM = 16;
const DEFAULT_PITCH = 30;
const DARK_STYLE = 'mapbox://styles/mapbox/dark-v11';
const RADIUS_METERS = 800;
const CAR_COUNT = 12;
const REFRESH_INTERVAL_MS = 45_000;
const GPS_TIMEOUT_MS = 2500;
const ACCURACY_RECENTER_THRESHOLD = 80;
const CAR_COLORS = [
  '#FFFFFF', '#1a1a1a', '#6b7280', '#ef4444', '#3b82f6', '#22c55e',
  '#eab308', '#f97316', '#a855f7', '#92400e'
];

const ROAD_LAYER_PATTERNS = ['road', 'street', 'secondary', 'primary', 'tertiary', 'motorway', 'trunk'];

function isRoadLayer(layerId) {
  const id = (layerId || '').toLowerCase();
  return ROAD_LAYER_PATTERNS.some((p) => id.includes(p));
}

/**
 * Obtiene puntos sobre calles visibles usando queryRenderedFeatures.
 */
function getRoadPoints(map, maxPoints = 12) {
  if (!map?.queryRenderedFeatures) return [];
  const features = map.queryRenderedFeatures();
  const points = [];
  for (const f of features) {
    if (!isRoadLayer(f.layer?.id)) continue;
    const geom = f.geometry;
    if (geom?.type !== 'LineString' || !Array.isArray(geom.coordinates)) continue;
    const coords = geom.coordinates;
    const step = Math.max(1, Math.floor(coords.length / 3));
    for (let i = 0; i < coords.length && points.length < maxPoints; i += step) {
      points.push(coords[i]);
    }
  }
  return points.slice(0, maxPoints);
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

    // Obtener ubicación al cargar para centrar mapa inmediatamente
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLocation({
          lat: latitude,
          lng: longitude,
          accuracy: typeof accuracy === 'number' ? accuracy : 100,
          timestamp: Date.now(),
        });
      },
      () => {
        setLocation({ lat: 43.3619, lng: -5.8494, accuracy: 500, timestamp: Date.now() });
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 8000 }
    );

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
    const tokenStr = token ? String(token).trim() : '';
    const isPlaceholder = !tokenStr ||
      tokenStr === 'PEGA_AQUI_EL_TOKEN' || tokenStr === 'YOUR_MAPBOX_PUBLIC_TOKEN';

    if (isPlaceholder) {
      setError('no_token');
      return;
    }

    if (!containerRef.current) return;
    const container = containerRef.current;

    let map = null;
    let cancelled = false;

    import('mapbox-gl')
      .then((mod) => {
        if (cancelled || !containerRef.current) return;
        const mapboxgl = mod.default;
        mapboxglRef.current = mapboxgl;
        import('mapbox-gl/dist/mapbox-gl.css');
        mapboxgl.accessToken = token;

        try {
          map = new mapboxgl.Map({
            container: container,
            style: DARK_STYLE,
            center: OVIEDO_CENTER,
            zoom: DEFAULT_ZOOM,
            pitch: DEFAULT_PITCH,
            bearing: 0,
            antialias: true,
            attributionControl: false,
          });

          map.on('load', () => {
            if (cancelled) return;
            mapRef.current = map;
            map.resize();
            setMapReady(true);
            onMapLoad?.(map);

            setTimeout(() => {
              if (mapRef.current) mapRef.current.resize();
            }, 300);
          });

          map.on('error', (e) => {
            const msg = e?.error?.message || String(e);
            if (msg.includes('token') || msg.includes('401') || msg.includes('Unauthorized')) setError('no_token');
          });
        } catch (err) {
          setError('no_token');
        }
      })
      .catch(() => {
        setError('no_token');
      });

    return () => {
      cancelled = true;
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      if (map) {
        try {
          if (map.getLayer('cars-layer')) map.removeLayer('cars-layer');
          if (map.getSource('cars')) map.removeSource('cars');
        } catch {}
        try { map.remove(); } catch {}
      }
      mapRef.current = null;
      mapboxglRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || error) return;
    const map = mapRef.current;
    const [lng, lat] = effectiveCenter;
    const accuracy = location.accuracy ?? 50;
    centerRef.current = [lng, lat];
    accuracyRef.current = accuracy;

    // Centrar mapa en ubicación del usuario (la punta morada del diseño está fija en el centro)
    const shouldRecenter = accuracy <= ACCURACY_RECENTER_THRESHOLD && lat !== 43.3619 && lng !== -5.8494;
    if (shouldRecenter && !hasFlownToUserRef.current) {
      hasFlownToUserRef.current = true;
      map.flyTo({ center: [lng, lat], zoom: DEFAULT_ZOOM, pitch: DEFAULT_PITCH, duration: 600 });
    } else if (shouldRecenter) {
      map.flyTo({ center: [lng, lat], zoom: DEFAULT_ZOOM, pitch: DEFAULT_PITCH, duration: 400 });
    }
  }, [mapReady, effectiveCenter, location.accuracy, error]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || error) return;
    const map = mapRef.current;
    const [lng, lat] = effectiveCenter;

    const updateCarsLayer = () => {
      const roadPoints = getRoadPoints(map, CAR_COUNT);
      if (roadPoints.length === 0) return;

      const features = roadPoints.map(([plng, plat], i) => ({
        type: 'Feature',
        properties: {
          id: `car_${i}`,
          color: CAR_COLORS[i % CAR_COLORS.length],
        },
        geometry: { type: 'Point', coordinates: [plng, plat] },
      }));

      const geojson = {
        type: 'FeatureCollection',
        features,
      };

      if (map.getSource('cars')) {
        map.getSource('cars').setData(geojson);
      } else {
        map.addSource('cars', { type: 'geojson', data: geojson });
        map.addLayer({
          id: 'cars-layer',
          type: 'circle',
          source: 'cars',
          paint: {
            'circle-radius': 6,
            'circle-color': ['get', 'color'],
            'circle-stroke-width': 1.5,
            'circle-stroke-color': 'rgba(255,255,255,0.7)',
          },
        });
      }
    };

    const setupCars = () => {
      updateCarsLayer();
    };

    if (map.isStyleLoaded && map.isStyleLoaded()) {
      setupCars();
    } else {
      map.once('idle', setupCars);
    }

    refreshTimerRef.current = setInterval(() => {
      const roadPoints = getRoadPoints(map, CAR_COUNT);
      if (roadPoints.length === 0) return;
      const features = roadPoints.map(([plng, plat], i) => ({
        type: 'Feature',
        properties: { id: `car_${i}`, color: CAR_COLORS[i % CAR_COLORS.length] },
        geometry: { type: 'Point', coordinates: [plng, plat] },
      }));
      if (map.getSource('cars')) {
        map.getSource('cars').setData({ type: 'FeatureCollection', features });
      }
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [mapReady, effectiveCenter, error]);


  if (error) {
    return (
      <div className="relative w-full h-full min-h-[200px]" style={{ minHeight: '100vh' }}>
        <div
          className={`flex items-center justify-center bg-[#0B0B0F] text-gray-500 text-sm ${className}`}
          style={{ width: '100%', height: '100%', minHeight: '100vh' }}
        >
          Mapa no disponible
        </div>
      </div>
    );
  }

  const isZeroSize = false;
  const containerStyle = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    minHeight: isZeroSize ? '100vh' : '100vh',
  };

  return (
    <div
      ref={containerRef}
      className={`${className} w-full h-full`}
      style={containerStyle}
      {...rest}
    >
      {children}
    </div>
  );
}
