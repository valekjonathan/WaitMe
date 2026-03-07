/**
 * Tests del motor de transacción por proximidad.
 * Valida: llegada ≤6m, estabilidad 10s, cancelación >8m, accuracy ≤20m.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

describe('transactionEngine', () => {
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

  it('distancia 3m → onArrived llamado', () => {
    const pointB = pointAtDistanceMeters(POINT_A, 3);
    expect(getMetersBetween(POINT_A, pointB)).toBeLessThanOrEqual(6);

    const onArrived = vi.fn();
    const onCompleted = vi.fn();

    startTransactionMonitoring({
      getUserALocation: () => POINT_A,
      getUserBLocation: () => pointB,
      getUserAAccuracy: () => 10,
      getUserBAccuracy: () => 10,
      onArrived,
      onCompleted,
    });

    vi.advanceTimersByTime(1000);
    expect(onArrived).toHaveBeenCalled();
  });

  it('distancia 10m → no llegada', () => {
    const pointB = pointAtDistanceMeters(POINT_A, 10);
    expect(getMetersBetween(POINT_A, pointB)).toBeGreaterThan(6);

    const onArrived = vi.fn();
    const onCompleted = vi.fn();

    startTransactionMonitoring({
      getUserALocation: () => POINT_A,
      getUserBLocation: () => pointB,
      onArrived,
      onCompleted,
    });

    vi.advanceTimersByTime(10000);
    expect(onArrived).not.toHaveBeenCalled();
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('distancia 3m durante 10s → onCompleted', () => {
    const pointB = pointAtDistanceMeters(POINT_A, 3);
    const onArrived = vi.fn();
    const onCompleted = vi.fn();

    startTransactionMonitoring({
      getUserALocation: () => POINT_A,
      getUserBLocation: () => pointB,
      getUserAAccuracy: () => 10,
      getUserBAccuracy: () => 10,
      onArrived,
      onCompleted,
    });

    vi.advanceTimersByTime(11000);
    expect(onArrived).toHaveBeenCalled();
    expect(onCompleted).toHaveBeenCalled();
  });

  it('distancia 3m durante 5s → no onCompleted', () => {
    const pointB = pointAtDistanceMeters(POINT_A, 3);
    const onArrived = vi.fn();
    const onCompleted = vi.fn();

    startTransactionMonitoring({
      getUserALocation: () => POINT_A,
      getUserBLocation: () => pointB,
      getUserAAccuracy: () => 10,
      getUserBAccuracy: () => 10,
      onArrived,
      onCompleted,
    });

    vi.advanceTimersByTime(5000);
    expect(onArrived).toHaveBeenCalled();
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('distancia vuelve a >8m → reset timer, no completed', () => {
    let usePointB = pointAtDistanceMeters(POINT_A, 3);
    const onCompleted = vi.fn();

    startTransactionMonitoring({
      getUserALocation: () => POINT_A,
      getUserBLocation: () => usePointB,
      getUserAAccuracy: () => 10,
      getUserBAccuracy: () => 10,
      onCompleted,
    });

    vi.advanceTimersByTime(5000);
    usePointB = pointAtDistanceMeters(POINT_A, 10);
    vi.advanceTimersByTime(500);
    usePointB = pointAtDistanceMeters(POINT_A, 3);
    vi.advanceTimersByTime(5000);
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('accuracy > 20m → no activar', () => {
    const pointB = pointAtDistanceMeters(POINT_A, 3);
    const onArrived = vi.fn();

    startTransactionMonitoring({
      getUserALocation: () => POINT_A,
      getUserBLocation: () => pointB,
      getUserAAccuracy: () => 50,
      onArrived,
    });

    vi.advanceTimersByTime(10000);
    expect(onArrived).not.toHaveBeenCalled();
  });

  it('speed > 3kmh → no onCompleted', () => {
    const pointB = pointAtDistanceMeters(POINT_A, 3);
    const onCompleted = vi.fn();

    startTransactionMonitoring({
      getUserALocation: () => POINT_A,
      getUserBLocation: () => pointB,
      getUserBSpeed: () => 10,
      onCompleted,
    });

    vi.advanceTimersByTime(15000);
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('verificación doble: userB lejos de alertLocation → no onCompleted', () => {
    const _alertLoc = POINT_A;
    const userA = POINT_A;
    const userB = pointAtDistanceMeters(POINT_A, 4);
    const alertFar = pointAtDistanceMeters(POINT_A, 50);

    const onCompleted = vi.fn();
    startTransactionMonitoring({
      getUserALocation: () => userA,
      getUserBLocation: () => userB,
      getAlertLocation: () => alertFar,
      onCompleted,
    });

    vi.advanceTimersByTime(15000);
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('stopTransactionMonitoring limpia', () => {
    const pointB = pointAtDistanceMeters(POINT_A, 3);
    const onCompleted = vi.fn();

    startTransactionMonitoring({
      getUserALocation: () => POINT_A,
      getUserBLocation: () => pointB,
      getUserAAccuracy: () => 10,
      getUserBAccuracy: () => 10,
      onCompleted,
    });

    vi.advanceTimersByTime(5000);
    stopTransactionMonitoring();
    vi.advanceTimersByTime(10000);
    expect(onCompleted).not.toHaveBeenCalled();
  });
});
