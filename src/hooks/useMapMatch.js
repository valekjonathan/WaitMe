/**
 * Acumula posiciones GPS y llama a map-match cada N segundos.
 * Devuelve posición corregida o fallback a raw.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { getSupabase } from '@/lib/supabaseClient';

const BUFFER_MS = 10000; // 10s ventana
const MATCH_INTERVAL_MS = 5000; // llamar cada 5s
const MIN_POINTS = 3;

export function useMapMatch(enabled = true) {
  const [corrected, setCorrected] = useState(null);
  const bufferRef = useRef([]);
  const lastMatchRef = useRef(0);

  const addPoint = useCallback((lat, lng, accuracy) => {
    if (!enabled) return;
    const point = { lat, lng, timestamp: Math.floor(Date.now() / 1000), accuracy };
    bufferRef.current = [...bufferRef.current, point].slice(-20);
    const cutoff = Date.now() - BUFFER_MS;
    bufferRef.current = bufferRef.current.filter((p) => p.timestamp * 1000 > cutoff);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const runMatch = async () => {
      const supabase = getSupabase();
      if (!supabase) return;

      const buf = bufferRef.current;
      if (buf.length < MIN_POINTS) return;

      const now = Date.now();
      if (now - lastMatchRef.current < MATCH_INTERVAL_MS) return;
      lastMatchRef.current = now;

      try {
        const { data, error } = await supabase.functions.invoke('map-match', {
          body: { points: buf.map((p) => ({ lat: p.lat, lng: p.lng, timestamp: p.timestamp })) },
        });
        if (error) throw error;
        const geom = data?.geometry;
        if (geom?.coordinates?.length) {
          const last = geom.coordinates[geom.coordinates.length - 1];
          const conf = data?.confidence ?? 0;
          setCorrected({ lng: last[0], lat: last[1], confidence: conf, accuracy: conf > 0.8 ? 5 : 15 });
        }
      } catch (err) {
        console.warn('[map-match] fallback to raw GPS', err);
        setCorrected(null);
      }
    };

    const id = setInterval(runMatch, MATCH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled]);

  return { addPoint, corrected };
}
