/**
 * Hook para monitoreo de transacción por proximidad.
 * Cuando onCompleted se dispara (≤5m durante 8s), llama a POST /api/transactions/release-payment.
 *
 * @param {Object} opts
 * @param {() => { lat: number, lng: number } | [number, number] | null} opts.getUserALocation — vendedor
 * @param {() => { lat: number, lng: number } | [number, number] | null} opts.getUserBLocation — comprador
 * @param {() => number|null} [opts.getUserAAccuracy]
 * @param {() => number|null} [opts.getUserBAccuracy]
 * @param {boolean} [opts.enabled=false] — activar monitoreo
 * @param {string} [opts.alertId]
 * @param {string} [opts.userAId] — vendedor
 * @param {string} [opts.userBId] — comprador
 * @param {() => void} [opts.onArrived]
 * @param {(ctx?: { distance: number, accuracyA?: number, accuracyB?: number }) => void} [opts.onCompleted]
 */
import { useEffect, useRef } from 'react';
import { startTransactionMonitoring, stopTransactionMonitoring } from '@/lib/transaction';
import * as transactionsApi from '@/services/transactionsSupabase';
import { logProximityEvent } from '@/lib/transaction/transactionLogger';

export function useTransactionMonitoring(opts) {
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (!opts?.enabled) return;

    const o = optsRef.current;
    const handleCompleted = async (ctx) => {
      const { distance = 0, accuracyA, accuracyB } = ctx ?? {};
      logProximityEvent({
        userAId: o?.userAId,
        userBId: o?.userBId,
        alertId: o?.alertId,
        distance,
        accuracyUserA: accuracyA,
        accuracyUserB: accuracyB,
        state: 'COMPLETED',
      });
      o?.onCompleted?.(ctx);

      if (o?.alertId && o?.userAId && o?.userBId) {
        const idempotencyKey = `release-${o.alertId}-${o.userBId}`;
        const { data, error } = await transactionsApi.releasePayment({
          alertId: o.alertId,
          userAId: o.userAId,
          userBId: o.userBId,
          distance,
          timestamp: Date.now(),
          idempotencyKey,
          accuracyUserA: accuracyA,
          accuracyUserB: accuracyB,
        });
        if (error) {
          logProximityEvent({
            userAId: o.userAId,
            userBId: o.userBId,
            alertId: o.alertId,
            distance,
            state: 'RELEASE_ERROR',
          });
          if (import.meta.env.DEV)
            console.warn('[useTransactionMonitoring] releasePayment error', error);
        } else if (data?.ok) {
          logProximityEvent({
            userAId: o.userAId,
            userBId: o.userBId,
            alertId: o.alertId,
            distance,
            state: 'RELEASED',
          });
        }
      }
    };

    startTransactionMonitoring({
      getUserALocation: () => o?.getUserALocation?.(),
      getUserBLocation: () => o?.getUserBLocation?.(),
      getUserAAccuracy: () => o?.getUserAAccuracy?.(),
      getUserBAccuracy: () => o?.getUserBAccuracy?.(),
      onArrived: () => o?.onArrived?.(),
      onCompleted: handleCompleted,
    });

    return () => stopTransactionMonitoring();
  }, [opts?.enabled]);
}
