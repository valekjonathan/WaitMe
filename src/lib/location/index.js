/**
 * Motor de ubicación WaitMe — exports públicos.
 */

export {
  startLocationEngine,
  stopLocationEngine,
  getLastKnownLocation,
  subscribeToLocation,
  getCurrentLocation,
  normalizePositionForMapMatching,
} from './locationEngine.js';

export { createLocationSmoother } from './locationSmoothing.js';

export { getMetersBetween, getKmBetween } from './distanceEngine.js';

export { hasReachedTarget, getDistanceToTarget } from './proximityEngine.js';

export { getEtaMinutes, getEtaFromPoints } from './etaEngine.js';
