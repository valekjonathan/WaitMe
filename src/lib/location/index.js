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

export {
  checkLocationFraud,
  flagLocationFraud,
  clearPositionHistory,
} from './locationFraudDetector.js';

export { validateMovement, isMovementValidForTransaction } from './locationMovementValidator.js';

export {
  logLocationFraud,
  getLocationFraudLogs,
  clearLocationFraudLogs,
} from './locationFraudLogs.js';
