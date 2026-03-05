import { useEffect, useRef, useState, useCallback } from 'react';
import { getCarIconHtml } from '@/lib/vehicleIcons';

const OVIEDO_CENTER = [-5.8494, 43.3619]; // [lng, lat]
const FALLBACK_ZOOM = 14;
const DEFAULT_ZOOM = 16;
const DEFAULT_PITCH = 30;
const DARK_STYLE = 'mapbox://styles/mapbox/dark-v11';
const GPS_TIMEOUT_MS = 2500;
const ACCURACY_RECENTER_THRESHOLD = 80;

export default function MapboxMap({
  className = '',
  alerts = [],
  onAlertClick,
  onMapLoad,
  onRecenterRef,
  children,
  ...rest
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapboxglRef = useRef(null);
  const markersRef = useRef([]);
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
      markersRef.current.forEach((m) => m?.remove?.());
      markersRef.current = [];
      if (map) {
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
    if (!mapReady || !mapRef.current || error || !mapboxglRef.current) return;
    const map = mapRef.current;
    const mapboxgl = mapboxglRef.current;

    markersRef.current.forEach((m) => m?.remove?.());
    markersRef.current = [];

    const userLng = location.lng;
    const userLat = location.lat;
    if (userLat != null && userLng != null) {
      const userPinHtml = `<div style="position:relative;width:40px;height:100px;">
        <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:2px;height:45px;background:#a855f7;"></div>
        <div style="position:absolute;bottom:40px;left:50%;transform:translateX(-50%);width:20px;height:20px;background:#a855f7;border-radius:50%;box-shadow:0 0 18px rgba(168,85,247,0.9);"></div>
      </div>`;
      const userEl = document.createElement('div');
      userEl.innerHTML = userPinHtml;
      const userMarkerEl = userEl.firstElementChild || userEl;
      const userMarker = new mapboxgl.Marker({ element: userMarkerEl, anchor: 'bottom' })
        .setLngLat([userLng, userLat])
        .addTo(map);
      markersRef.current.push(userMarker);
    }

    const list = Array.isArray(alerts) ? alerts : [];
    list.forEach((alert) => {
      const lat = alert.latitude ?? alert.lat;
      const lng = alert.longitude ?? alert.lng;
      if (lat == null || lng == null) return;

      const color = alert.vehicle_color ?? alert.color ?? 'gray';
      const html = getCarIconHtml(color);

      const el = document.createElement('div');
      el.innerHTML = html;
      const markerEl = el.firstElementChild || el;
      markerEl.className = 'mapboxgl-marker-vehicle';

      const marker = new mapboxgl.Marker({ element: markerEl })
        .setLngLat([lng, lat])
        .addTo(map);

      if (onAlertClick) {
        markerEl.style.cursor = 'pointer';
        markerEl.addEventListener('click', () => onAlertClick(alert));
      }

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m?.remove?.());
      markersRef.current = [];
    };
  }, [mapReady, error, alerts, onAlertClick, location.lat, location.lng]);


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
