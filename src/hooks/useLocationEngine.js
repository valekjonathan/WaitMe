/**
 * Hook para consumir el motor de ubicación de WaitMe.
 * Devuelve ubicación actual y helpers.
 */
import { useState, useEffect, useCallback } from 'react';
import { subscribeToLocation, getLastKnownLocation, getCurrentLocation } from '@/lib/location';

/**
 * @returns {{ location: [number, number]|null, getCurrent: () => Promise<{lat:number,lng:number}> }}
 */
export function useLocationEngine() {
  const [location, setLocation] = useState(() => {
    const last = getLastKnownLocation();
    return last ? [last.lat, last.lng] : null;
  });

  useEffect(() => {
    return subscribeToLocation((loc) => {
      setLocation([loc.lat, loc.lng]);
    });
  }, []);

  const getCurrent = useCallback(async () => {
    const loc = await getCurrentLocation();
    return { lat: loc.lat, lng: loc.lng };
  }, []);

  return { location, getCurrent };
}
