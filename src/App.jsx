import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import Layout from './Layout';
import Login from '@/pages/Login';
import DemoFlowManager from '@/components/DemoFlowManager';
import WaitMeRequestScheduler from '@/components/WaitMeRequestScheduler';
import IncomingRequestModal from '@/components/IncomingRequestModal';
import { useAuth } from '@/lib/AuthContext';
import { getSupabase } from '@/lib/supabaseClient';

async function processOAuthUrl(url, onSuccess) {
  if (!url?.startsWith('capacitor://localhost')) return false;
  try {
    await Browser.close();
  } catch {
    /* no-op */
  }
  const hash = url.split('#')[1];
  if (!hash) return false;
  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return false;
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) return false;
  onSuccess?.();
  return true;
}

const RENDER_LOG = (msg, extra) => {
  if (import.meta.env.DEV) {
    try {
      console.log(`[RENDER:App:AuthRouter] ${msg}`, extra ?? '');
    } catch {}
  }
};

function AuthRouter() {
  try {
    const { user, isLoadingAuth } = useAuth();
    RENDER_LOG('AuthRouter ENTER', { hasUser: !!user?.id, isLoadingAuth });

    if (isLoadingAuth) {
      RENDER_LOG('AuthRouter RETURNS loading');
      return <div style={{ background: '#000', color: '#fff', padding: 24 }}>Cargando...</div>;
    }

    if (!user?.id) {
      RENDER_LOG('AuthRouter RETURNS Login (no user)');
      return <Login />;
    }

    RENDER_LOG('AuthRouter RETURNS Layout');
    return (
    <>
      <DemoFlowManager />
      <WaitMeRequestScheduler />
      <IncomingRequestModal />
      <Layout />
    </>
  );
  } catch (err) {
    RENDER_LOG('AuthRouter CATCH', err?.message ?? String(err));
    throw err;
  }
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

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const onOAuthSuccess = () => {
      checkUserAuth();
      navigate('/', { replace: true });
    };
    const handleUrl = async (url) => {
      await processOAuthUrl(url, onOAuthSuccess);
    };
    const handleAppUrlOpen = ({ url }) => handleUrl(url);
    let sub;
    CapacitorApp.addListener('appUrlOpen', handleAppUrlOpen).then((s) => (sub = s));
    CapacitorApp.getLaunchUrl().then((result) => {
      if (result?.url) handleUrl(result.url);
    }).catch(() => {});
    return () => sub?.remove?.();
  }, [checkUserAuth, navigate]);

  return (
    <div
      className="min-h-[100dvh] bg-black flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <AuthRouter />
    </div>
  );
}
