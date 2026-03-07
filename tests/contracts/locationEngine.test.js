/**
 * Tests de validación del motor de ubicación WaitMe.
 * Verifica: estabilidad, watchers, smoothing, distancia, proximidad, ETA.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getMetersBetween,
  getKmBetween,
  hasReachedTarget,
  getDistanceToTarget,
  getEtaMinutes,
  getEtaFromPoints,
} from '@/lib/location';
import { createLocationSmoother } from '@/lib/location/locationSmoothing.js';
import {
  startLocationEngine,
  stopLocationEngine,
  subscribeToLocation,
  getLastKnownLocation,
} from '@/lib/location';

describe('distanceEngine', () => {
  it('puntos iguales: 0 metros', () => {
    const p = { lat: 43.3619, lng: -5.8494 };
    expect(getMetersBetween(p, p)).toBe(0);
  });

  it('puntos cercanos: metros correctos', () => {
    const a = [43.3619, -5.8494];
    const b = [43.362, -5.849];
    const m = getMetersBetween(a, b);
    expect(m).toBeGreaterThan(0);
    expect(m).toBeLessThan(100);
    expect(Number.isFinite(m)).toBe(true);
  });

  it('puntos lejanos: km correctos', () => {
    const oviedo = { lat: 43.3619, lng: -5.8494 };
    const madrid = { lat: 40.4168, lng: -3.7038 };
    const km = getKmBetween(oviedo, madrid);
    expect(km).toBeGreaterThan(350);
    expect(km).toBeLessThan(400);
  });

  it('acepta [lat,lng] y {lat,lng}', () => {
    const a = [43.3619, -5.8494];
    const b = { lat: 43.362, lng: -5.849 };
    const m = getMetersBetween(a, b);
    expect(Number.isFinite(m)).toBe(true);
  });

  it('null/undefined devuelve NaN', () => {
    expect(getMetersBetween(null, [43.36, -5.85])).toBeNaN();
    expect(getMetersBetween([43.36, -5.85], undefined)).toBeNaN();
  });
});

describe('proximityEngine', () => {
  it('hasReachedTarget: puntos iguales <= 5m', () => {
    const p = { lat: 43.3619, lng: -5.8494 };
    expect(hasReachedTarget({ currentUserLocation: p, targetLocation: p })).toBe(true);
  });

  it('hasReachedTarget: 3m de distancia <= 5m', () => {
    const user = [43.3619, -5.8494];
    const target = [43.3619, -5.84944];
    const m = getMetersBetween(user, target);
    expect(m).toBeLessThanOrEqual(5);
    expect(
      hasReachedTarget({ currentUserLocation: user, targetLocation: target, maxDistanceMeters: 5 })
    ).toBe(true);
  });

  it('hasReachedTarget: 10m de distancia > 5m', () => {
    const user = [43.3619, -5.8494];
    const target = [43.362, -5.8494];
    const m = getMetersBetween(user, target);
    expect(m).toBeGreaterThan(5);
    expect(
      hasReachedTarget({ currentUserLocation: user, targetLocation: target, maxDistanceMeters: 5 })
    ).toBe(false);
  });

  it('getDistanceToTarget devuelve metros', () => {
    const from = { lat: 43.3619, lng: -5.8494 };
    const to = { lat: 43.362, lng: -5.849 };
    const d = getDistanceToTarget({ from, to });
    expect(d).not.toBeNull();
    expect(Number.isFinite(d)).toBe(true);
  });
});

describe('etaEngine', () => {
  it('getEtaMinutes walking: 100m ≈ 1.25 min', () => {
    const eta = getEtaMinutes({ distanceMeters: 100, mode: 'walking' });
    expect(eta).toBeGreaterThan(1);
    expect(eta).toBeLessThan(2);
  });

  it('getEtaMinutes driving: 1km ≈ 2.4 min', () => {
    const eta = getEtaMinutes({ distanceMeters: 1000, mode: 'driving' });
    expect(eta).toBeGreaterThan(2);
    expect(eta).toBeLessThan(3);
  });

  it('getEtaMinutes distancia 0 devuelve null (no calculable)', () => {
    expect(getEtaMinutes({ distanceMeters: 0, mode: 'walking' })).toBeNull();
  });

  it('getEtaFromPoints calcula distancia y ETA', () => {
    const from = { lat: 43.3619, lng: -5.8494 };
    const to = { lat: 43.362, lng: -5.849 };
    const result = getEtaFromPoints({ from, to, mode: 'walking' });
    expect(result).not.toBeNull();
    expect(result.distanceMeters).toBeGreaterThan(0);
    expect(result.etaMinutes).toBeGreaterThan(0);
  });
});

describe('locationSmoothing', () => {
  it('50 updates con cambios bruscos: smoothing reduce saltos', () => {
    const smoother = createLocationSmoother({ alpha: 0.3 });
    const base = { lat: 43.3619, lng: -5.8494, accuracy: 10 };

    let last = null;
    for (let i = 0; i < 50; i++) {
      const jitter = (Math.random() - 0.5) * 0.001;
      const loc = { ...base, lat: base.lat + jitter, lng: base.lng + jitter * 0.5 };
      last = smoother.update(loc);
    }

    expect(last).not.toBeNull();
    expect(Math.abs(last.lat - base.lat)).toBeLessThan(0.001);
    expect(Math.abs(last.lng - base.lng)).toBeLessThan(0.001);
  });

  it('cambios pequeños: posición final estable', () => {
    const smoother = createLocationSmoother({ alpha: 0.2 });
    const target = { lat: 43.362, lng: -5.849, accuracy: 5 };

    for (let i = 0; i < 30; i++) {
      const noise = (Math.random() - 0.5) * 0.0001;
      smoother.update({ ...target, lat: target.lat + noise, lng: target.lng + noise });
    }
    const final = smoother.update(target);
    expect(Math.abs(final.lat - target.lat)).toBeLessThan(0.0005);
    expect(Math.abs(final.lng - target.lng)).toBeLessThan(0.0005);
  });

  it('accuracy > 25 no aplica smoothing', () => {
    const smoother = createLocationSmoother();
    const loc1 = { lat: 43.36, lng: -5.85, accuracy: 50 };
    const loc2 = { lat: 43.37, lng: -5.86, accuracy: 50 };
    smoother.update(loc1);
    const out2 = smoother.update(loc2);
    expect(out2.lat).toBe(loc2.lat);
    expect(out2.lng).toBe(loc2.lng);
  });

  it('reset limpia estado', () => {
    const smoother = createLocationSmoother();
    smoother.update({ lat: 43.36, lng: -5.85, accuracy: 10 });
    smoother.reset();
    const out = smoother.update({ lat: 43.37, lng: -5.86, accuracy: 10 });
    expect(out.lat).toBe(43.37);
    expect(out.lng).toBe(-5.86);
  });
});

describe('locationEngine watcher y cleanup', () => {
  let watchCalls;
  let clearWatchCalls;
  let getCurrentCalls;

  beforeEach(() => {
    watchCalls = [];
    clearWatchCalls = [];
    getCurrentCalls = [];

    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (success, _error, _opts) => {
          getCurrentCalls.push(1);
          success?.({ coords: { latitude: 43.3619, longitude: -5.8494, accuracy: 10 } });
        },
        watchPosition: (success, _error, _opts) => {
          const id = watchCalls.length + 1;
          watchCalls.push(id);
          success?.({ coords: { latitude: 43.3619, longitude: -5.8494, accuracy: 10 } });
          return id;
        },
        clearWatch: (id) => {
          clearWatchCalls.push(id);
        },
      },
    });
  });

  afterEach(() => {
    stopLocationEngine();
    vi.unstubAllGlobals();
  });

  it('startLocationEngine crea UN watcher', () => {
    startLocationEngine();
    expect(watchCalls.length).toBe(1);
  });

  it('startLocationEngine idempotente: no duplica watchers', () => {
    startLocationEngine();
    startLocationEngine();
    startLocationEngine();
    expect(watchCalls.length).toBe(1);
  });

  it('stopLocationEngine limpia correctamente', () => {
    startLocationEngine();
    stopLocationEngine();
    expect(clearWatchCalls.length).toBe(1);
    expect(clearWatchCalls[0]).toBe(watchCalls[0]);

    watchCalls.length = 0;
    clearWatchCalls.length = 0;
    startLocationEngine();
    expect(watchCalls.length).toBe(1);
  });

  it('subscribeToLocation no acumula listeners tras unsubscribe', () => {
    startLocationEngine();
    const received = [];
    const unsub1 = subscribeToLocation((loc) => received.push(loc));
    const unsub2 = subscribeToLocation((loc) => received.push(loc));
    unsub1();
    unsub2();
    expect(getLastKnownLocation()).not.toBeNull();
  });
});
