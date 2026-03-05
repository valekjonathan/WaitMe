import React, { useEffect } from 'react';
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

function AuthRouter() {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) return <div style={{ background: '#000', color: '#fff', padding: 24 }}>Cargando...</div>;

  if (!user?.id) return <Login />;

  return (
    <>
      <DemoFlowManager />
      <WaitMeRequestScheduler />
      <IncomingRequestModal />
      <Layout />
    </>
  );
}

export default function App() {
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
    const handleAppUrlOpen = async ({ url }) => {
      if (url?.startsWith('capacitor://localhost')) {
        try {
          await Browser.close();
        } catch {
          // No-op si Browser no está abierto
        }
        const hash = url.includes('#') ? url.slice(url.indexOf('#')) : '';
        if (hash) {
          const supabase = getSupabase();
          if (supabase) {
            const params = new URLSearchParams(hash.slice(1));
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            if (accessToken && refreshToken) {
              await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            }
          }
        }
      }
    };
    let sub;
    CapacitorApp.addListener('appUrlOpen', handleAppUrlOpen).then((s) => (sub = s));
    return () => sub?.remove?.();
  }, []);

  return (
    <div
      className="min-h-[100dvh] bg-black flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <AuthRouter />
    </div>
  );
}
