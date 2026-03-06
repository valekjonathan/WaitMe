import { useEffect, useRef, useState, useCallback } from 'react';
import { getCarWithPriceHtml } from '@/lib/vehicleIcons';
import CenterPin from '@/components/CenterPin';

const OVIEDO_CENTER = [-5.8494, 43.3619]; // [lng, lat]
const FALLBACK_ZOOM = 14;
const DEFAULT_ZOOM = 16.5;
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
  useCenterPin = false,
  centerPinFromOverlay = false,
  centerPaddingBottom = 0,
  onMapMove,
  onMapMoveEnd,
  children,
  ...rest
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapboxglRef = useRef(null);
  const markersRef = useRef([]);
  const resizeObserverRef = useRef(null);
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

  const flyToUser = useCallback((coords) => {
    const map = mapRef.current;
    if (!map?.flyTo) return;
    const [lng, lat] = Array.isArray(coords) && coords.length >= 2
      ? [coords[1], coords[0]]
      : (coords?.lat != null && coords?.lng != null
        ? [coords.lng, coords.lat]
        : (location.lat != null && location.lng != null ? [location.lng, location.lat] : OVIEDO_CENTER));
    const c = [lng, lat];
    const padding = centerPaddingBottom > 0 ? { top: 0, bottom: 120, left: 0, right: 0 } : undefined;
    map.flyTo({
      center: c,
      zoom: DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH,
      duration: 800,
      essential: true,
      speed: 0.8,
      ...(padding && { padding }),
    });
  }, [location.lat, location.lng, centerPaddingBottom]);

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
      tokenStr === 'PEGA_AQUI_EL_TOKEN' ||
      tokenStr === 'YOUR_MAPBOX_PUBLIC_TOKEN';

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
            dragPan: true,
            touchZoomRotate: true,
            scrollZoom: true,
          });

          map.on('load', () => {
            if (cancelled) return;
            mapRef.current = map;

            // Estilo Uber/Bolt nocturno: desactivar relieve y árboles
            try {
              if (map.getTerrain()) map.setTerrain(null);
            } catch {}
            const style = map.getStyle();
            if (style?.layers) {
              for (const layer of style.layers) {
                const id = (layer.id || '').toLowerCase();
                if (id.includes('tree') || id.includes('park') || id.includes('landcover') || id.includes('land-use')) {
                  try { map.setLayoutProperty(layer.id, 'visibility', 'none'); } catch {}
                }
              }
            }

            map.resize();
            setMapReady(true);
            onMapLoad?.(map);

            const resizeDelayed = () => {
              if (mapRef.current) mapRef.current.resize();
            };
            setTimeout(resizeDelayed, 100);
            setTimeout(resizeDelayed, 400);
            setTimeout(resizeDelayed, 800);

            if (container && typeof ResizeObserver !== 'undefined') {
              const ro = new ResizeObserver(resizeDelayed);
              resizeObserverRef.current = ro;
              ro.observe(container);
            }
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
      resizeObserverRef.current?.disconnect?.();
      resizeObserverRef.current = null;
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

  const lastFlownCenterRef = useRef(null);
  useEffect(() => {
    if (!mapReady || !mapRef.current || error) return;
    const map = mapRef.current;
    const [lng, lat] = effectiveCenter;
    const accuracy = location.accuracy ?? 50;
    centerRef.current = [lng, lat];
    accuracyRef.current = accuracy;

    const key = `${lng.toFixed(5)}_${lat.toFixed(5)}`;
    if (lastFlownCenterRef.current === key) return;
    lastFlownCenterRef.current = key;

    if (useCenterPin) {
      const padding = centerPaddingBottom > 0
        ? { top: 0, bottom: 120, left: 0, right: 0 }
        : undefined;
      map.flyTo({
        center: [lng, lat],
        zoom: DEFAULT_ZOOM,
        pitch: DEFAULT_PITCH,
        duration: 500,
        padding,
      });
      return;
    }

    const shouldRecenter = accuracy <= ACCURACY_RECENTER_THRESHOLD && lat !== 43.3619 && lng !== -5.8494;
    if (shouldRecenter && !hasFlownToUserRef.current) {
      hasFlownToUserRef.current = true;
      map.flyTo({ center: [lng, lat], zoom: DEFAULT_ZOOM, pitch: DEFAULT_PITCH, duration: 600, speed: 0.8 });
    } else if (shouldRecenter) {
      map.flyTo({ center: [lng, lat], zoom: DEFAULT_ZOOM, pitch: DEFAULT_PITCH, duration: 400, speed: 0.8 });
    }
  }, [mapReady, effectiveCenter, location.accuracy, error, useCenterPin, centerPaddingBottom]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || error || !mapboxglRef.current) return;
    const map = mapRef.current;
    const mapboxgl = mapboxglRef.current;

    markersRef.current.forEach((m) => m?.remove?.());
    markersRef.current = [];

    const userLng = location.lng;
    const userLat = location.lat;
    if (userLat != null && userLng != null && !useCenterPin) {
      const userPinHtml = `<div style="position:relative;width:40px;height:100px;">
        <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:2px;height:45px;background:#a855f7;"></div>
        <div style="position:absolute;bottom:40px;left:50%;transform:translateX(-50%);width:20px;height:20px;background:#a855f7;border-radius:50%;"></div>
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

      const type = alert.vehicle_type || 'car';
      const color = alert.vehicle_color ?? alert.color ?? 'gray';
      const price = alert.price ?? 0;
      const html = getCarWithPriceHtml(type, color, price);

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
  }, [mapReady, error, alerts, onAlertClick, location.lat, location.lng, useCenterPin]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || error || !useCenterPin) return;
    const map = mapRef.current;
    if (centerPaddingBottom > 0) {
      map.setPadding({ top: 0, bottom: 120, left: 0, right: 0 });
    } else {
      map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
    }
  }, [mapReady, error, useCenterPin, centerPaddingBottom]);

  // Brillo y contraste de calles cuando create (centerPaddingBottom > 0)
  useEffect(() => {
    if (!mapReady || !mapRef.current || error || centerPaddingBottom <= 0) return;
    const map = mapRef.current;
    const style = map.getStyle();
    if (!style?.layers) return;
    const ROAD_COLOR = '#8b5cf6';
    for (const layer of style.layers) {
      const id = (layer.id || '').toLowerCase();
      if (id.includes('road') && layer.type === 'line') {
        try {
          map.setPaintProperty(layer.id, 'line-color', ROAD_COLOR);
          map.setPaintProperty(layer.id, 'line-opacity', 1);
          const w = map.getPaintProperty(layer.id, 'line-width');
          if (typeof w === 'number') map.setPaintProperty(layer.id, 'line-width', w + 0.5);
        } catch {}
      }
    }
  }, [mapReady, error, centerPaddingBottom]);

  const onMapMoveRef = useRef(onMapMove);
  const onMapMoveEndRef = useRef(onMapMoveEnd);
  onMapMoveRef.current = onMapMove;
  onMapMoveEndRef.current = onMapMoveEnd;

  useEffect(() => {
    if (!mapReady || !mapRef.current || error || !useCenterPin) return;
    const map = mapRef.current;
    const onMove = () => {
      const c = map.getCenter();
      onMapMoveRef.current?.([c.lat, c.lng]);
    };
    const onMoveEnd = () => {
      const c = map.getCenter();
      onMapMoveEndRef.current?.([c.lat, c.lng]);
    };
    map.on('move', onMove);
    map.on('moveend', onMoveEnd);
    return () => {
      map.off('move', onMove);
      map.off('moveend', onMoveEnd);
    };
  }, [mapReady, error, useCenterPin]);


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
    minHeight: isZeroSize ? '100vh' : '100dvh',
    minWidth: '100%',
    touchAction: 'manipulation',
  };

  const { style: restStyle, ...restProps } = rest;
  return (
    <div
      ref={containerRef}
      className={`${className} w-full h-full relative`}
      style={{ ...containerStyle, ...restStyle }}
      {...restProps}
    >
      {useCenterPin && !centerPinFromOverlay && <CenterPin />}
      {children}
    </div>
  );
}
