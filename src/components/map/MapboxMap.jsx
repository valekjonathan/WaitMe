import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { getMapLayoutPadding } from '@/lib/mapLayoutPadding';
import CenterPin from '@/components/CenterPin';
import { getPreciseInitialLocation, toLatLngArray } from '@/lib/location';
import {
  OVIEDO_CENTER,
  DEFAULT_ZOOM,
  DEFAULT_PITCH,
  ACCURACY_RECENTER_THRESHOLD,
  createMap,
  setupMapStyleOnLoad,
} from './MapInit.js';
import {
  applyStaticCarsLayer,
  applyUserLocationLayer,
  applyWaitMeCarLayer,
  updateCarPosition,
} from './MapLayers.js';
import { alertsToGeoJSON } from '@/lib/mapLayers';
import { attachMoveListeners } from './MapEvents.js';
import { clearMarkers } from './MapMarkers.js';
import { setInteractive, setMapPadding, applyRoadStyleForCreate } from './MapControls.js';

const EMPTY_ALERTS = [];

function MapboxMapInner({
  className = '',
  alerts = EMPTY_ALERTS,
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
  waitMeCarMode = null,
  waitMeCarBuyerLocation = null,
  waitMeCarColor = 'azul',
  onCarsControllerReady,
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
  const onMapLoadRef = useRef(onMapLoad);
  const onAlertClickRef = useRef(onAlertClick);
  const carsGeoJSONRef = useRef({ type: 'FeatureCollection', features: [] });

  onMapLoadRef.current = onMapLoad;
  onAlertClickRef.current = onAlertClick;

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
  const engineLat = engineArr?.[0];
  const engineLng = engineArr?.[1];
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

  const fallbackCoords = useMemo(
    () =>
      engineArr
        ? { lat: engineArr[0], lng: engineArr[1] }
        : location.lat != null && location.lng != null
          ? { lat: location.lat, lng: location.lng }
          : null,
    [engineLat, engineLng, location.lat, location.lng]
  );

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
    [fallbackCoords?.lat, fallbackCoords?.lng, getMapPadding]
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

    createMap(container, { token: tokenStr, interactive })
      .then((m) => {
        if (cancelled || !containerRef.current) return;
        map = m;
        mapboxglRef.current = m;
        if (mapRef) mapRef.current = map;

        map.on('load', () => {
          if (cancelled) return;
          if (mapRef) mapRef.current = map;
          onMapLoadRef.current?.(map);
          if (import.meta.env.DEV) {
            try {
              window.__DEV_DIAG = {
                ...(window.__DEV_DIAG || {}),
                mapboxMounted: true,
                mapRefAvailable: !!mapRef?.current,
              };
            } catch (e) {
              console.error('[WaitMe Error]', e);
            }
          }

          setupMapStyleOnLoad(map);
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
        } catch (e) {
          console.error('[WaitMe Error]', e);
        }
      }
      cancelled = true;
      resizeObserverRef.current?.disconnect?.();
      resizeObserverRef.current = null;
      clearMarkers(markersRef);
      if (map) {
        try {
          map.remove();
        } catch (e) {
          console.error('[WaitMe Error]', e);
        }
      }
      mapRef.current = null;
      mapboxglRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || error) return;
    setInteractive(mapRef.current, interactive);
  }, [mapReady, error, interactive]);

  const lastFlownCenterRef = useRef(null);

  useEffect(() => {
    if (!useCenterPin) hasFlownToUserRef.current = false;
  }, [useCenterPin]);

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
      if (skipAutoFlyWhenCenterPin && hasFlownToUserRef.current) return;
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
      hasFlownToUserRef.current = true;
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
    effectiveCenter[0],
    effectiveCenter[1],
    initialCenter,
    hasShownInitial,
    location.accuracy,
    error,
    useCenterPin,
    skipAutoFlyWhenCenterPin,
    centerPaddingBottom,
  ]);

  const userCoordsForMarker = useMemo(() => {
    if (suppressInternalWatcher && engineArr) return { lat: engineArr[0], lng: engineArr[1] };
    if (location.lat != null && location.lng != null)
      return { lat: location.lat, lng: location.lng };
    return null;
  }, [suppressInternalWatcher, engineLat, engineLng, location.lat, location.lng]);

  const stableOnAlertClick = useCallback((alert) => onAlertClickRef.current?.(alert), []);

  const updateCarPositionCb = useCallback((id, lng, lat) => {
    const map = mapRef.current;
    if (!map || !carsGeoJSONRef.current) return;
    carsGeoJSONRef.current = updateCarPosition(map, carsGeoJSONRef.current, id, lng, lat);
  }, []);

  const alertsStructureKey = useMemo(() => {
    if (!alerts || !Array.isArray(alerts)) return 'empty';
    const ids = alerts
      .map((a) => String(a?.id ?? a?.user_id ?? ''))
      .filter(Boolean)
      .sort()
      .join(',');
    return `${alerts.length}:${ids}`;
  }, [alerts]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || error) return;
    const geojson = alertsToGeoJSON(alerts);
    carsGeoJSONRef.current = geojson;
    applyStaticCarsLayer(mapRef.current, alerts, stableOnAlertClick, geojson);
    if (onCarsControllerReady) {
      onCarsControllerReady({ updateCarPosition: updateCarPositionCb });
    }
  }, [
    mapReady,
    error,
    alertsStructureKey,
    stableOnAlertClick,
    onCarsControllerReady,
    updateCarPositionCb,
  ]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || error) return;
    const userLoc =
      userCoordsForMarker && !useCenterPin
        ? { lat: userCoordsForMarker.lat, lng: userCoordsForMarker.lng }
        : null;
    applyUserLocationLayer(mapRef.current, userLoc);
  }, [mapReady, error, userCoordsForMarker, useCenterPin]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || error) return;
    applyWaitMeCarLayer(mapRef.current, waitMeCarBuyerLocation, waitMeCarMode, waitMeCarColor);
  }, [mapReady, error, waitMeCarMode, waitMeCarBuyerLocation, waitMeCarColor]);

  useEffect(() => {
    clearMarkers(markersRef);
  }, [mapReady, error]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || error || !useCenterPin) return;
    const padding =
      centerPaddingBottom > 0
        ? (getMapPadding() ?? { top: 56, bottom: 300, left: 0, right: 0 })
        : { top: 0, bottom: 0, left: 0, right: 0 };
    setMapPadding(mapRef.current, padding);
  }, [mapReady, error, useCenterPin, centerPaddingBottom, getMapPadding]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || error || centerPaddingBottom <= 0) return;
    applyRoadStyleForCreate(mapRef.current);
  }, [mapReady, error, centerPaddingBottom]);

  const onMapMoveRef = useRef(onMapMove);
  const onMapMoveEndRef = useRef(onMapMoveEnd);
  onMapMoveRef.current = onMapMove;
  onMapMoveEndRef.current = onMapMoveEnd;

  useEffect(() => {
    if (!mapReady || !mapRef.current || error || !useCenterPin) return;
    return attachMoveListeners(mapRef.current, {
      onMove: (c) => onMapMoveRef.current?.(c),
      onMoveEnd: (p) => onMapMoveEndRef.current?.(p),
    });
  }, [mapReady, error, useCenterPin]);

  const containerStyle = useMemo(
    () => ({
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      minHeight: '100dvh',
      minWidth: '100%',
      touchAction: interactive ? 'pan-x pan-y' : 'none',
    }),
    [interactive]
  );

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

export default memo(MapboxMapInner);
