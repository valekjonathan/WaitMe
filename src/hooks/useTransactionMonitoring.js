/**
 * Hook para monitoreo de transacción por proximidad.
 * Preparado para integración futura en CREATE y NAVIGATE.
 *
 * Uso futuro:
 * - CREATE: cuando el comprador va hacia el vendedor
 * - NAVIGATE: cuando ambos están en ruta y se acercan
 *
 * @param {Object} opts
 * @param {() => { lat: number, lng: number } | [number, number] | null} opts.getUserALocation — vendedor
 * @param {() => { lat: number, lng: number } | [number, number] | null} opts.getUserBLocation — comprador
 * @param {() => number|null} [opts.getUserAAccuracy]
 * @param {() => number|null} [opts.getUserBAccuracy]
 * @param {boolean} [opts.enabled=false] — activar monitoreo
 * @param {() => void} [opts.onArrived]
 * @param {() => void} [opts.onCompleted]
 */
import { useEffect, useRef } from 'react';
import { startTransactionMonitoring, stopTransactionMonitoring } from '@/lib/transaction';

export function useTransactionMonitoring(opts) {
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (!opts?.enabled) return;

    const o = optsRef.current;
    startTransactionMonitoring({
      getUserALocation: () => o?.getUserALocation?.(),
      getUserBLocation: () => o?.getUserBLocation?.(),
      getUserAAccuracy: () => o?.getUserAAccuracy?.(),
      getUserBAccuracy: () => o?.getUserBAccuracy?.(),
      onArrived: () => o?.onArrived?.(),
      onCompleted: () => o?.onCompleted?.(),
    });

    return () => stopTransactionMonitoring();
  }, [opts?.enabled]);
}
