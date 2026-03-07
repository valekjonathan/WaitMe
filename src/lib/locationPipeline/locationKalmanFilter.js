/**
 * Filtro Kalman para lat/lng.
 * Estándar en apps de movilidad (Uber/Bolt).
 * Elimina jitter GPS, suaviza cambios, evita saltos bruscos.
 *
 * @module locationKalmanFilter
 */

const DEFAULT_P = 1;
const DEFAULT_R = 0.1;
const DEFAULT_Q = 0.01;

/**
 * Crea un filtro Kalman con estado interno.
 * @param {Object} [opts]
 * @param {number} [opts.initialP=1] — covarianza inicial
 * @param {number} [opts.processNoise=0.01] — Q
 * @param {number} [opts.measurementNoise] — R (se ajusta por accuracy si se pasa)
 * @returns {{ update: (pos: {lat:number,lng:number,accuracy?:number}) => {lat:number,lng:number}, reset: () => void }}
 */
export function createKalmanFilter(opts = {}) {
  let P = opts.initialP ?? DEFAULT_P;
  const Q = opts.processNoise ?? DEFAULT_Q;
  const baseR = opts.measurementNoise ?? DEFAULT_R;

  /** @type {{ lat: number, lng: number }|null} */
  let state = null;

  return {
    /**
     * @param {{ lat: number, lng: number, accuracy?: number }} pos
     * @returns {{ lat: number, lng: number }}
     */
    update(pos) {
      const R =
        pos.accuracy != null && pos.accuracy > 0
          ? Math.min(100, Math.max(0.01, pos.accuracy / 10))
          : baseR;

      if (!state) {
        state = { lat: pos.lat, lng: pos.lng };
        P = R;
        return { lat: state.lat, lng: state.lng };
      }

      const K = P / (P + R);
      state.lat = state.lat + K * (pos.lat - state.lat);
      state.lng = state.lng + K * (pos.lng - state.lng);
      P = (1 - K) * P + Q;

      return { lat: state.lat, lng: state.lng };
    },

    reset() {
      state = null;
      P = opts.initialP ?? DEFAULT_P;
    },
  };
}
