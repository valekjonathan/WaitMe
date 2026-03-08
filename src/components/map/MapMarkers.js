/**
 * Gestión de markers DOM (legacy).
 * Actualmente solo limpieza; se mantiene por compatibilidad.
 */

/**
 * Limpia y elimina todos los markers del array.
 * @param {{ current: Array }} markersRef
 */
export function clearMarkers(markersRef) {
  if (!markersRef?.current) return;
  markersRef.current.forEach((m) => m?.remove?.());
  markersRef.current = [];
}
