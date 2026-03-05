/**
 * Punto único de entrada para Supabase.
 * Inicialización LAZY: no se crea el cliente hasta que se llama getSupabase().
 * Si faltan envs, getSupabase() devuelve null (no lanza).
 */
import { createClient } from "@supabase/supabase-js";

let _client = null;

export function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const missing = [];
  if (!url || String(url).trim() === "") missing.push("VITE_SUPABASE_URL");
  if (!anonKey || String(anonKey).trim() === "") missing.push("VITE_SUPABASE_ANON_KEY");
  const ok = missing.length === 0;
  return { url: url || "", anonKey: anonKey || "", ok, missing };
}

export function getSupabase() {
  const config = getSupabaseConfig();
  if (!config.ok) return null;
  if (_client) return _client;
  try {
    _client = createClient(config.url, config.anonKey);
    return _client;
  } catch {
    return null;
  }
}
