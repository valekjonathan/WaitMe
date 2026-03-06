/**
 * Configuración centralizada para alertas cercanas.
 * Única fuente de verdad para radio de búsqueda y umbral de refresco.
 */

/** Radio de búsqueda en km (Haversine). */
export const NEARBY_RADIUS_KM = 2;

/** Umbral en metros: solo refrescar alertas cuando el usuario se mueve más de esto. */
export const NEARBY_REFRESH_THRESHOLD_M = 150;
