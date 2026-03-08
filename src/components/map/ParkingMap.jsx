import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  addStaticCarsLayer,
  addUserLocationLayer,
  addSellerLocationLayer,
  addSelectedPositionLayer,
  addWaitMeCarLayer,
} from '@/lib/mapLayers';
import {
  getCarsMovementMode,
  CARS_MOVEMENT_MODE,
  subscribeToCarsMovementMode,
} from '@/stores/carsMovementStore';
import { useVehicleInterpolation } from '@/hooks/useVehicleInterpolation';

export default function ParkingMap({
  alerts = [],
  onAlertClick,
  isSelecting = false,
  selectedPosition,
  setSelectedPosition,
  userLocation,
  selectedAlert,
  showRoute = false,
  sellerLocation,
  className = '',
  zoomControl = true,
  buyerLocations = [],
  userLocationOffsetY: _userLocationOffsetY = 0,
  useCenterPin = false,
  sellerPhotoHtml: _sellerPhotoHtml = null,
  onMapMove,
  onMapMoveEnd,
  userAsCar: _userAsCar = false,
  userCarColor: _userCarColor = 'gris',
  userCarPrice: _userCarPrice = 0,
  showSellerMarker = false,
  onRouteLoaded = null,
  userPhotoHtml: _userPhotoHtml = null,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [carsMode, setCarsMode] = useState(getCarsMovementMode);

  const normalizedUserLocation = userLocation
    ? Array.isArray(userLocation)
      ? userLocation
      : [userLocation.latitude ?? userLocation.lat, userLocation.longitude ?? userLocation.lng]
    : null;

  const defaultCenter = normalizedUserLocation || [43.3619, -5.8494];
  const [route, setRoute] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [, setRouteDistance] = useState(null);
  const [, setRouteDuration] = useState(null);
  const lastRouteFetchRef = useRef(0);
  const ROUTE_REFETCH_MS = 8000;

  useEffect(() => {
    if (!showRoute || !normalizedUserLocation) {
      setRoute(null);
      setRouteDistance(null);
      setRouteDuration(null);
      return;
    }
    const targetLocation =
      sellerLocation || (selectedAlert ? [selectedAlert.latitude, selectedAlert.longitude] : null);
    if (!targetLocation) {
      setRoute(null);
      return;
    }
    const now = Date.now();
    if (lastRouteFetchRef.current > 0 && now - lastRouteFetchRef.current < ROUTE_REFETCH_MS) return;
    lastRouteFetchRef.current = now;

    const start = { lat: normalizedUserLocation[0], lng: normalizedUserLocation[1] };
    const end = { lat: targetLocation[0], lng: targetLocation[1] };

    fetch(
      `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.routes?.[0]) {
          const r = data.routes[0];
          const coords = r.geometry.coordinates.map((c) => [c[1], c[0]]);
          setRoute(coords);
          setRouteDistance((r.distance / 1000).toFixed(2));
          setRouteDuration(r.duration || 0);
          if (onRouteLoaded)
            onRouteLoaded({ distanceKm: r.distance / 1000, durationSec: r.duration || 0 });
        }
      })
      .catch((error) => {
        console.error('[WaitMe Error]', error);
      });
  }, [showRoute, selectedAlert, sellerLocation, normalizedUserLocation, onRouteLoaded]);

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token || token === 'PEGA_AQUI_EL_TOKEN' || !containerRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [defaultCenter[1], defaultCenter[0]],
      zoom: 16,
      pitch: 45,
      bearing: 0,
      antialias: true,
      attributionControl: false,
    });

    if (zoomControl) {
      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-left');
    }

    map.on('load', () => {
      mapRef.current = map;
      map.resize();
      setMapReady(true);
    });

    return () => {
      setMapReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    return subscribeToCarsMovementMode(setCarsMode);
  }, []);

  const userLocForLayer =
    normalizedUserLocation && !useCenterPin
      ? { lat: normalizedUserLocation[0], lng: normalizedUserLocation[1] }
      : null;

  const rawBuyerLoc =
    carsMode === CARS_MOVEMENT_MODE.WAITME_ACTIVE && buyerLocations?.length > 0
      ? {
          lat: buyerLocations[0].latitude ?? buyerLocations[0].lat,
          lng: buyerLocations[0].longitude ?? buyerLocations[0].lng,
        }
      : null;
  const buyerLocForLayer = useVehicleInterpolation(rawBuyerLoc);

  const sellerLocForLayer =
    sellerLocation && (showRoute || showSellerMarker)
      ? Array.isArray(sellerLocation)
        ? { lat: sellerLocation[0], lng: sellerLocation[1] }
        : {
            lat: sellerLocation.lat ?? sellerLocation.latitude,
            lng: sellerLocation.lng ?? sellerLocation.longitude,
          }
      : null;

  const selectedPosForLayer =
    isSelecting && selectedPosition && selectedPosition.lat !== normalizedUserLocation?.[0]
      ? selectedPosition
      : null;

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !map.isStyleLoaded?.()) return;
    addStaticCarsLayer(map, alerts, onAlertClick);
  }, [mapReady, alerts, onAlertClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !map.isStyleLoaded?.()) return;
    addUserLocationLayer(map, userLocForLayer);
  }, [mapReady, userLocForLayer]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !map.isStyleLoaded?.()) return;
    addWaitMeCarLayer(map, buyerLocForLayer, carsMode, 'azul');
  }, [mapReady, buyerLocForLayer, carsMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !map.isStyleLoaded?.()) return;
    addSellerLocationLayer(map, sellerLocForLayer);
  }, [mapReady, sellerLocForLayer]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !map.isStyleLoaded?.()) return;
    addSelectedPositionLayer(map, selectedPosForLayer);
  }, [mapReady, selectedPosForLayer]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded?.()) return;

    if (route && route.length > 0) {
      const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: route.map(([lat, lng]) => [lng, lat]),
        },
      };
      if (map.getSource('route')) {
        map.getSource('route').setData(geojson);
      } else {
        map.addSource('route', { type: 'geojson', data: geojson });
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#a855f7', 'line-width': 5, 'line-opacity': 0.9 },
        });
      }
    } else if (map.getSource('route')) {
      map.removeLayer('route');
      map.removeSource('route');
    }
  }, [route]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded?.()) return;

    if (normalizedUserLocation) {
      map.flyTo({
        center: [normalizedUserLocation[1], normalizedUserLocation[0]],
        zoom: 16,
        duration: 500,
      });
    }
  }, [normalizedUserLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded?.()) return;

    if (isSelecting && setSelectedPosition) {
      const onClick = (e) => {
        setSelectedPosition({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      };
      map.on('click', onClick);
      return () => map.off('click', onClick);
    }
  }, [isSelecting, setSelectedPosition]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded?.()) return;

    if (useCenterPin) {
      const onMove = () => {
        const c = map.getCenter();
        onMapMove?.([c.lat, c.lng]);
      };
      const onMoveEnd = () => {
        const c = map.getCenter();
        onMapMoveEnd?.([c.lat, c.lng]);
      };
      map.on('move', onMove);
      map.on('moveend', onMoveEnd);
      return () => {
        map.off('move', onMove);
        map.off('moveend', onMoveEnd);
      };
    }
  }, [useCenterPin, onMapMove, onMapMoveEnd]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded?.()) return;

    if (showRoute && normalizedUserLocation && sellerLocation) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([normalizedUserLocation[1], normalizedUserLocation[0]]);
      bounds.extend([sellerLocation[1], sellerLocation[0]]);
      map.fitBounds(bounds, { padding: 50, maxZoom: 17, duration: 500 });
    }
  }, [showRoute, normalizedUserLocation, sellerLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded?.()) return;

    const t = setTimeout(() => map?.resize?.(), 150);
    return () => clearTimeout(t);
  }, []);

  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  if (!token || token === 'PEGA_AQUI_EL_TOKEN') {
    return (
      <div
        className={`absolute inset-0 flex items-center justify-center bg-[#1a1a1a] text-gray-500 text-sm ${className}`}
      >
        Configura VITE_MAPBOX_TOKEN en .env
      </div>
    );
  }

  return (
    <div
      className={`absolute inset-0 ${className}`}
      style={{ zIndex: 1000, transform: 'translateZ(0)' }}
    >
      {useCenterPin && (
        <div
          className="absolute z-[2000] pointer-events-none flex flex-col items-center"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, calc(-100% - 10px))',
            width: 18,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#a855f7',
              boxShadow: '0 0 15px rgba(168,85,247,0.8)',
              animation: 'pin-pulse 1.5s ease-in-out infinite',
            }}
          />
          <div style={{ width: 2, height: 35, background: '#a855f7' }} />
        </div>
      )}
      <style>{`
        @keyframes pin-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.15); }
        }
        @keyframes pulse-purple {
          0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.7; transform: translateX(-50%) scale(1.1); }
        }
      `}</style>
      <div ref={containerRef} className="w-full h-full rounded-2xl" />
    </div>
  );
}
