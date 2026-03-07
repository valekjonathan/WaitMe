/**
 * Inicia el motor de ubicación cuando el usuario está logueado.
 * Se desmonta al cerrar sesión; hace cleanup correcto.
 */
import { useEffect } from 'react';
import { startLocationEngine, stopLocationEngine } from '@/lib/location';

export default function LocationEngineStarter() {
  useEffect(() => {
    startLocationEngine({ pipeline: true });
    return () => stopLocationEngine();
  }, []);
  return null;
}
