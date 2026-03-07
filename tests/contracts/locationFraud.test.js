/**
 * Tests de contrato para detector de fraude de ubicación.
 * Probar: teleport → detectado, speed 200kmh → detectado, movimiento normal → permitido, proximidad real → permitido.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  checkLocationFraud,
  clearPositionHistory,
} from '@/lib/location/locationFraudDetector.js';
import { validateMovement } from '@/lib/location/locationMovementValidator.js';
import { getLocationFraudLogs, clearLocationFraudLogs } from '@/lib/location/locationFraudLogs.js';

const POINT = [43.3619, -5.8494];

function pointAtDistanceMeters(from, distanceM) {
  const dLat = distanceM / 111320;
  return [from[0] + dLat, from[1]];
}

describe('locationFraud', () => {
  beforeEach(() => {
    clearPositionHistory();
    clearLocationFraudLogs();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('teleport >200m en <2s → detectado', () => {
    const near = POINT;
    const far = pointAtDistanceMeters(POINT, 250);

    checkLocationFraud(near, { timestamp: 1000 });
    vi.advanceTimersByTime(1000);
    const result = checkLocationFraud(far, { timestamp: 2000 });

    expect(result.fraud).toBe(true);
    expect(result.reason).toBe('teleport');
    expect(result.distanceJump).toBeGreaterThan(200);

    const logs = getLocationFraudLogs();
    expect(logs.some((l) => l.reason === 'teleport')).toBe(true);
  });

  it('speed 200kmh → detectado', () => {
    const speedMps = (200 * 1000) / 3600;
    const result = checkLocationFraud(POINT, {
      speed: speedMps,
      accuracy: 10,
    });

    expect(result.fraud).toBe(true);
    expect(result.reason).toBe('speed_impossible');

    const logs = getLocationFraudLogs();
    expect(logs.some((l) => l.reason === 'speed_impossible')).toBe(true);
  });

  it('movimiento normal → permitido', () => {
    const a = POINT;
    const b = pointAtDistanceMeters(POINT, 5);
    const c = pointAtDistanceMeters(POINT, 10);

    const r1 = checkLocationFraud(a, { timestamp: 1000 });
    vi.advanceTimersByTime(1000);
    const r2 = checkLocationFraud(b, { timestamp: 2000 });
    vi.advanceTimersByTime(1000);
    const r3 = checkLocationFraud(c, { timestamp: 3000 });

    expect(r1.fraud).toBe(false);
    expect(r2.fraud).toBe(false);
    expect(r3.fraud).toBe(false);
  });

  it('validateMovement: teleport rechazado', () => {
    const prev = POINT;
    const current = pointAtDistanceMeters(POINT, 300);

    const result = validateMovement(prev, current, {
      timestamp: 2000,
      prevTimestamp: 1000,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('teleport');
  });

  it('validateMovement: velocidad imposible rechazada', () => {
    const prev = POINT;
    const current = pointAtDistanceMeters(POINT, 100);
    const dtSec = 1000 / 1000;

    const result = validateMovement(prev, current, {
      timestamp: 2000,
      prevTimestamp: 1000,
    });

    const distance = 100;
    const impliedSpeedKmh = (distance / dtSec) * 3.6;
    if (impliedSpeedKmh > 150) {
      expect(result.valid).toBe(false);
    }
  });

  it('validateMovement: movimiento normal permitido', () => {
    const prev = POINT;
    const current = pointAtDistanceMeters(POINT, 20);

    const result = validateMovement(prev, current, {
      timestamp: 2000,
      prevTimestamp: 1000,
    });

    expect(result.valid).toBe(true);
  });

  it('proximidad real (5m) → permitido', () => {
    const a = POINT;
    const b = pointAtDistanceMeters(POINT, 5);

    checkLocationFraud(a, { timestamp: 1000 });
    const result = checkLocationFraud(b, {
      timestamp: 2000,
      accuracy: 10,
    });

    expect(result.fraud).toBe(false);
  });

  it('gps mock → detectado', () => {
    const result = checkLocationFraud(POINT, {
      mock: true,
      timestamp: Date.now(),
    });

    expect(result.fraud).toBe(true);
    expect(result.reason).toBe('gps_mock');
  });
});
