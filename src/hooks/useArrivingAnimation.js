/**
 * Hook para simular el movimiento del coche hacia el usuario en modo arriving.
 * Actualiza posición y métricas en tiempo real.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { haversineMeters } from '@/utils/carUtils';

const SPEED_M_PER_MS = 0.04; // ~40 m/s simulado para que 200m ≈ 5s

export function useArrivingAnimation(alert, userLocation, isActive) {
  const [position, setPosition] = useState(null);
  const [metrics, setMetrics] = useState({ distanceMeters: 0, etaMinutes: 0 });
  const startRef = useRef(null);
  const rafRef = useRef(null);

  const userLat = Array.isArray(userLocation)
    ? userLocation[0]
    : (userLocation?.lat ?? userLocation?.latitude);
  const userLng = Array.isArray(userLocation)
    ? userLocation[1]
    : (userLocation?.lng ?? userLocation?.longitude);

  const startPosition = alert
    ? { lat: alert.latitude ?? alert.lat, lng: alert.longitude ?? alert.lng }
    : null;

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isActive || !alert || !startPosition || userLat == null || userLng == null) {
      setPosition(null);
      setMetrics({ distanceMeters: 0, etaMinutes: 0 });
      stop();
      return;
    }

    startRef.current = Date.now();

    const totalDist = haversineMeters(startPosition.lat, startPosition.lng, userLat, userLng);

    const tick = () => {
      const now = Date.now();
      const elapsed = now - startRef.current;
      const distMoved = SPEED_M_PER_MS * elapsed;
      const progress = totalDist > 0 ? Math.min(1, distMoved / totalDist) : 1;

      const newLat = startPosition.lat + progress * (userLat - startPosition.lat);
      const newLng = startPosition.lng + progress * (userLng - startPosition.lng);
      const newDistToUser = haversineMeters(newLat, newLng, userLat, userLng);

      if (newDistToUser < 5 || progress >= 1) {
        setPosition({ lat: userLat, lng: userLng });
        setMetrics({ distanceMeters: 0, etaMinutes: 0 });
        stop();
        return;
      }

      const etaSeconds = newDistToUser / (SPEED_M_PER_MS * 1000);
      const etaMinutes = etaSeconds / 60;

      setPosition({ lat: newLat, lng: newLng });
      setMetrics({
        distanceMeters: Math.round(newDistToUser),
        etaMinutes: Math.max(0, Math.ceil(etaMinutes * 2) / 2),
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return stop;
  }, [isActive, alert?.id, startPosition?.lat, startPosition?.lng, userLat, userLng]);

  useEffect(() => {
    return stop;
  }, [stop]);

  return { position, metrics };
}
