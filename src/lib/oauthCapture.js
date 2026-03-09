/**
 * Captura OAuth callback lo antes posible (antes de React).
 * Necesario para iOS: appUrlOpen/getLaunchUrl pueden dispararse antes de que App monte.
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
  console.log('[OAuth] callback URL:', url || '(empty)');
  if (!url || !ALLOWED_PREFIXES.some((p) => url.startsWith(p))) {
    console.log('[OAuth] URL rejected (not in allowed list)');
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

  if (queryIdx !== -1) {
    const queryEnd = hashIdx !== -1 ? hashIdx : url.length;
    const params = new URLSearchParams(url.slice(queryIdx + 1, queryEnd));
    const code = params.get('code');
    if (code) {
      console.log('[OAuth] exchangeCodeForSession executing...');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        console.log('[OAuth] exchangeCodeForSession success');
        console.log(
          '[OAuth] session user:',
          data?.session?.user?.email ?? data?.session?.user?.id ?? 'null'
        );
        window.__WAITME_OAUTH_COMPLETE = true;
        window.dispatchEvent(new CustomEvent('waitme:oauth-complete'));
        return true;
      }
      console.error('[OAuth] exchangeCodeForSession failed:', error?.message, error?.code);
    }
  }

  const hash = hashIdx !== -1 ? url.slice(hashIdx + 1) : '';
  if (hash) {
    const params = new URLSearchParams(hash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (!error) {
        console.log('[OAuth] setSession success');
        window.__WAITME_OAUTH_COMPLETE = true;
        window.dispatchEvent(new CustomEvent('waitme:oauth-complete'));
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
        console.log('[OAuth] appUrlOpen received:', url || '(empty)');
        await processOAuthUrl(url);
      });
      const { url } = await CapacitorApp.getLaunchUrl();
      if (url) {
        console.log('[OAuth] getLaunchUrl:', url);
        await processOAuthUrl(url);
      }
    } catch (e) {
      console.error('[OAuth] initOAuthCapture error:', e);
    }
  })();
}
