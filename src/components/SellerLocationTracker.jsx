import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as alerts from '@/data/alerts';
import * as userLocations from '@/data/userLocations';
import { motion } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

function createUserMarkerHtml() {
  return `
    <div style="position:relative;width:40px;height:60px;">
      <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:2px;height:35px;background:#a855f7;"></div>
      <div style="position:absolute;bottom:30px;left:50%;transform:translateX(-50%);width:18px;height:18px;background:#a855f7;border-radius:50%;box-shadow:0 0 15px rgba(168,85,247,0.8);animation:pulse-purple 1.5s ease-in-out infinite;"></div>
    </div>
  `;
}

function createBuyerMarkerHtml() {
  return `
    <div style="width:40px;height:40px;background:linear-gradient(135deg,#3b82f6,#2563eb);border:3px solid white;border-radius:50%;box-shadow:0 4px 12px rgba(59,130,246,0.6);display:flex;align-items:center;justify-content:center;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 19h20L12 2z"/></svg>
    </div>
  `;
}

export default function SellerLocationTracker({ alertId, userLocation }) {
  const [alert, setAlert] = useState(null);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!alertId) return;
    let cancelled = false;
    alerts.getAlert(alertId).then(({ data }) => {
      if (!cancelled && data) setAlert(data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [alertId]);

  const { data: buyerLocations = [] } = useQuery({
    queryKey: ['buyerLocations', alertId],
    queryFn: async () => {
      return await userLocations.getLocationsByAlert(alertId);
    },
    enabled: !!alertId,
    refetchInterval: 5000,
  });

  const calculateDistance = useCallback((buyerLoc) => {
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
  }, [userLocation]);

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
    });
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m?.remove?.());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [alert?.id]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded?.() || !alert) return;

    markersRef.current.forEach((m) => m?.remove?.());
    markersRef.current = [];

    const addMarker = (lngLat, html) => {
      const el = document.createElement('div');
      el.innerHTML = html;
      const marker = new mapboxgl.Marker({ element: el.firstElementChild || el })
        .setLngLat([lngLat[1], lngLat[0]])
        .addTo(map);
      markersRef.current.push(marker);
    };

    if (userLocation) addMarker(userLocation, createUserMarkerHtml());
    buyerLocations.forEach((loc) => addMarker([loc.latitude, loc.longitude], createBuyerMarkerHtml()));
  }, [alert, userLocation, buyerLocations]);

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
