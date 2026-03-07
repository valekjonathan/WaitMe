import { useEffect, useRef, useState, useCallback } from 'react';
import { getCarWithPriceHtml } from '@/lib/vehicleIcons';
import { getMapLayoutPadding } from '@/lib/mapLayoutPadding';
import CenterPin from '@/components/CenterPin';
import { getPreciseInitialLocation, toLatLngArray } from '@/lib/location';

const OVIEDO_CENTER = [-5.8494, 43.3619]; // [lng, lat]
const DEFAULT_ZOOM = 16.5;
const DEFAULT_PITCH = 30;
const DARK_STYLE = 'mapbox://styles/mapbox/dark-v11';
const ACCURACY_RECENTER_THRESHOLD = 80;

export default function MapboxMap({
  className = '',
  alerts = [],
  onAlertClick,
  onMapLoad,
  onRecenterRef,
  mapRef: externalMapRef,
  locationFromEngine = null,
  initialLocation = null,
  suppressInternalWatcher = false,
  useCenterPin = false,
  skipAutoFlyWhenCenterPin = false,
  centerPinFromOverlay = false,
  centerPaddingBottom = 0,
  onMapMove,
  onMapMoveEnd,
  interactive = true,
  children,
  ...rest
}) {
  const containerRef = useRef(null);
  const internalMapRef = useRef(null);
  const mapRef = externalMapRef ?? internalMapRef;
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

  const [hasShownInitial, setHasShownInitial] = useState(false);
  const engineArr = toLatLngArray(locationFromEngine);
  const engineCenter = engineArr ? [engineArr[1], engineArr[0]] : null;
  const initialCenter =
    initialLocation?.lat != null && initialLocation?.lng != null
      ? [initialLocation.lng, initialLocation.lat]
      : null;
  const effectiveCenter =
    (!hasShownInitial && initialCenter) ??
    engineCenter ??
    (location.lat != null && location.lng != null ? [location.lng, location.lat] : OVIEDO_CENTER);

  const getMapPadding = useCallback(() => {
    if (centerPaddingBottom <= 0) return undefined;
    return getMapLayoutPadding();
  }, [centerPaddingBottom]);

  const fallbackCoords = engineArr
    ? { lat: engineArr[0], lng: engineArr[1] }
    : location.lat != null && location.lng != null
      ? { lat: location.lat, lng: location.lng }
      : null;

  const flyToUser = useCallback(
    (coords) => {
      const map = mapRef.current;
      if (!map?.flyTo && !map?.easeTo) return;
      const [lng, lat] =
        Array.isArray(coords) && coords.length >= 2
          ? [coords[1], coords[0]]
          : coords?.lat != null && coords?.lng != null
            ? [coords.lng, coords.lat]
            : fallbackCoords
              ? [fallbackCoords.lng, fallbackCoords.lat]
              : OVIEDO_CENTER;
      const c = [lng, lat];
      const padding = getMapPadding();
      const opts = {
        center: c,
        zoom: DEFAULT_ZOOM,
        pitch: DEFAULT_PITCH,
        duration: 800,
        essential: true,
        speed: 0.8,
        ...(padding && { padding }),
      };
      if (typeof map.easeTo === 'function') {
        map.easeTo(opts);
      } else {
        map.flyTo(opts);
      }
    },
    [location.lat, location.lng, locationFromEngine, getMapPadding]
  );

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
    if (suppressInternalWatcher) return;
    if (locationFromEngine != null) return;

    if (!navigator.geolocation) {
      setLocation({ lat: 43.3619, lng: -5.8494, accuracy: 500, timestamp: Date.now() });
      return;
    }

    // Posición inicial precisa (getCurrentPosition con alta precisión, sin pipeline)
    let cancelled = false;
    getPreciseInitialLocation().then((result) => {
      if (cancelled) return;
      setLocation({
        lat: result.lat,
        lng: result.lng,
        accuracy: result.accuracy ?? 100,
        timestamp: Date.now(),
      });
    });

    gpsTimeoutRef.current = setTimeout(() => {
      setLocation((prev) => {
        if (prev.lat != null && prev.lng != null) return prev;
        return { lat: 43.3619, lng: -5.8494, accuracy: 500, timestamp: Date.now() };
      });
    }, 12000);

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
        clearTimeout(gpsTimeoutRef.current);
      },
      () => {
        clearTimeout(gpsTimeoutRef.current);
        setLocation((prev) => {
          if (prev.lat != null && prev.lng != null) return prev;
          return { lat: 43.3619, lng: -5.8494, accuracy: 500, timestamp: Date.now() };
        });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    return () => {
      cancelled = true;
      clearTimeout(gpsTimeoutRef.current);
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [locationFromEngine, suppressInternalWatcher]);

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    const tokenStr = token ? String(token).trim() : '';
    const isPlaceholder =
      !tokenStr || tokenStr === 'PEGA_AQUI_EL_TOKEN' || tokenStr === 'YOUR_MAPBOX_PUBLIC_TOKEN';

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
          if (!containerRef.current) return;
          map = new mapboxgl.Map({
            container: container,
            style: DARK_STYLE,
            center: OVIEDO_CENTER,
            zoom: DEFAULT_ZOOM,
            pitch: DEFAULT_PITCH,
            bearing: 0,
            antialias: true,
            attributionControl: false,
            dragPan: interactive,
            touchZoomRotate: interactive,
            scrollZoom: interactive,
          });

          if (mapRef) mapRef.current = map;

          map.on('load', () => {
            if (cancelled) return;
            if (mapRef) mapRef.current = map;
            if (onMapLoad) onMapLoad(map);
            if (import.meta.env.DEV) {
              try {
                window.__DEV_DIAG = {
                  ...(window.__DEV_DIAG || {}),
                  mapboxMounted: true,
                  mapRefAvailable: !!mapRef?.current,
                };
              } catch {}
            }

            // Estilo Uber/Bolt nocturno: desactivar relieve y árboles
            try {
              if (map.getTerrain()) map.setTerrain(null);
            } catch {}
            const style = map.getStyle();
            if (style?.layers) {
              for (const layer of style.layers) {
                const id = (layer.id || '').toLowerCase();
                if (
                  id.includes('tree') ||
                  id.includes('park') ||
                  id.includes('landcover') ||
                  id.includes('land-use')
                ) {
                  try {
                    map.setLayoutProperty(layer.id, 'visibility', 'none');
                  } catch {}
                }
              }
            }

            map.resize();
            setMapReady(true);

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
            if (msg.includes('token') || msg.includes('401') || msg.includes('Unauthorized'))
              setError('no_token');
          });
        } catch (err) {
          console.error('Mapbox init error', err);
          setError('init_failed');
        }
      })
      .catch((err) => {
        console.error('Mapbox init error', err);
        setError('init_failed');
      });

    return () => {
      if (import.meta.env.DEV) {
        try {
          window.__DEV_DIAG = {
            ...(window.__DEV_DIAG || {}),
            mapboxMounted: false,
            mapRefAvailable: false,
          };
        } catch {}
      }
      cancelled = true;
      resizeObserverRef.current?.disconnect?.();
      resizeObserverRef.current = null;
      markersRef.current.forEach((m) => m?.remove?.());
      markersRef.current = [];
      if (map) {
        try {
          map.remove();
        } catch {}
      }
      mapRef.current = null;
      mapboxglRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || error) return;
    const map = mapRef.current;
    try {
      if (interactive) {
        map.dragPan?.enable?.();
        map.touchZoomRotate?.enable?.();
        map.scrollZoom?.enable?.();
      } else {
        map.dragPan?.disable?.();
        map.touchZoomRotate?.disable?.();
        map.scrollZoom?.disable?.();
      }
    } catch {}
  }, [mapReady, error, interactive]);

  const lastFlownCenterRef = useRef(null);
  useEffect(() => {
    if (!mapReady || !mapRef.current || error) return;
    const map = mapRef.current;
    const [lng, lat] = effectiveCenter;
    const accuracy = initialLocation?.accuracy ?? location.accuracy ?? 50;
    centerRef.current = [lng, lat];
    accuracyRef.current = accuracy;

    const key = `${lng.toFixed(5)}_${lat.toFixed(5)}`;
    if (lastFlownCenterRef.current === key) return;
    lastFlownCenterRef.current = key;

    if (initialCenter && !hasShownInitial) {
      setHasShownInitial(true);
    }

    if (useCenterPin) {
      if (skipAutoFlyWhenCenterPin) return;
      const padding = getMapPadding();
      const opts = {
        center: [lng, lat],
        zoom: DEFAULT_ZOOM,
        pitch: DEFAULT_PITCH,
        duration: 500,
        ...(padding && { padding }),
      };
      if (typeof map.easeTo === 'function') {
        map.easeTo(opts);
      } else {
        map.flyTo(opts);
      }
      return;
    }

    const shouldRecenter =
      accuracy <= ACCURACY_RECENTER_THRESHOLD && lat !== 43.3619 && lng !== -5.8494;
    if (shouldRecenter && !hasFlownToUserRef.current) {
      hasFlownToUserRef.current = true;
      map.flyTo({
        center: [lng, lat],
        zoom: DEFAULT_ZOOM,
        pitch: DEFAULT_PITCH,
        duration: 600,
        speed: 0.8,
      });
    } else if (shouldRecenter) {
      map.flyTo({
        center: [lng, lat],
        zoom: DEFAULT_ZOOM,
        pitch: DEFAULT_PITCH,
        duration: 400,
        speed: 0.8,
      });
    }
  }, [
    mapReady,
    effectiveCenter,
    initialCenter,
    hasShownInitial,
    location.accuracy,
    error,
    useCenterPin,
    skipAutoFlyWhenCenterPin,
    centerPaddingBottom,
  ]);

  const userCoordsForMarker =
    suppressInternalWatcher && engineArr
      ? { lat: engineArr[0], lng: engineArr[1] }
      : location.lat != null && location.lng != null
        ? { lat: location.lat, lng: location.lng }
        : null;

  useEffect(() => {
    if (!mapReady || !mapRef.current || error || !mapboxglRef.current) return;
    const map = mapRef.current;
    const mapboxgl = mapboxglRef.current;

    markersRef.current.forEach((m) => m?.remove?.());
    markersRef.current = [];

    const userLat = userCoordsForMarker?.lat;
    const userLng = userCoordsForMarker?.lng;
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

      const marker = new mapboxgl.Marker({ element: markerEl }).setLngLat([lng, lat]).addTo(map);

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
  }, [mapReady, error, alerts, onAlertClick, userCoordsForMarker, useCenterPin]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || error || !useCenterPin) return;
    const map = mapRef.current;
    const padding =
      centerPaddingBottom > 0
        ? (getMapPadding() ?? { top: 56, bottom: 300, left: 0, right: 0 })
        : { top: 0, bottom: 0, left: 0, right: 0 };
    map.setPadding(padding);
  }, [mapReady, error, useCenterPin, centerPaddingBottom, getMapPadding]);

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
      <div
        style={{
          background: '#0B0B0F',
          height: '100%',
          width: '100%',
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        Map loading...
      </div>
    );
  }

  const containerStyle = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    minHeight: '100dvh',
    minWidth: '100%',
    touchAction: interactive ? 'pan-x pan-y' : 'none',
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
