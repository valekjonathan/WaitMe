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
import { authTrace, updateAuthDebug } from '@/lib/authTrace';

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
  authTrace(4, 'oauthCapture.js', 'processOAuthUrl', 'processOAuthUrl start', url || '(empty)');
  if (!url || !ALLOWED_PREFIXES.some((p) => url.startsWith(p))) {
    authTrace(4, 'oauthCapture.js', 'processOAuthUrl', 'URL rejected (not in allowed list)');
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
      authTrace(5, 'oauthCapture.js', 'processOAuthUrl', 'exchangeCodeForSession executing');
      console.log('[AUTH TRACE] exchange executing, code length:', code.length);
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        console.log('[AUTH TRACE] exchange result: success');
        authTrace(5, 'oauthCapture.js', 'processOAuthUrl', 'exchangeCodeForSession success');
        let session = data?.session;
        authTrace(
          6,
          'oauthCapture.js',
          'processOAuthUrl',
          'session after exchange',
          !!session,
          session?.user?.email ?? session?.user?.id
        );
        // Forzar getSession y setSession para actualizar headers del cliente (workaround iOS #1566)
        const { data: s } = await supabase.auth.getSession();
        console.log('[AUTH TRACE] session exists:', !!s?.session);
        if (s?.session) {
          session = s.session;
          const { error: setErr } = await supabase.auth.setSession({
            access_token: s.session.access_token,
            refresh_token: s.session.refresh_token,
          });
          if (!setErr) {
            console.log('[AUTH TRACE] setSession forced (headers refresh)');
          }
        }
        authTrace(
          6,
          'oauthCapture.js',
          'processOAuthUrl',
          'getSession after exchange',
          !!s?.session
        );
        updateAuthDebug({
          exchangeSuccess: true,
          sessionExists: !!s?.session,
          oauthProcessedBy: 'oauthCapture.js',
        });
        window.__WAITME_OAUTH_SESSION = session ?? s?.session ?? null;
        window.__WAITME_OAUTH_COMPLETE = true;
        window.dispatchEvent(
          new CustomEvent('waitme:oauth-complete', { detail: { session: session ?? s?.session } })
        );
        console.log('[AUTH TRACE] user set, oauth complete event dispatched');
        authTrace(6, 'oauthCapture.js', 'processOAuthUrl', 'oauth complete event dispatched');
        return true;
      }
      console.log('[AUTH TRACE] exchange error', error?.message, error?.code);
      authTrace(
        5,
        'oauthCapture.js',
        'processOAuthUrl',
        'exchangeCodeForSession error',
        error?.message,
        error?.code
      );
      updateAuthDebug({ exchangeSuccess: false, lastAuthError: error?.message });
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
        authTrace(5, 'oauthCapture.js', 'processOAuthUrl', 'setSession success');
        authTrace(6, 'oauthCapture.js', 'processOAuthUrl', 'session after setSession', true);
        updateAuthDebug({
          exchangeSuccess: true,
          sessionExists: true,
          oauthProcessedBy: 'oauthCapture.js',
        });
        window.__WAITME_OAUTH_COMPLETE = true;
        window.dispatchEvent(new CustomEvent('waitme:oauth-complete'));
        authTrace(6, 'oauthCapture.js', 'processOAuthUrl', 'oauth complete event dispatched');
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
      // 1) Listener para callback cuando Safari vuelve a la app (iOS: suele llegar por aquí)
      CapacitorApp.addListener('appUrlOpen', async (event) => {
        const url = event?.url;
        if (!url) return;
        console.log('[OAuth TRACE] appUrlOpen:', url?.slice(0, 80));
        authTrace(
          3,
          'oauthCapture.js',
          'initOAuthCapture',
          'appUrlOpen received',
          url || '(empty)'
        );
        updateAuthDebug({ callbackReceived: true, callbackSource: 'appUrlOpen' });
        await processOAuthUrl(url);
      });

      // 2) Lectura inicial (cold start: app abierta por la URL OAuth)
      const launch = await CapacitorApp.getLaunchUrl();
      console.log('[OAuth TRACE] launch url', launch?.url ?? '(empty)');
      authTrace(
        2,
        'oauthCapture.js',
        'initOAuthCapture',
        'getLaunchUrl result',
        launch?.url || '(empty)'
      );
      if (launch?.url) {
        updateAuthDebug({ callbackReceived: true, callbackSource: 'getLaunchUrl' });
        await processOAuthUrl(launch.url);
      } else {
        console.log('[OAuth] getLaunchUrl empty');
      }
    } catch (e) {
      authTrace(2, 'oauthCapture.js', 'initOAuthCapture', 'getLaunchUrl/init error', e?.message);
      updateAuthDebug({ lastAuthError: e?.message });
    }
  })();
}
