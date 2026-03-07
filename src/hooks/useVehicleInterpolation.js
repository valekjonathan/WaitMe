/**
 * Interpolación suave tipo Uber para posición de coches en el mapa.
 * Evita saltos bruscos cuando llegan actualizaciones del backend.
 *
 * Flujo: targetPosition (backend) → interpolación RAF → currentPosition (mapa)
 * @module useVehicleInterpolation
 */

import { useEffect, useRef, useState } from 'react';

function lerp(a, b, t) {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

const DEFAULT_DURATION_MS = 500;

/**
 * @param {{ lat: number, lng: number } | [number, number] | null} targetPosition
 * @param {number} [durationMs]
 * @returns {{ lat: number, lng: number } | null}
 */
export function useVehicleInterpolation(targetPosition, durationMs = DEFAULT_DURATION_MS) {
  const [current, setCurrent] = useState(null);
  const currentRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!targetPosition) {
      setCurrent(null);
      currentRef.current = null;
      return;
    }

    const lat = Array.isArray(targetPosition)
      ? targetPosition[0]
      : (targetPosition?.lat ?? targetPosition?.latitude);
    const lng = Array.isArray(targetPosition)
      ? targetPosition[1]
      : (targetPosition?.lng ?? targetPosition?.longitude);

    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    const newTarget = { lat, lng };
    const prev = currentRef.current;

    if (!prev) {
      currentRef.current = newTarget;
      setCurrent(newTarget);
      return;
    }

    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / durationMs);

      const interpLat = lerp(prev.lat, newTarget.lat, t);
      const interpLng = lerp(prev.lng, newTarget.lng, t);

      const next = { lat: interpLat, lng: interpLng };
      currentRef.current = next;
      setCurrent(next);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [
    targetPosition?.lat ?? targetPosition?.[0],
    targetPosition?.lng ?? targetPosition?.[1],
    durationMs,
  ]);

  return current;
}
