/**
 * Regla global de movimiento de coches.
 * STATIC: todos los coches congelados.
 * WAITME_ACTIVE: solo el coche del WaitMe se mueve (cuando usuario en "Estoy aparcado aquí" ve venir al comprador).
 *
 * @module carsMovementStore
 */

export const CARS_MOVEMENT_MODE = {
  STATIC: 'STATIC',
  WAITME_ACTIVE: 'WAITME_ACTIVE',
};

let mode = CARS_MOVEMENT_MODE.STATIC;
const listeners = new Set();

export function getCarsMovementMode() {
  return mode;
}

export function setCarsMovementMode(value) {
  if (mode === value) return;
  mode = value;
  listeners.forEach((cb) => {
    try {
      cb(mode);
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[carsMovementStore] listener error', e);
    }
  });
}

export function subscribeToCarsMovementMode(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
