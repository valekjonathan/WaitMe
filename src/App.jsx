import { useEffect } from 'react';
import { AppDeviceFrame } from '@/system/layout';
import Layout from './Layout';
import Login from '@/pages/Login';
import DemoFlowManager from '@/components/DemoFlowManager';
import LocationEngineStarter from '@/components/LocationEngineStarter';
import WaitMeRequestScheduler from '@/components/WaitMeRequestScheduler';
import IncomingRequestModal from '@/components/IncomingRequestModal';
import { useAuth } from '@/lib/AuthContext';

function AuthRouter() {
  const { user, isLoadingAuth } = useAuth();
  const redirectReason = !user?.id ? 'user null' : 'user ok';
  const dest = !user?.id ? 'login' : 'home';
  console.log('[AUTH FINAL 11] router ->', dest);
  console.log('[AUTH FINAL 12] exact redirect reason:', redirectReason);

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
