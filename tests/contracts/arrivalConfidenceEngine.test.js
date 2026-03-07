// @ts-check
/**
 * Tests de contrato para Arrival Confidence Engine.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getArrivalConfidence,
  getRecentFraudFlags,
} from '../../src/lib/transaction/arrivalConfidenceEngine.js';
import {
  logLocationFraud,
  clearLocationFraudLogs,
} from '../../src/lib/location/locationFraudLogs.js';

const OVIEDO = { lat: 43.3619, lng: -5.8494 };

describe('arrivalConfidenceEngine', () => {
  beforeEach(() => {
    clearLocationFraudLogs();
  });

  it('1. ambos a 3m, buena accuracy, velocidad baja, 10s estables → score alto, pago liberable', () => {
    const userA = OVIEDO;
    const userB = { lat: 43.36192, lng: -5.8494 };
    const alert = OVIEDO;
    const r = getArrivalConfidence({
      userALocation: userA,
      userBLocation: userB,
      alertLocation: alert,
      accuracyA: 5,
      accuracyB: 5,
      speedB: 0,
      stabilityMs: 10000,
      recentFraudFlags: [],
    });
    expect(r.invalid).toBe(false);
    expect(r.score).toBeGreaterThanOrEqual(80);
  });

  it('2. distancia buena pero accuracy mala → score insuficiente, no liberar', () => {
    const userA = OVIEDO;
    const userB = { lat: 43.36192, lng: -5.8494 };
    const r = getArrivalConfidence({
      userALocation: userA,
      userBLocation: userB,
      alertLocation: null,
      accuracyA: 50,
      accuracyB: 50,
      speedB: 0,
      stabilityMs: 10000,
      recentFraudFlags: [],
    });
    expect(r.invalid).toBe(false);
    expect(r.score).toBeLessThan(80);
  });

  it('3. distancia buena pero velocidad alta → score insuficiente, no liberar', () => {
    const userA = OVIEDO;
    const userB = { lat: 43.36192, lng: -5.8494 };
    const r = getArrivalConfidence({
      userALocation: userA,
      userBLocation: userB,
      alertLocation: OVIEDO,
      accuracyA: 5,
      accuracyB: 5,
      speedB: 10,
      stabilityMs: 10000,
      recentFraudFlags: [],
    });
    expect(r.invalid).toBe(false);
    expect(r.score).toBeLessThan(80);
  });

  it('4. distancia buena pero solo 4s estables → score insuficiente, no liberar', () => {
    const userA = OVIEDO;
    const userB = { lat: 43.36192, lng: -5.8494 };
    const r = getArrivalConfidence({
      userALocation: userA,
      userBLocation: userB,
      alertLocation: OVIEDO,
      accuracyA: 5,
      accuracyB: 5,
      speedB: 0,
      stabilityMs: 4000,
      recentFraudFlags: [],
    });
    expect(r.invalid).toBe(false);
    expect(r.score).toBeLessThan(80);
  });

  it('5. fraude reciente → score muy bajo o invalida, no liberar', () => {
    logLocationFraud({
      timestamp: Date.now(),
      user: 'buyer-1',
      reason: 'teleport',
    });
    const userA = OVIEDO;
    const userB = { lat: 43.36192, lng: -5.8494 };
    const r = getArrivalConfidence({
      userALocation: userA,
      userBLocation: userB,
      alertLocation: OVIEDO,
      accuracyA: 5,
      accuracyB: 5,
      speedB: 0,
      stabilityMs: 10000,
      recentFraudFlags: getRecentFraudFlags(),
    });
    expect(r.invalid).toBe(true);
    expect(r.score).toBe(0);
  });

  it('6. doble validación A↔B y B↔alerta correcta → score correcto', () => {
    const userA = OVIEDO;
    const userB = { lat: 43.36192, lng: -5.8494 };
    const alert = OVIEDO;
    const r = getArrivalConfidence({
      userALocation: userA,
      userBLocation: userB,
      alertLocation: alert,
      accuracyA: 10,
      accuracyB: 10,
      speedB: 1,
      stabilityMs: 10000,
      recentFraudFlags: [],
    });
    expect(r.invalid).toBe(false);
    expect(r.details?.distanceAB).toBeDefined();
    expect(r.details?.distanceBAlert).toBeDefined();
    expect(r.score).toBeGreaterThanOrEqual(80);
  });
});
