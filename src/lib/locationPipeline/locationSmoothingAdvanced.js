/**
 * Smoothing avanzado: EMA + velocity smoothing.
 * Reglas: accuracy > 25m → no suavizar; speed > 50kmh → suavizado reducido.
 *
 * @module locationSmoothingAdvanced
 */

const DEFAULT_ALPHA = 0.3;
const MAX_ACCURACY_FOR_SMOOTHING = 25;
const SPEED_REDUCE_THRESHOLD_KMH = 50;
const HIGH_SPEED_ALPHA = 0.6;

/**
 * Crea un smoother avanzado.
 * @param {Object} [opts]
 * @param {number} [opts.alpha=0.3]
 * @param {number} [opts.maxAccuracyForSmoothing=25]
 * @param {number} [opts.speedReduceThreshold=50]
 * @returns {{ update: (loc: object) => object, reset: () => void }}
 */
export function createAdvancedSmoother(opts = {}) {
  const alpha = opts.alpha ?? DEFAULT_ALPHA;
  const maxAcc = opts.maxAccuracyForSmoothing ?? MAX_ACCURACY_FOR_SMOOTHING;
  const speedThreshold = opts.speedReduceThreshold ?? SPEED_REDUCE_THRESHOLD_KMH;

  /** @type {{ lat: number, lng: number, accuracy?: number, speed?: number, timestamp: number }|null} */
  let state = null;

  return {
    update(loc) {
      const acc = loc.accuracy ?? null;
      const speedKmh = loc.speed != null ? (loc.speed * 3600) / 1000 : (loc.speedKmh ?? null);
      const shouldSmooth = acc != null && acc < maxAcc;
      const useReducedAlpha = speedKmh != null && speedKmh > speedThreshold;
      const effectiveAlpha = useReducedAlpha ? HIGH_SPEED_ALPHA : alpha;

      if (!state) {
        state = {
          lat: loc.lat,
          lng: loc.lng,
          accuracy: acc,
          speed: loc.speed,
          timestamp: loc.timestamp ?? Date.now(),
        };
        return { ...state };
      }

      if (!shouldSmooth) {
        state = {
          lat: loc.lat,
          lng: loc.lng,
          accuracy: acc,
          speed: loc.speed,
          timestamp: loc.timestamp ?? Date.now(),
        };
        return { ...state };
      }

      state.lat = state.lat + effectiveAlpha * (loc.lat - state.lat);
      state.lng = state.lng + effectiveAlpha * (loc.lng - state.lng);
      state.accuracy = acc;
      state.speed = loc.speed;
      state.timestamp = loc.timestamp ?? Date.now();

      return { ...state };
    },

    reset() {
      state = null;
    },
  };
}
