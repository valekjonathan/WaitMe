/**
 * Normaliza ubicación a [lat, lng].
 * Acepta: [lat,lng] | {lat,lng} | {latitude,longitude}
 * @param {[number,number]|{lat?:number,lng?:number,latitude?:number,longitude?:number}|null} loc
 * @returns {[number,number]|null}
 */
export function toLatLngArray(loc) {
  if (!loc) return null;
  const lat = Array.isArray(loc) ? loc[0] : (loc?.lat ?? loc?.latitude);
  const lng = Array.isArray(loc) ? loc[1] : (loc?.lng ?? loc?.longitude);
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}
