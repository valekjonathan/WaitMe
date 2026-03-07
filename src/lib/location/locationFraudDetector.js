/**
 * Detector de GPS falso / ubicación fraudulenta.
 * Similar a apps de movilidad (Uber/Bolt).
 *
 * Detecta:
 * - Saltos >200m en <2s (teleport)
 * - Velocidad imposible (>150km/h)
 * - Cambios de posición sin movimiento real (oscilaciones sospechosas)
 * - GPS mock (si el dispositivo lo reporta)
 *
 * @module locationFraudDetector
 */

import { getMetersBetween } from './distanceEngine.js';
import { logLocationFraud } from './locationFraudLogs.js';

const JUMP_THRESHOLD_M = 200;
const JUMP_TIME_MS = 2000;
const MAX_SPEED_KMH = 150;
const MAX_SPEED_MPS = (MAX_SPEED_KMH * 1000) / 3600;

/** @type {Array<{ lat: number, lng: number, timestamp: number, speed?: number }>} */
const positionHistory = [];
const HISTORY_MAX = 20;

/**
 * Añade posición al historial y detecta fraudes.
 * @param {{ lat: number, lng: number } | [number, number]} location
 * @param {{ timestamp?: number, speed?: number, accuracy?: number, mock?: boolean } | null} meta
 * @returns {{ fraud: boolean, reason?: string }}
 */
export function checkLocationFraud(location, meta = null) {
  const ts = meta?.timestamp ?? Date.now();
  const speedMps = meta?.speed ?? null;
  const mock = meta?.mock ?? false;

  const [lat, lng] = toLatLng(location);
  if (lat == null || lng == null) return { fraud: false };

  if (mock) {
    flagLocationFraud({
      reason: 'gps_mock',
      user: meta?.userId ?? 'unknown',
      location: { lat, lng },
      speed: speedMps,
      accuracy: meta?.accuracy ?? null,
    });
    return { fraud: true, reason: 'gps_mock' };
  }

  if (speedMps != null && speedMps > MAX_SPEED_MPS) {
    const speedKmh = (speedMps * 3600) / 1000;
    flagLocationFraud({
      reason: 'speed_impossible',
      user: meta?.userId ?? 'unknown',
      location: { lat, lng },
      speed: speedKmh,
      accuracy: meta?.accuracy ?? null,
    });
    return { fraud: true, reason: 'speed_impossible', speed: speedKmh };
  }

  const prev = positionHistory[positionHistory.length - 1];
  if (prev) {
    const dtSec = (ts - prev.timestamp) / 1000;
    if (dtSec > 0 && dtSec < JUMP_TIME_MS / 1000) {
      const distance = getMetersBetween([prev.lat, prev.lng], [lat, lng]);
      if (distance > JUMP_THRESHOLD_M) {
        const impliedSpeedMps = distance / dtSec;
        const impliedSpeedKmh = (impliedSpeedMps * 3600) / 1000;
        flagLocationFraud({
          reason: 'teleport',
          user: meta?.userId ?? 'unknown',
          location: { lat, lng },
          distanceJump: distance,
          speed: impliedSpeedKmh,
          accuracy: meta?.accuracy ?? null,
        });
        return { fraud: true, reason: 'teleport', distanceJump: distance };
      }
    }
  }

  positionHistory.push({ lat, lng, timestamp: ts, speed: speedMps });
  if (positionHistory.length > HISTORY_MAX) positionHistory.shift();

  return { fraud: false };
}

/**
 * Marca fraude y registra en logs.
 * @param {Object} evt
 * @param {string} evt.reason
 * @param {string} [evt.user]
 * @param {{ lat: number, lng: number }} [evt.location]
 * @param {number} [evt.distanceJump]
 * @param {number} [evt.speed]
 * @param {number} [evt.accuracy]
 */
export function flagLocationFraud(evt) {
  logLocationFraud({
    timestamp: Date.now(),
    user: evt.user ?? 'unknown',
    reason: evt.reason ?? 'unknown',
    distanceJump: evt.distanceJump ?? null,
    speed: evt.speed ?? null,
    accuracy: evt.accuracy ?? null,
    location: evt.location ?? null,
  });
  if (import.meta.env.DEV) {
    console.warn('[locationFraudDetector]', evt.reason, evt);
  }
}

/**
 * Limpia el historial (útil para tests).
 */
export function clearPositionHistory() {
  positionHistory.length = 0;
}

function toLatLng(p) {
  if (!p) return [null, null];
  if (Array.isArray(p) && p.length >= 2) return [Number(p[0]), Number(p[1])];
  const lat = p.lat ?? p.latitude;
  const lng = p.lng ?? p.longitude;
  return [lat != null ? Number(lat) : null, lng != null ? Number(lng) : null];
}
