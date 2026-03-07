/**
 * Smoothing de GPS para reducir saltos bruscos.
 * Media móvil exponencial (EMA) — simple, estable, activable/desactivable.
 *
 * @module locationSmoothing
 */

const DEFAULT_ALPHA = 0.3;
const MAX_ACCURACY_FOR_SMOOTHING = 25;

/**
 * @typedef {Object} SmoothedState
 * @property {number} lat
 * @property {number} lng
 * @property {number|null} accuracy
 * @property {number} timestamp
 */

/**
 * Crea un smoother con estado interno.
 * @param {Object} [opts]
 * @param {number} [opts.alpha=0.3] — factor EMA (0-1). Menor = más suave.
 * @param {number} [opts.maxAccuracyForSmoothing=25] — solo suavizar si accuracy < este valor (metros)
 * @returns {{ update: (loc: {lat:number,lng:number,accuracy?:number|null}) => {lat:number,lng:number,accuracy:number|null}, reset: () => void }}
 */
export function createLocationSmoother(opts = {}) {
  const alpha = opts.alpha ?? DEFAULT_ALPHA;
  const maxAcc = opts.maxAccuracyForSmoothing ?? MAX_ACCURACY_FOR_SMOOTHING;

  /** @type {SmoothedState|null} */
  let state = null;

  return {
    /**
     * Actualiza con nueva posición. Devuelve posición suavizada o raw.
     * @param {{ lat: number, lng: number, accuracy?: number|null }} loc
     * @returns {{ lat: number, lng: number, accuracy: number|null }}
     */
    update(loc) {
      const acc = loc.accuracy ?? null;
      const shouldSmooth = acc != null && acc < maxAcc;

      if (!state) {
        state = {
          lat: loc.lat,
          lng: loc.lng,
          accuracy: acc,
          timestamp: Date.now(),
        };
        return { lat: state.lat, lng: state.lng, accuracy: state.accuracy };
      }

      if (!shouldSmooth) {
        state = { lat: loc.lat, lng: loc.lng, accuracy: acc, timestamp: Date.now() };
        return { lat: state.lat, lng: state.lng, accuracy: state.accuracy };
      }

      state.lat = state.lat + alpha * (loc.lat - state.lat);
      state.lng = state.lng + alpha * (loc.lng - state.lng);
      state.accuracy = acc;
      state.timestamp = Date.now();

      return { lat: state.lat, lng: state.lng, accuracy: state.accuracy };
    },

    reset() {
      state = null;
    },
  };
}
