/**
 * Map matching — integración real con Mapbox Map Matching API vía Supabase Edge Function.
 * Fallback a identity si API no responde o no está configurada.
 *
 * Feature flag: VITE_USE_MAP_MATCHING=true para activar.
 * Requiere: Supabase Edge Function map-match desplegada, MAPBOX_SECRET_TOKEN en Supabase.
 *
 * @module locationMapMatcher
 */

import { getSupabase, getSupabaseConfig } from '@/lib/supabaseClient.js';

const MAP_MATCH_TIMEOUT_MS = 5000;
const CACHE_MAX_AGE_MS = 15000;
const MIN_POINTS_FOR_MATCH = 2;
const BUFFER_MAX = 10;

/** @type {{ lat: number, lng: number, timestamp: number }[]} */
const positionBuffer = [];
/** @type {{ geometry: number[][], timestamp: number }|null} */
let geometryCache = null;
let lastMatchCall = 0;
const MATCH_DEBOUNCE_MS = 3000;

function isMapMatchingEnabled() {
  return (
    import.meta.env.VITE_USE_MAP_MATCHING === 'true' ||
    import.meta.env.VITE_USE_MAP_MATCHING === '1'
  );
}

/**
 * Encuentra el punto más cercano en el segmento [a,b] al punto p.
 * @param {[number,number]} a - [lng, lat]
 * @param {[number,number]} b - [lng, lat]
 * @param {{ lat: number, lng: number }} p
 * @returns {{ point: [number, number], dist: number }}
 */
function closestPointOnSegment(a, b, p) {
  const [ax, ay] = a;
  const [bx, by] = b;
  const px = p.lng;
  const py = p.lat;

  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return { point: a, dist: Math.hypot(px - ax, py - ay) };

  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + t * dx;
  const qy = ay + t * dy;
  const dist = Math.hypot(px - qx, py - qy);
  return { point: [qx, qy], dist };
}

/**
 * Proyecta posición sobre la geometría (LineString) y devuelve el punto más cercano.
 * @param {number[][]} coords - [[lng, lat], ...]
 * @param {{ lat: number, lng: number }} pos
 * @returns {{ lat: number, lng: number }}
 */
function projectOntoGeometry(coords, pos) {
  if (!coords || coords.length === 0) return { lat: pos.lat, lng: pos.lng };
  if (coords.length === 1) return { lat: coords[0][1], lng: coords[0][0] };

  let best = { point: [pos.lng, pos.lat], dist: Infinity };
  for (let i = 0; i < coords.length - 1; i++) {
    const seg = closestPointOnSegment(coords[i], coords[i + 1], pos);
    if (seg.dist < best.dist) best = seg;
  }
  return { lat: best.point[1], lng: best.point[0] };
}

/**
 * Llama a la Edge Function map-match.
 * @param {{ lat: number, lng: number, timestamp?: number }[]} points
 * @returns {Promise<{ geometry?: number[][], confidence?: number }|null>}
 */
async function callMapMatchAPI(points) {
  const supabase = getSupabase();
  const config = getSupabaseConfig();
  if (!supabase || !config.ok) return null;

  const body = {
    points: points.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      timestamp: p.timestamp ?? Math.floor(Date.now() / 1000),
    })),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MAP_MATCH_TIMEOUT_MS);

  try {
    const { data, error } = await supabase.functions.invoke('map-match', {
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (error) return null;
    return data;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

/**
 * Procesa el buffer en background y actualiza la caché.
 */
async function processBuffer() {
  if (positionBuffer.length < MIN_POINTS_FOR_MATCH) return;

  const now = Date.now();
  if (now - lastMatchCall < MATCH_DEBOUNCE_MS) return;
  lastMatchCall = now;

  const points = positionBuffer.splice(0, Math.min(BUFFER_MAX, positionBuffer.length));
  const result = await callMapMatchAPI(points);

  const geom = result?.geometry;
  const coords = Array.isArray(geom) ? geom : geom?.coordinates;
  if (coords && coords.length > 0) {
    geometryCache = { geometry: coords, timestamp: now };
  }
}

/**
 * Ajusta posición a la carretera más cercana (Mapbox Map Matching API).
 * Con feature flag activo: usa caché de geometría si existe; si no, identity.
 * Sin feature flag: identity.
 *
 * @param {{ lat: number, lng: number, accuracy?: number, speed?: number, heading?: number, timestamp?: number }} position
 * @returns {Promise<{ lat: number, lng: number, accuracy?: number, speed?: number, heading?: number, timestamp?: number }>}
 */
export async function snapToRoad(position) {
  const ts = position.timestamp ?? Date.now();
  const point = { lat: position.lat, lng: position.lng, timestamp: ts };

  if (!isMapMatchingEnabled()) {
    return Promise.resolve({
      lat: position.lat,
      lng: position.lng,
      accuracy: position.accuracy,
      speed: position.speed,
      heading: position.heading,
      timestamp: ts,
    });
  }

  positionBuffer.push(point);
  if (positionBuffer.length > BUFFER_MAX) positionBuffer.shift();

  processBuffer();

  const now = Date.now();
  if (geometryCache && now - geometryCache.timestamp < CACHE_MAX_AGE_MS) {
    const projected = projectOntoGeometry(geometryCache.geometry, position);
    return Promise.resolve({
      lat: projected.lat,
      lng: projected.lng,
      accuracy: position.accuracy,
      speed: position.speed,
      heading: position.heading,
      timestamp: ts,
    });
  }

  return Promise.resolve({
    lat: position.lat,
    lng: position.lng,
    accuracy: position.accuracy,
    speed: position.speed,
    heading: position.heading,
    timestamp: ts,
  });
}

/**
 * Versión síncrona. Con feature flag: alimenta buffer, usa caché si existe; si no, identity.
 * El pipeline usa esta para no bloquear.
 *
 * @param {{ lat: number, lng: number, timestamp?: number }} position
 * @returns {{ lat: number, lng: number }}
 */
export function snapToRoadSync(position) {
  if (!isMapMatchingEnabled()) {
    return { lat: position.lat, lng: position.lng };
  }

  const ts = position.timestamp ?? Date.now();
  positionBuffer.push({ lat: position.lat, lng: position.lng, timestamp: ts });
  if (positionBuffer.length > BUFFER_MAX) positionBuffer.shift();
  processBuffer();

  const now = Date.now();
  const coords = geometryCache?.geometry;
  if (coords && Array.isArray(coords) && now - geometryCache.timestamp < CACHE_MAX_AGE_MS) {
    return projectOntoGeometry(coords, position);
  }

  return { lat: position.lat, lng: position.lng };
}
