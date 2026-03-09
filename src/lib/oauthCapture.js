/**
 * OAuth callback — ÚNICO punto oficial de procesamiento.
 * Registrado en main.jsx lo antes posible (antes de React).
 * En iOS: appUrlOpen y getLaunchUrl pueden dispararse antes de que App monte.
 * NO hay otro sitio que procese la URL OAuth.
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

const OAUTH_LOG = (msg, ...args) => {
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_OAUTH === 'true') {
    console.log(`[OAuth] ${msg}`, ...args);
  }
};

async function processOAuthUrl(url) {
  OAUTH_LOG('processOAuthUrl start, url:', url || '(empty)');
  if (!url || !ALLOWED_PREFIXES.some((p) => url.startsWith(p))) {
    OAUTH_LOG('URL rejected (not in allowed list)');
    return false;
  }
  try {
    await Browser.close();
  } catch {
    /* no-op */
  }
  const supabase = getSupabase();
  if (!supabase) {
    console.error('[OAuth] getSupabase() returned null');
    return false;
  }

  const hashIdx = url.indexOf('#');
  const queryIdx = url.indexOf('?');

  // PKCE: ?code=xxx (Supabase redirect con flowType: 'pkce')
  if (queryIdx !== -1) {
    const queryEnd = hashIdx !== -1 ? hashIdx : url.length;
    const params = new URLSearchParams(url.slice(queryIdx + 1, queryEnd));
    const code = params.get('code');
    if (code) {
      OAUTH_LOG('exchangeCodeForSession executing...');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        OAUTH_LOG('exchangeCodeForSession success');
        const session = data?.session;
        OAUTH_LOG(
          'session after exchange:',
          !!session,
          'user:',
          session?.user?.email ?? session?.user?.id ?? 'null'
        );
        const { data: s } = await supabase.auth.getSession();
        OAUTH_LOG('getSession after exchange:', !!s?.session);
        window.__WAITME_OAUTH_COMPLETE = true;
        window.dispatchEvent(new CustomEvent('waitme:oauth-complete'));
        OAUTH_LOG('oauth complete event dispatched');
        return true;
      }
      console.error('[OAuth] exchangeCodeForSession failed:', error?.message, error?.code);
    }
  }

  // Implicit: #access_token=...&refresh_token=...
  const hash = hashIdx !== -1 ? url.slice(hashIdx + 1) : '';
  if (hash) {
    const params = new URLSearchParams(hash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (!error) {
        OAUTH_LOG('setSession success');
        OAUTH_LOG('session after setSession:', true);
        window.__WAITME_OAUTH_COMPLETE = true;
        window.dispatchEvent(new CustomEvent('waitme:oauth-complete'));
        OAUTH_LOG('oauth complete event dispatched');
        return true;
      }
    }
  }
  return false;
}

export function initOAuthCapture() {
  if (typeof Capacitor === 'undefined' || !Capacitor.isNativePlatform()) return;
  (async () => {
    try {
      CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
        OAUTH_LOG('appUrlOpen received:', url || '(empty)');
        await processOAuthUrl(url);
      });
      const { url } = await CapacitorApp.getLaunchUrl();
      if (url) {
        OAUTH_LOG('getLaunchUrl received:', url);
        await processOAuthUrl(url);
      }
    } catch (e) {
      console.error('[OAuth] initOAuthCapture error:', e);
    }
  })();
}
