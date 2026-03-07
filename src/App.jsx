import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { AppDeviceFrame } from '@/system/layout';
import Layout from './Layout';
import Login from '@/pages/Login';
import DemoFlowManager from '@/components/DemoFlowManager';
import LocationEngineStarter from '@/components/LocationEngineStarter';
import WaitMeRequestScheduler from '@/components/WaitMeRequestScheduler';
import IncomingRequestModal from '@/components/IncomingRequestModal';
import { useAuth } from '@/lib/AuthContext';
import { getSupabase } from '@/lib/supabaseClient';

const OAuthDebug = import.meta.env.DEV || import.meta.env.VITE_DEBUG_OAUTH === 'true';

async function processOAuthUrl(url, onSuccess) {
  if (OAuthDebug)
    console.log(
      '[OAuth] processOAuthUrl called, url:',
      url ? url.slice(0, 80) + (url.length > 80 ? '...' : '') : '(empty)'
    );

  const allowed = [
    'capacitor://localhost',
    'com.waitme.app://',
    'com.waitme.app://auth/callback',
    'http://localhost:5173',
    'http://localhost:5173/',
  ];
  if (!url || !allowed.some((p) => url.startsWith(p))) {
    if (OAuthDebug && url) console.log('[OAuth] URL rejected (not in allowed)');
    return false;
  }
  try {
    await Browser.close();
  } catch {
    /* no-op */
  }
  const supabase = getSupabase();
  if (!supabase) {
    if (OAuthDebug) console.error('[OAuth] getSupabase() returned null');
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
      if (OAuthDebug) console.log('[OAuth] exchangeCodeForSession executing...');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        if (OAuthDebug) console.log('[OAuth] exchangeCodeForSession OK, session:', !!data?.session);
        onSuccess?.();
        return true;
      }
      if (OAuthDebug) console.error('[OAuth] exchangeCodeForSession failed:', error?.message);
    }
  }

  // Implicit: #access_token=...&refresh_token=...
  const hash = hashIdx !== -1 ? url.slice(hashIdx + 1) : '';
  if (!hash) return false;
  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return false;
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) return false;
  onSuccess?.();
  return true;
}

function AuthRouter() {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return <div style={{ background: '#000', color: '#fff', padding: 24 }}>Cargando...</div>;
  }

  if (!user?.id) {
    return <Login />;
  }

  return (
    <>
      <LocationEngineStarter />
      <DemoFlowManager />
      <WaitMeRequestScheduler />
      <IncomingRequestModal />
      <Layout />
    </>
  );
}

export default function App() {
  const { checkUserAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const initStatusBar = async () => {
      try {
        const { StatusBar } = await import('@capacitor/status-bar');
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch {
        // No-op en web / entorno no-Capacitor
      }
    };
    initStatusBar();
  }, []);

  const capacitorSubRef = useRef(null);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const onOAuthSuccess = () => {
      checkUserAuth();
      navigate('/', { replace: true });
    };
    const handleUrl = async (url) => {
      await processOAuthUrl(url, onOAuthSuccess);
    };
    const handleAppUrlOpen = ({ url }) => {
      if (OAuthDebug)
        console.log(
          '[OAuth] appUrlOpen received:',
          url ? url.slice(0, 80) + (url.length > 80 ? '...' : '') : '(empty)'
        );
      handleUrl(url);
    };
    (async () => {
      try {
        capacitorSubRef.current = await CapacitorApp.addListener('appUrlOpen', handleAppUrlOpen);
        if (OAuthDebug) console.log('[OAuth] appUrlOpen listener registered');
      } catch (e) {
        console.error('Capacitor listener error', e);
      }
    })();
    CapacitorApp.getLaunchUrl()
      .then((result) => {
        if (result?.url) {
          if (OAuthDebug) console.log('[OAuth] getLaunchUrl:', result.url?.slice(0, 80));
          handleUrl(result.url);
        }
      })
      .catch(() => {});
    return () => capacitorSubRef.current?.remove?.();
  }, [checkUserAuth, navigate]);

  return (
    <AppDeviceFrame>
      <div
        className="min-h-[100dvh] bg-black flex flex-col"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <AuthRouter />
      </div>
    </AppDeviceFrame>
  );
}
