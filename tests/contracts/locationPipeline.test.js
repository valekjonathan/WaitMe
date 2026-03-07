/**
 * Tests de contrato para el pipeline de localización.
 * Probar: jitter GPS, teleport, mock GPS, movimiento normal, kalman smoothing, proximidad real.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { processLocation, resetPipeline } from '@/lib/locationPipeline/locationPipeline.js';
import { createKalmanFilter } from '@/lib/locationPipeline/locationKalmanFilter.js';
import { snapToRoadSync } from '@/lib/locationPipeline/locationMapMatcher.js';
import { predictPosition1s } from '@/lib/locationPipeline/locationPrediction.js';
import { getMetersBetween } from '@/lib/location';

const POINT = { lat: 43.3619, lng: -5.8494 };

describe('locationPipeline', () => {
  beforeEach(() => {
    resetPipeline();
    vi.useFakeTimers();
  });

  it('movimiento normal → procesado correctamente', () => {
    const r1 = processLocation({ ...POINT, accuracy: 10, timestamp: 1000 });
    expect(r1).not.toBeNull();
    expect(r1.lat).toBeCloseTo(POINT.lat, 5);
    expect(r1.lng).toBeCloseTo(POINT.lng, 5);

    vi.advanceTimersByTime(1000);
    const r2 = processLocation({
      lat: POINT.lat + 0.00001,
      lng: POINT.lng,
      accuracy: 10,
      timestamp: 2000,
    });
    expect(r2).not.toBeNull();
  });

  it('teleport >200m → descartado', () => {
    processLocation({ ...POINT, accuracy: 10, timestamp: 1000 });
    vi.advanceTimersByTime(1000);
    const far = {
      lat: POINT.lat + 0.003,
      lng: POINT.lng,
      accuracy: 10,
      timestamp: 2000,
    };
    const r = processLocation(far);
    expect(r).toBeNull();
  });

  it('mock GPS → descartado', () => {
    const r = processLocation({ ...POINT, mock: true, timestamp: 1000 });
    expect(r).toBeNull();
  });

  it('accuracy extrema >100m → descartado (pipeline fraud detector)', () => {
    const r = processLocation({ ...POINT, accuracy: 150, timestamp: 1000 });
    expect(r).toBeNull();
  });

  it('proximidad real (5m) → permitido', () => {
    const a = POINT;
    const b = {
      lat: POINT.lat + 5 / 111320,
      lng: POINT.lng,
      accuracy: 10,
      timestamp: 2000,
    };
    processLocation({ ...a, accuracy: 10, timestamp: 1000 });
    vi.advanceTimersByTime(1000);
    const r = processLocation(b);
    expect(r).not.toBeNull();
    expect(getMetersBetween(a, r)).toBeLessThanOrEqual(10);
  });

  it('kalman filter suaviza jitter', () => {
    const kf = createKalmanFilter();
    const noisy = [
      { lat: 43.3619, lng: -5.8494 },
      { lat: 43.36192, lng: -5.84938 },
      { lat: 43.36188, lng: -5.84942 },
      { lat: 43.36191, lng: -5.84939 },
    ];
    const out = noisy.map((p) => kf.update({ ...p, accuracy: 5 }));
    expect(out[0].lat).toBe(noisy[0].lat);
    expect(out[3].lat).toBeCloseTo(43.3619, 4);
  });

  it('snapToRoadSync identity', () => {
    const p = { lat: 43.36, lng: -5.85 };
    expect(snapToRoadSync(p)).toEqual(p);
  });

  it('predictPosition1s con velocidad', () => {
    const pos = { lat: 43.3619, lng: -5.8494 };
    const motion = { speed: 5, heading: 0 };
    const pred = predictPosition1s(pos, motion);
    expect(pred.lat).toBeGreaterThan(pos.lat);
    expect(pred.lng).toBeCloseTo(pos.lng, 5);
  });

  it('predictPosition1s sin velocidad → misma posición', () => {
    const pos = { lat: 43.3619, lng: -5.8494 };
    const pred = predictPosition1s(pos, { speed: 0, heading: 0 });
    expect(pred).toEqual(pos);
  });
});
