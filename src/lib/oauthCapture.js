/**
 * OAuth callback — ÚNICO punto de procesamiento.
 * Solo llama exchangeCodeForSession. Supabase Auth maneja el resto.
 * AuthContext detecta SIGNED_IN via onAuthStateChange.
 */
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { getSupabase } from '@/lib/supabaseClient';

const ALLOWED_PREFIXES = [
  'capacitor://localhost',
  'com.waitme.app://',
  'com.waitme.app://auth/callback',
  'http://localhost:5173',
  'http://localhost:5173/',
];

async function processOAuthUrl(url) {
  if (!url || !ALLOWED_PREFIXES.some((p) => url.startsWith(p))) {
    return false;
  }
  try {
    await Browser.close();
  } catch {
    /* no-op */
  }
  const supabase = getSupabase();
  if (!supabase) {
    return false;
  }

  const hashIdx = url.indexOf('#');
  const queryIdx = url.indexOf('?');

  // PKCE: ?code=xxx — Supabase API espera el code, no la URL
  if (queryIdx !== -1) {
    const queryEnd = hashIdx !== -1 ? hashIdx : url.length;
    const params = new URLSearchParams(url.slice(queryIdx + 1, queryEnd));
    const code = params.get('code');
    if (code) {
      console.log('[AUTH FORENSIC 1] callback received');
      console.log('[AUTH FORENSIC 2] exchange start, code length:', code.length);
      const { data: exchangeData, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.log('[AUTH FORENSIC 3] exchange error:', error?.message);
        return false;
      }
      console.log('[AUTH FORENSIC 3] exchange success');
      // Workaround Supabase #1566: forzar getSession+setSession para actualizar headers en iOS
      const { data: sessionData } = await supabase.auth.getSession();
      const hasSession = !!sessionData?.session;
      console.log('[AUTH FORENSIC 4] getSession after exchange:', hasSession);
      if (hasSession) {
        await supabase.auth.setSession({
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
        });
      }
      return true;
    }
  }

  // Implicit: #access_token=...&refresh_token=...
  const hash = hashIdx !== -1 ? url.slice(hashIdx + 1) : '';
  if (hash) {
    const params = new URLSearchParams(hash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      console.log('[AUTH FIX] oauth callback detected (implicit)');
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      console.log('[AUTH FIX] exchange executed', error ? `error: ${error.message}` : 'success');
      return !error;
    }
  }
  return false;
}

export function initOAuthCapture() {
  if (typeof Capacitor === 'undefined' || !Capacitor.isNativePlatform()) return;
  (async () => {
    try {
      CapacitorApp.addListener('appUrlOpen', async (event) => {
        const url = event?.url;
        if (url) await processOAuthUrl(url);
      });

      const launch = await CapacitorApp.getLaunchUrl();
      if (launch?.url) {
        await processOAuthUrl(launch.url);
      }
    } catch (e) {
      console.error('[AUTH FIX] init error', e?.message);
    }
  })();
}
