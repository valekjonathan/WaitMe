/**
 * Pipeline de localización profesional — exports.
 */

export { processLocation, resetPipeline } from './locationPipeline.js';
export { createKalmanFilter } from './locationKalmanFilter.js';
export { createAdvancedSmoother } from './locationSmoothingAdvanced.js';
export { snapToRoad, snapToRoadSync } from './locationMapMatcher.js';
export {
  checkLocationFraud,
  flagLocationFraud,
  clearPositionHistory,
} from '@/lib/location/locationFraudDetector.js';
export { validateMovement } from '@/lib/location/locationMovementValidator.js';
export { predictPosition, predictPosition1s } from './locationPrediction.js';
export {
  logLocationDiagnostic,
  getLocationDiagnostics,
  clearLocationDiagnostics,
} from './locationDiagnosticsLogger.js';
