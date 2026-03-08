/**
 * Capas GeoJSON del mapa.
 * StaticCarsLayer, UserLocationLayer, WaitMeCarLayer.
 */

import { addStaticCarsLayer, addUserLocationLayer, addWaitMeCarLayer } from '@/lib/mapLayers';

/**
 * Aplica la capa de coches estáticos (alertas).
 */
export function applyStaticCarsLayer(map, alerts, onAlertClick) {
  if (!map?.getStyle?.()?.layers) return;
  addStaticCarsLayer(map, alerts, onAlertClick);
}

/**
 * Aplica la capa de ubicación del usuario.
 */
export function applyUserLocationLayer(map, userLoc) {
  if (!map?.getStyle?.()?.layers) return;
  addUserLocationLayer(map, userLoc);
}

/**
 * Aplica la capa del coche dinámico WaitMe (comprador).
 */
export function applyWaitMeCarLayer(map, waitMeCarBuyerLocation, waitMeCarMode, waitMeCarColor) {
  if (!map?.getStyle?.()?.layers) return;
  addWaitMeCarLayer(map, waitMeCarBuyerLocation, waitMeCarMode, waitMeCarColor);
}
