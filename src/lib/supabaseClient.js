/**
 * Punto único de entrada para Supabase.
 * Inicialización LAZY: no se crea el cliente hasta que se llama getSupabase().
 * Si faltan envs, getSupabase() devuelve null (no lanza).
 * En iOS Capacitor usa Preferences para persistir la sesión.
 */
import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { updateAuthDebug } from '@/lib/authTrace';

let _client = null;

const capacitorStorage = {
  getItem: async (key) => {
    const { value } = await Preferences.get({ key });
    return value;
  },
  setItem: async (key, value) => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key) => {
    await Preferences.remove({ key });
  },
};

function getAuthOptions() {
  const base = {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  };
  try {
    if (typeof Capacitor !== 'undefined' && typeof Preferences !== 'undefined') {
      updateAuthDebug({ storageBackend: 'capacitor-preferences' });
      return {
        ...base,
        storage: capacitorStorage,
        flowType: 'pkce',
      };
    }
  } catch {
    /* Capacitor no disponible: usar storage por defecto */
  }
  updateAuthDebug({ storageBackend: 'default' });
  return base;
}

const PLACEHOLDERS = ['tu_anon_key', 'TU_PROYECTO'];

function isPlaceholder(val) {
  if (!val || typeof val !== 'string') return true;
  const v = val.trim();
  if (!v) return true;
  return PLACEHOLDERS.some((p) => v.includes(p) || v === p);
}

export function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const missing = [];
  if (!url || String(url).trim() === '' || isPlaceholder(url)) missing.push('VITE_SUPABASE_URL');
  if (!anonKey || String(anonKey).trim() === '' || isPlaceholder(anonKey))
    missing.push('VITE_SUPABASE_ANON_KEY');
  const ok = missing.length === 0;
  return { url: url || '', anonKey: anonKey || '', ok, missing };
}

export function getSupabase() {
  const config = getSupabaseConfig();
  if (!config.ok) return null;
  if (_client) return _client;
  try {
    _client = createClient(config.url, config.anonKey, {
      auth: getAuthOptions(),
    });
    return _client;
  } catch {
    return null;
  }
}

/**
 * Borra las claves de sesión de Supabase en Preferences (Capacitor).
 * Usar tras signOut para asegurar logout completo.
 */
export async function clearSupabaseAuthStorage() {
  try {
    if (typeof Preferences === 'undefined') return;
    const { keys } = await Preferences.keys();
    const supabaseKeys = (keys || []).filter((k) => k.startsWith('sb-'));
    await Promise.all(supabaseKeys.map((key) => Preferences.remove({ key })));
  } catch {
    /* no-op */
  }
}
