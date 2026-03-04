/**
 * Geohash encode (precision 7 ≈ 153m).
 */
import ngeohash from 'ngeohash';

export function encode(lat, lng, precision = 7) {
  return ngeohash.encode(lat, lng, precision);
}

/** Prefijos para búsqueda por radio: 5 (~5km), 6 (~1.2km), 7 (~150m) */
export function getNeighborPrefixes(geohash, radiusKm = 2) {
  const p = geohash || 'zzzzzzz';
  return [p.slice(0, 5), p.slice(0, 6), p.slice(0, 7)].filter(Boolean);
}
