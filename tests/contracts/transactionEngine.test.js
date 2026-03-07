/**
 * Tests del motor de transacción por proximidad.
 * Valida: llegada ≤5m, estabilidad 8s, cancelación >7m, accuracy.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getMetersBetween } from '@/lib/location';
import { startTransactionMonitoring, stopTransactionMonitoring } from '@/lib/transaction';

const POINT_A = [43.3619, -5.8494];

function pointAtDistanceMeters(from, distanceM) {
  const dLat = distanceM / 111320;
  return [from[0] + dLat, from[1]];
}

describe('transactionEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    stopTransactionMonitoring();
    vi.useRealTimers();
  });

  it('distancia 3m → onArrived llamado', () => {
    const pointB = pointAtDistanceMeters(POINT_A, 3);
    expect(getMetersBetween(POINT_A, pointB)).toBeLessThanOrEqual(5);

    const onArrived = vi.fn();
    const onCompleted = vi.fn();

    startTransactionMonitoring({
      getUserALocation: () => POINT_A,
      getUserBLocation: () => pointB,
      onArrived,
      onCompleted,
    });

    vi.advanceTimersByTime(1000);
    expect(onArrived).toHaveBeenCalled();
  });

  it('distancia 10m → no llegada', () => {
    const pointB = pointAtDistanceMeters(POINT_A, 10);
    expect(getMetersBetween(POINT_A, pointB)).toBeGreaterThan(5);

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

  it('distancia 3m durante 8s → onCompleted', () => {
    const pointB = pointAtDistanceMeters(POINT_A, 3);
    const onArrived = vi.fn();
    const onCompleted = vi.fn();

    startTransactionMonitoring({
      getUserALocation: () => POINT_A,
      getUserBLocation: () => pointB,
      onArrived,
      onCompleted,
    });

    vi.advanceTimersByTime(9000);
    expect(onArrived).toHaveBeenCalled();
    expect(onCompleted).toHaveBeenCalled();
  });

  it('distancia 3m durante 4s → no onCompleted', () => {
    const pointB = pointAtDistanceMeters(POINT_A, 3);
    const onArrived = vi.fn();
    const onCompleted = vi.fn();

    startTransactionMonitoring({
      getUserALocation: () => POINT_A,
      getUserBLocation: () => pointB,
      onArrived,
      onCompleted,
    });

    vi.advanceTimersByTime(4000);
    expect(onArrived).toHaveBeenCalled();
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('distancia vuelve a >7m → reset timer, no completed', () => {
    let usePointB = pointAtDistanceMeters(POINT_A, 3);
    const onCompleted = vi.fn();

    startTransactionMonitoring({
      getUserALocation: () => POINT_A,
      getUserBLocation: () => usePointB,
      onCompleted,
    });

    vi.advanceTimersByTime(4000);
    usePointB = pointAtDistanceMeters(POINT_A, 10);
    vi.advanceTimersByTime(500);
    usePointB = pointAtDistanceMeters(POINT_A, 3);
    vi.advanceTimersByTime(4000);
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('accuracy > 30m → no activar', () => {
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

  it('stopTransactionMonitoring limpia', () => {
    const pointB = pointAtDistanceMeters(POINT_A, 3);
    const onCompleted = vi.fn();

    startTransactionMonitoring({
      getUserALocation: () => POINT_A,
      getUserBLocation: () => pointB,
      onCompleted,
    });

    vi.advanceTimersByTime(4000);
    stopTransactionMonitoring();
    vi.advanceTimersByTime(10000);
    expect(onCompleted).not.toHaveBeenCalled();
  });
});
