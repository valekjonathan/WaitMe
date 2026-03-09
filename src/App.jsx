import { useEffect } from 'react';
import { AppDeviceFrame } from '@/system/layout';
import Layout from './Layout';
import Login from '@/pages/Login';
import DemoFlowManager from '@/components/DemoFlowManager';
import LocationEngineStarter from '@/components/LocationEngineStarter';
import WaitMeRequestScheduler from '@/components/WaitMeRequestScheduler';
import IncomingRequestModal from '@/components/IncomingRequestModal';
import { useAuth } from '@/lib/AuthContext';
import { bootLog } from '@/lib/bootLogger';

function AuthRouter() {
  const { user, isLoadingAuth } = useAuth();
  const dest = !user?.id ? 'login' : 'home';
  bootLog('[BOOT 3] auth loading', isLoadingAuth);
  console.log('[AUTH LOAD 11] App router loading/login/home ->', dest);

  if (isLoadingAuth) {
    return <div style={{ background: '#000', color: '#fff', padding: 24 }}>Cargando...</div>;
  }

  if (!user?.id) {
    bootLog('[BOOT 5] login rendered');
    return <Login />;
  }

  bootLog('[BOOT 6] home rendered');
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

  const showMarker = typeof __SHOW_BUILD_MARKER__ !== 'undefined' && __SHOW_BUILD_MARKER__;
  useEffect(() => {
    if (showMarker) bootLog('[BOOT 2] build marker visible');
  }, [showMarker]);

  return (
    <AppDeviceFrame>
      <div
        className="min-h-[100dvh] bg-black flex flex-col"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {showMarker && (
          <div
            style={{
              position: 'fixed',
              top: 'max(44px, env(safe-area-inset-top, 0px))',
              left: 0,
              zIndex: 2147483647,
              background: '#0f172a',
              color: '#22d3ee',
              fontSize: 11,
              fontFamily: 'monospace',
              padding: '6px 8px',
              borderRight: '3px solid #22d3ee',
              borderBottom: '3px solid #22d3ee',
              whiteSpace: 'nowrap',
              boxShadow: '2px 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            WAITME RUNTIME CHECK
            <br />
            BUILD: {typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : '?'}
          </div>
        )}
        <AuthRouter />
      </div>
    </AppDeviceFrame>
  );
}
