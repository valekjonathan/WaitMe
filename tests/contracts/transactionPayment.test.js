/**
 * Tests de contrato para liberación de pago por proximidad.
 * Simula: 3m → liberado, 10m → rechazado, doble llamada → idempotente, accuracy 50m → bloqueado.
 *
 * Nota: estos tests mockean la API release-payment. Para tests E2E contra Supabase,
 * usar tests e2e con proyecto real.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMetersBetween } from '@/lib/location';
import { startTransactionMonitoring, stopTransactionMonitoring } from '@/lib/transaction';
import { clearLocationFraudLogs } from '@/lib/location/locationFraudLogs';
import { clearPositionHistory } from '@/lib/location';
import * as arrivalEngine from '@/lib/transaction/arrivalConfidenceEngine';

const POINT_A = [43.3619, -5.8494];

function pointAtDistanceMeters(from, distanceM) {
  const dLat = distanceM / 111320;
  return [from[0] + dLat, from[1]];
}

describe('transactionPayment', () => {
  beforeEach(() => {
    stopTransactionMonitoring();
    vi.useFakeTimers();
    clearLocationFraudLogs();
    clearPositionHistory();
    vi.spyOn(arrivalEngine, 'getArrivalConfidence').mockReturnValue({
      score: 90,
      invalid: false,
      details: {},
    });
    vi.spyOn(arrivalEngine, 'getRecentFraudFlags').mockReturnValue([]);
  });

  afterEach(() => {
    stopTransactionMonitoring();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('distancia 3m → onCompleted disparado (pago liberable)', () => {
    const pointB = pointAtDistanceMeters(POINT_A, 3);
    expect(getMetersBetween(POINT_A, pointB)).toBeLessThanOrEqual(6);

    const onCompleted = vi.fn();
    startTransactionMonitoring({
      getUserALocation: () => POINT_A,
      getUserBLocation: () => pointB,
      getUserAAccuracy: () => 10,
      getUserBAccuracy: () => 10,
      onCompleted,
    });

    vi.advanceTimersByTime(11000);
    expect(onCompleted).toHaveBeenCalledTimes(1);
    expect(onCompleted).toHaveBeenCalledWith(
      expect.objectContaining({
        distance: expect.any(Number),
      })
    );
    expect(onCompleted.mock.calls[0][0].distance).toBeLessThanOrEqual(6);
  });

  it('distancia 10m → onCompleted no disparado (pago rechazado)', () => {
    const pointB = pointAtDistanceMeters(POINT_A, 10);
    expect(getMetersBetween(POINT_A, pointB)).toBeGreaterThan(6);

    const onCompleted = vi.fn();
    startTransactionMonitoring({
      getUserALocation: () => POINT_A,
      getUserBLocation: () => pointB,
      onCompleted,
    });

    vi.advanceTimersByTime(15000);
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('doble llamada → idempotente (onCompleted solo una vez)', () => {
    const pointB = pointAtDistanceMeters(POINT_A, 3);
    const onCompleted = vi.fn();

    startTransactionMonitoring({
      getUserALocation: () => POINT_A,
      getUserBLocation: () => pointB,
      getUserAAccuracy: () => 10,
      getUserBAccuracy: () => 10,
      onCompleted,
    });

    vi.advanceTimersByTime(11000);
    expect(onCompleted).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(20000);
    expect(onCompleted).toHaveBeenCalledTimes(1);
  });

  it('accuracy 50m (>20m) → onCompleted no disparado (pago bloqueado)', () => {
    const pointB = pointAtDistanceMeters(POINT_A, 3);
    const onCompleted = vi.fn();

    startTransactionMonitoring({
      getUserALocation: () => POINT_A,
      getUserBLocation: () => pointB,
      getUserAAccuracy: () => 50,
      onCompleted,
    });

    vi.advanceTimersByTime(15000);
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('accuracy 50m en userB → onCompleted no disparado', () => {
    const pointB = pointAtDistanceMeters(POINT_A, 3);
    const onCompleted = vi.fn();

    startTransactionMonitoring({
      getUserALocation: () => POINT_A,
      getUserBLocation: () => pointB,
      getUserBAccuracy: () => 50,
      onCompleted,
    });

    vi.advanceTimersByTime(15000);
    expect(onCompleted).not.toHaveBeenCalled();
  });
});
