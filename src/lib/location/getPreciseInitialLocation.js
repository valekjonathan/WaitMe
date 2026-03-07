/**
 * Obtiene la posición inicial precisa (sin pipeline/smoothing).
 * Estrategia tipo Uber/Bolt: getCurrentPosition con alta precisión.
 *
 * @module getPreciseInitialLocation
 */

const OVIEDO_FALLBACK = { lat: 43.3619, lng: -5.8494, accuracy: 500 };
const MAX_ACCURACY_M = 50;
const MAX_ATTEMPTS = 3;
const OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

/**
 * Obtiene ubicación precisa. Si accuracy > 50m, reintenta hasta 3 veces.
 * @returns {Promise<{ lat: number, lng: number, accuracy: number }>}
 */
export function getPreciseInitialLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(OVIEDO_FALLBACK);
      return;
    }

    let attempt = 0;

    const tryGet = () => {
      attempt += 1;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const acc = typeof accuracy === 'number' ? accuracy : 100;
          const result = { lat: latitude, lng: longitude, accuracy: acc };

          if (acc <= MAX_ACCURACY_M || attempt >= MAX_ATTEMPTS) {
            resolve(result);
            return;
          }
          tryGet();
        },
        () => {
          if (attempt >= MAX_ATTEMPTS) {
            resolve(OVIEDO_FALLBACK);
            return;
          }
          tryGet();
        },
        OPTIONS
      );
    };

    tryGet();
  });
}
