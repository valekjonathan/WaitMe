/**
 * Detector antifraude GPS — pipeline version.
 * Detecta: saltos >200m en <2s, speed >150km/h, mock, accuracy >100m.
 *
 * @module locationPipeline/locationFraudDetector
 */

import { getMetersBetween } from '@/lib/location/distanceEngine.js';
import { logLocationFraud } from '@/lib/location/locationFraudLogs.js';

const JUMP_THRESHOLD_M = 200;
const JUMP_TIME_MS = 2000;
const MAX_SPEED_KMH = 150;
const MAX_ACCURACY_M = 100;

/** @type {Array<{ lat: number, lng: number, timestamp: number }>} */
const history = [];
const HISTORY_MAX = 20;

function toLatLng(p) {
  if (!p) return [null, null];
  if (Array.isArray(p) && p.length >= 2) return [Number(p[0]), Number(p[1])];
  const lat = p.lat ?? p.latitude;
  const lng = p.lng ?? p.longitude;
  return [lat != null ? Number(lat) : null, lng != null ? Number(lng) : null];
}

/**
 * @param {{ lat: number, lng: number } | [number, number]} location
 * @param {{ timestamp?: number, speed?: number, accuracy?: number, mock?: boolean }} meta
 * @returns {{ fraud: boolean, reason?: string }}
 */
export function checkLocationFraud(location, meta = null) {
  const ts = meta?.timestamp ?? Date.now();
  const speedMps = meta?.speed ?? null;
  const mock = meta?.mock ?? false;
  const accuracy = meta?.accuracy ?? null;

  const [lat, lng] = toLatLng(location);
  if (lat == null || lng == null) return { fraud: false };

  if (mock) {
    flagLocationFraud({ reason: 'gps_mock', location: { lat, lng }, accuracy });
    return { fraud: true, reason: 'gps_mock' };
  }

  if (accuracy != null && accuracy > MAX_ACCURACY_M) {
    flagLocationFraud({ reason: 'accuracy_extreme', location: { lat, lng }, accuracy });
    return { fraud: true, reason: 'accuracy_extreme' };
  }

  const speedKmh = speedMps != null ? (speedMps * 3600) / 1000 : null;
  if (speedKmh != null && speedKmh > MAX_SPEED_KMH) {
    flagLocationFraud({ reason: 'speed_impossible', location: { lat, lng }, speed: speedKmh });
    return { fraud: true, reason: 'speed_impossible' };
  }

  const prev = history[history.length - 1];
  if (prev) {
    const dtSec = (ts - prev.timestamp) / 1000;
    if (dtSec > 0 && dtSec < JUMP_TIME_MS / 1000) {
      const distance = getMetersBetween([prev.lat, prev.lng], [lat, lng]);
      if (distance > JUMP_THRESHOLD_M) {
        flagLocationFraud({
          reason: 'teleport',
          location: { lat, lng },
          distanceJump: distance,
        });
        return { fraud: true, reason: 'teleport', distanceJump: distance };
      }
    }
  }

  history.push({ lat, lng, timestamp: ts });
  if (history.length > HISTORY_MAX) history.shift();

  return { fraud: false };
}

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
}

export function clearPipelineFraudHistory() {
  history.length = 0;
}
