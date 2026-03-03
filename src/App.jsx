import React, { useEffect, useRef } from 'react';
import Layout from './Layout';
import DemoFlowManager from '@/components/DemoFlowManager';
import WaitMeRequestScheduler from '@/components/WaitMeRequestScheduler';
import IncomingRequestModal from '@/components/IncomingRequestModal';
import { useAuth } from '@/lib/AuthContext';


function AuthGate() {
  const { user, isLoadingAuth, navigateToLogin } = useAuth();
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;
    if (isLoadingAuth) return;
    if (!user) {
      redirected.current = true;
      navigateToLogin();
    }
  }, [user, isLoadingAuth, navigateToLogin]);

  return null;
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

  return (
    <div
      className="min-h-[100dvh] bg-black flex flex-col"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <DemoFlowManager />
      <WaitMeRequestScheduler />
      <IncomingRequestModal />
      <AuthGate />
      <Layout />
    </div>
  );
}
