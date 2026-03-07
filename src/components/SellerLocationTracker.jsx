import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as alerts from '@/data/alerts';
import * as userLocations from '@/data/userLocations';
import { motion } from 'framer-motion';
import {
  getCarsMovementMode,
  CARS_MOVEMENT_MODE,
  subscribeToCarsMovementMode,
} from '@/stores/carsMovementStore';
import { useVehicleInterpolation } from '@/hooks/useVehicleInterpolation';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { addUserLocationLayer, addWaitMeCarLayer } from '@/lib/mapLayers';

export default function SellerLocationTracker({ alertId, userLocation }) {
  const [alert, setAlert] = useState(null);
  const [carsMode, setCarsMode] = useState(getCarsMovementMode);
  const [mapReady, setMapReady] = useState(false);
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    return subscribeToCarsMovementMode(setCarsMode);
  }, []);

  useEffect(() => {
    if (!alertId) return;
    let cancelled = false;
    alerts
      .getAlert(alertId)
      .then(({ data }) => {
        if (!cancelled && data) setAlert(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [alertId]);

  const { data: buyerLocationsRaw = [] } = useQuery({
    queryKey: ['buyerLocations', alertId],
    queryFn: async () => {
      return await userLocations.getLocationsByAlert(alertId);
    },
    enabled: !!alertId && carsMode === CARS_MOVEMENT_MODE.WAITME_ACTIVE,
    refetchInterval: carsMode === CARS_MOVEMENT_MODE.WAITME_ACTIVE ? 5000 : false,
  });
  const buyerLocations = carsMode === CARS_MOVEMENT_MODE.WAITME_ACTIVE ? buyerLocationsRaw : [];

  const calculateDistance = useCallback(
    (buyerLoc) => {
      if (!userLocation) return null;
      const R = 6371;
      const dLat = ((buyerLoc.latitude - userLocation[0]) * Math.PI) / 180;
      const dLon = ((buyerLoc.longitude - userLocation[1]) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLocation[0] * Math.PI) / 180) *
          Math.cos((buyerLoc.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = R * c;
      if (distanceKm < 1) return { value: Math.round(distanceKm * 1000), unit: 'm' };
      return { value: distanceKm.toFixed(1), unit: 'km' };
    },
    [userLocation]
  );

  const closestBuyer = buyerLocations.length > 0 ? buyerLocations[0] : null;
  const distance = closestBuyer ? calculateDistance(closestBuyer) : null;

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token || token === 'PEGA_AQUI_EL_TOKEN' || !containerRef.current || !alert) return;

    mapboxgl.accessToken = token;
    const center = userLocation || [alert.latitude, alert.longitude];
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [center[1], center[0]],
      zoom: 16,
      pitch: 45,
      bearing: 0,
      attributionControl: false,
    });

    map.on('load', () => {
      mapRef.current = map;
      map.resize();
      setMapReady(true);
    });
    mapRef.current = map;

    return () => {
      setMapReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, [alert?.id]);

  const userLocForLayer = userLocation ? { lat: userLocation[0], lng: userLocation[1] } : null;

  const rawBuyerLoc =
    carsMode === CARS_MOVEMENT_MODE.WAITME_ACTIVE && buyerLocations?.length > 0
      ? {
          lat: buyerLocations[0].latitude ?? buyerLocations[0].lat,
          lng: buyerLocations[0].longitude ?? buyerLocations[0].lng,
        }
      : null;
  const buyerLocForLayer = useVehicleInterpolation(rawBuyerLoc);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !map.isStyleLoaded?.() || !alert) return;
    addUserLocationLayer(map, userLocForLayer);
  }, [mapReady, alert, userLocForLayer]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !map.isStyleLoaded?.() || !alert) return;
    addWaitMeCarLayer(map, buyerLocForLayer, carsMode, 'azul');
  }, [mapReady, alert, buyerLocForLayer, carsMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded?.()) return;
    const center = userLocation || (alert ? [alert.latitude, alert.longitude] : null);
    if (center) map.flyTo({ center: [center[1], center[0]], zoom: 16, duration: 500 });
  }, [userLocation, alert]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const t = setTimeout(() => map.resize(), 150);
    return () => clearTimeout(t);
  }, [buyerLocations]);

  if (!alert || buyerLocations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-24 left-4 right-4 z-40 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 border-2 border-blue-500 shadow-2xl"
    >
      <div className="mb-2">
        <p className="text-white font-bold text-lg">¡El comprador viene hacia ti!</p>
        {distance && (
          <p className="text-blue-100 text-sm">
            Está a {distance.value}
            {distance.unit} de distancia
          </p>
        )}
      </div>

      <div className="h-48 rounded-xl overflow-hidden border-2 border-white/30 relative">
        <style>{`
          @keyframes pulse-purple {
            0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
            50% { opacity: 0.7; transform: translateX(-50%) scale(1.1); }
          }
        `}</style>
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </motion.div>
  );
}
