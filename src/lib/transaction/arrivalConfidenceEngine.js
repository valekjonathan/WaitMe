/**
 * Motor de confianza de llegada — score 0–100.
 * Usado para liberar pago solo cuando hay alta confianza de llegada real.
 *
 * Factores:
 * - distancia A↔B
 * - distancia B↔alerta
 * - accuracy A y B
 * - velocidad B
 * - estabilidad temporal
 * - fraude reciente
 *
 * @module arrivalConfidenceEngine
 */

import { getMetersBetween } from '@/lib/location';
import { getLocationFraudLogs } from '@/lib/location/locationFraudLogs';

const DISTANCE_AB_OPTIMAL_M = 3;
const DISTANCE_AB_MAX_M = 6;
const DISTANCE_B_ALERT_OPTIMAL_M = 3;
const DISTANCE_B_ALERT_MAX_M = 6;
const ACCURACY_OPTIMAL_M = 5;
const ACCURACY_MAX_M = 20;
const SPEED_OPTIMAL_KMH = 0;
const SPEED_MAX_KMH = 3;
const STABILITY_OPTIMAL_MS = 10000;
const FRAUD_RECENT_MS = 60000;

function toLatLng(p) {
  if (!p) return [null, null];
  if (Array.isArray(p) && p.length >= 2) return [Number(p[0]), Number(p[1])];
  const lat = p.lat ?? p.latitude;
  const lng = p.lng ?? p.longitude;
  return [lat != null ? Number(lat) : null, lng != null ? Number(lng) : null];
}

/**
 * Calcula el score de confianza de llegada (0–100).
 *
 * @param {Object} params
 * @param {{ lat: number, lng: number } | [number, number]} params.userALocation — vendedor
 * @param {{ lat: number, lng: number } | [number, number]} params.userBLocation — comprador
 * @param {{ lat: number, lng: number } | [number, number] | null} [params.alertLocation] — plaza
 * @param {number|null} [params.accuracyA] — metros
 * @param {number|null} [params.accuracyB] — metros
 * @param {number|null} [params.speedB] — km/h
 * @param {number} [params.stabilityMs] — ms en posición estable
 * @param {string[]} [params.recentFraudFlags] — razones de fraude reciente
 * @returns {{ score: number, invalid: boolean, details?: object }}
 */
export function getArrivalConfidence({
  userALocation,
  userBLocation,
  alertLocation = null,
  accuracyA = null,
  accuracyB = null,
  speedB = null,
  stabilityMs = 0,
  recentFraudFlags = [],
}) {
  const [latA, lngA] = toLatLng(userALocation);
  const [latB, lngB] = toLatLng(userBLocation);

  if (latA == null || lngA == null || latB == null || lngB == null) {
    return { score: 0, invalid: true, details: { reason: 'missing_location' } };
  }

  if (recentFraudFlags && recentFraudFlags.length > 0) {
    return {
      score: 0,
      invalid: true,
      details: { reason: 'recent_fraud', flags: recentFraudFlags },
    };
  }

  const distanceAB = getMetersBetween(userALocation, userBLocation);
  let distanceBAlert = distanceAB;
  if (alertLocation) {
    const [latAlert, lngAlert] = toLatLng(alertLocation);
    if (latAlert != null && lngAlert != null) {
      distanceBAlert = getMetersBetween(userBLocation, alertLocation);
    }
  }

  let score = 0;
  const maxScore = 100;

  // 1. Distancia A↔B (hasta 25 pts)
  if (Number.isFinite(distanceAB)) {
    if (distanceAB <= DISTANCE_AB_OPTIMAL_M) score += 25;
    else if (distanceAB <= DISTANCE_AB_MAX_M) {
      const t = (distanceAB - DISTANCE_AB_OPTIMAL_M) / (DISTANCE_AB_MAX_M - DISTANCE_AB_OPTIMAL_M);
      score += 25 * (1 - t * 0.6);
    }
  }

  // 2. Distancia B↔alerta (hasta 25 pts)
  if (alertLocation && Number.isFinite(distanceBAlert)) {
    if (distanceBAlert <= DISTANCE_B_ALERT_OPTIMAL_M) score += 25;
    else if (distanceBAlert <= DISTANCE_B_ALERT_MAX_M) {
      const t =
        (distanceBAlert - DISTANCE_B_ALERT_OPTIMAL_M) /
        (DISTANCE_B_ALERT_MAX_M - DISTANCE_B_ALERT_OPTIMAL_M);
      score += 25 * (1 - t * 0.6);
    }
  } else if (!alertLocation) {
    score += 25;
  }

  // 3. Accuracy A (hasta 12 pts)
  if (accuracyA != null && accuracyA <= ACCURACY_MAX_M) {
    if (accuracyA <= ACCURACY_OPTIMAL_M) score += 12;
    else
      score += 12 * (1 - (accuracyA - ACCURACY_OPTIMAL_M) / (ACCURACY_MAX_M - ACCURACY_OPTIMAL_M));
  } else if (accuracyA == null) score += 6;

  // 4. Accuracy B (hasta 12 pts)
  if (accuracyB != null && accuracyB <= ACCURACY_MAX_M) {
    if (accuracyB <= ACCURACY_OPTIMAL_M) score += 12;
    else
      score += 12 * (1 - (accuracyB - ACCURACY_OPTIMAL_M) / (ACCURACY_MAX_M - ACCURACY_OPTIMAL_M));
  } else if (accuracyB == null) score += 6;

  // 5. Velocidad B (hasta 13 pts) — si > 3 km/h, score insuficiente
  if (speedB != null) {
    if (speedB > SPEED_MAX_KMH) {
      const capped = Math.min(score, 50);
      return {
        score: capped,
        invalid: false,
        details: {
          distanceAB,
          distanceBAlert: alertLocation ? distanceBAlert : null,
          accuracyA,
          accuracyB,
          speedB,
          stabilityMs,
          reason: 'speed_too_high',
        },
      };
    }
    if (speedB <= SPEED_OPTIMAL_KMH) score += 13;
    else score += 13 * (1 - speedB / SPEED_MAX_KMH);
  } else score += 7;

  // 6. Estabilidad temporal (hasta 13 pts)
  if (stabilityMs >= STABILITY_OPTIMAL_MS) score += 13;
  else if (stabilityMs >= 5000) score += 8;
  else if (stabilityMs >= 2000) score += 4;
  else if (stabilityMs > 0) score += 2;
  else score += 0;

  let finalScore = Math.min(maxScore, Math.round(score));
  if (stabilityMs > 0 && stabilityMs < STABILITY_OPTIMAL_MS && finalScore >= 80) {
    finalScore = Math.min(finalScore, 75);
  }
  return {
    score: finalScore,
    invalid: false,
    details: {
      distanceAB,
      distanceBAlert: alertLocation ? distanceBAlert : null,
      accuracyA,
      accuracyB,
      speedB,
      stabilityMs,
    },
  };
}

/**
 * Comprueba si hay fraude reciente para un usuario (en los últimos N ms).
 * @param {string} [userId]
 * @param {number} [withinMs]
 * @returns {string[]} razones de fraude
 */
export function getRecentFraudFlags(userId, withinMs = FRAUD_RECENT_MS) {
  const logs = getLocationFraudLogs();
  const cutoff = Date.now() - withinMs;
  return logs
    .filter((l) => l.timestamp >= cutoff && (!userId || l.user === userId))
    .map((l) => l.reason);
}
