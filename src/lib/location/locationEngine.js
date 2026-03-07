/**
 * Motor de ubicación único de WaitMe.
 * Fuente única de verdad para la ubicación actual del usuario.
 *
 * - Basado en watchPosition (no solo getCurrentPosition)
 * - Pipeline opcional: fraud → movement → kalman → smoothing → map matching
 * - Smoothing legacy opcional (locationSmoothing)
 *
 * @module locationEngine
 */

import { createLocationSmoother } from './locationSmoothing.js';
import { processLocation, resetPipeline } from '@/lib/locationPipeline/locationPipeline.js';

const OVIEDO_FALLBACK = { lat: 43.3619, lng: -5.8494, accuracy: 500 };
const GPS_TIMEOUT_MS = 8000;
const DEFAULT_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 10000,
};

/** @type {number|null} */
let watchId = null;

/** @type {Set<(loc: LocationUpdate) => void>} */
const subscribers = new Set();

/** @type {LocationUpdate|null} */
let lastKnown = null;

/** @type {boolean} */
let resolved = false;

/** @type {ReturnType<typeof setTimeout>|null} */
let timeoutRef = null;

/** @type {ReturnType<typeof createLocationSmoother>|null} */
let smoother = null;

/** @type {boolean} */
let usePipeline = false;

/**
 * @typedef {Object} LocationUpdate
 * @property {number} lat
 * @property {number} lng
 * @property {number|null} [accuracy]
 * @property {number} [timestamp]
 * @property {number|null} [speed]
 * @property {number|null} [heading]
 */

/**
 * Normaliza posición raw a formato interno.
 * @param {GeolocationPosition} pos
 * @returns {LocationUpdate}
 */
function normalizePosition(pos) {
  const { latitude, longitude, accuracy, speed, heading } = pos.coords;
  const raw = {
    lat: latitude,
    lng: longitude,
    accuracy: typeof accuracy === 'number' ? accuracy : null,
    speed: typeof speed === 'number' ? speed : null,
    heading: typeof heading === 'number' ? heading : null,
    timestamp: Date.now(),
  };
  return normalizePositionForMapMatching(raw);
}

/**
 * Notifica a todos los suscriptores.
 * Si pipeline activo: procesa por pipeline; si fraude, no actualiza.
 * Si no: aplica smoothing legacy si está activo.
 * @param {LocationUpdate} loc
 */
function notify(loc) {
  if (usePipeline) {
    const processed = processLocation({
      ...loc,
      mock: false,
    });
    if (!processed) return;
    loc = processed;
  } else {
    const out = smoother ? smoother.update(loc) : loc;
    loc = { ...out, timestamp: loc.timestamp };
  }
  lastKnown = { ...loc };
  subscribers.forEach((cb) => {
    try {
      cb(lastKnown);
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[locationEngine] subscriber error', e);
    }
  });
}

/**
 * Inicia el motor de ubicación.
 * Idempotente: si ya está corriendo, no hace nada.
 * @param {Object} [opts]
 * @param {boolean} [opts.smoothing=false] — activar smoothing legacy
 * @param {boolean} [opts.pipeline=false] — activar pipeline profesional (fraud, kalman, smoothing)
 */
export function startLocationEngine(opts = {}) {
  if (watchId != null) return;

  usePipeline = opts.pipeline === true;
  if (usePipeline) {
    smoother = null;
  } else if (opts.smoothing) {
    smoother = createLocationSmoother();
  } else {
    smoother = null;
  }

  if (!navigator.geolocation) {
    notify({ ...OVIEDO_FALLBACK, timestamp: Date.now() });
    return;
  }

  // getCurrentPosition inicial para arranque rápido
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      resolved = true;
      if (timeoutRef) {
        clearTimeout(timeoutRef);
        timeoutRef = null;
      }
      notify(normalizePosition(pos));
    },
    () => {
      resolved = true;
      if (timeoutRef) {
        clearTimeout(timeoutRef);
        timeoutRef = null;
      }
      notify({ ...OVIEDO_FALLBACK, timestamp: Date.now() });
    },
    { enableHighAccuracy: false, timeout: 4000, maximumAge: 30 * 1000 }
  );

  timeoutRef = setTimeout(() => {
    if (resolved) return;
    resolved = true;
    if (lastKnown) return;
    notify({ ...OVIEDO_FALLBACK, timestamp: Date.now() });
  }, GPS_TIMEOUT_MS);

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      if (!resolved) {
        resolved = true;
        if (timeoutRef) {
          clearTimeout(timeoutRef);
          timeoutRef = null;
        }
      }
      notify(normalizePosition(pos));
    },
    () => {
      if (!resolved) {
        resolved = true;
        if (timeoutRef) {
          clearTimeout(timeoutRef);
          timeoutRef = null;
        }
        if (!lastKnown) notify({ ...OVIEDO_FALLBACK, timestamp: Date.now() });
      }
    },
    { ...DEFAULT_OPTIONS }
  );
}

/**
 * Detiene el motor de ubicación.
 * Limpia watch y timeout.
 */
export function stopLocationEngine() {
  if (timeoutRef) {
    clearTimeout(timeoutRef);
    timeoutRef = null;
  }
  if (watchId != null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (smoother) smoother.reset();
  smoother = null;
  if (usePipeline) resetPipeline();
  usePipeline = false;
  resolved = false;
}

/**
 * Obtiene la última ubicación conocida.
 * @returns {LocationUpdate|null}
 */
export function getLastKnownLocation() {
  return lastKnown;
}

/**
 * Suscribe a actualizaciones de ubicación.
 * @param {(loc: LocationUpdate) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeToLocation(callback) {
  subscribers.add(callback);
  if (lastKnown) {
    try {
      callback(lastKnown);
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[locationEngine] initial callback error', e);
    }
  }
  return () => subscribers.delete(callback);
}

/**
 * Obtiene ubicación actual (one-shot).
 * Si el engine está corriendo, devuelve lastKnown.
 * Si no, hace getCurrentPosition.
 * @returns {Promise<LocationUpdate>}
 */
export function getCurrentLocation() {
  if (lastKnown) return Promise.resolve(lastKnown);
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ ...OVIEDO_FALLBACK, timestamp: Date.now() });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(normalizePosition(pos)),
      () => resolve({ ...OVIEDO_FALLBACK, timestamp: Date.now() }),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 8000 }
    );
  });
}

/**
 * Punto de integración para map matching futuro.
 * Por ahora devuelve la posición tal cual.
 * @param {LocationUpdate} raw
 * @returns {LocationUpdate}
 */
export function normalizePositionForMapMatching(raw) {
  return raw;
}
