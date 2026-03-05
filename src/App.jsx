import React, { useEffect } from 'react';
import Layout from './Layout';
import Login from '@/pages/Login';
import DemoFlowManager from '@/components/DemoFlowManager';
import WaitMeRequestScheduler from '@/components/WaitMeRequestScheduler';
import IncomingRequestModal from '@/components/IncomingRequestModal';
import { useAuth } from '@/lib/AuthContext';

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

  return (
    <div
      style={{
        background: "white",
        color: "black",
        fontSize: 40,
        padding: 40,
      }}
    >
      APP ARRANCÓ
    </div>
  );
}
