import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppDeviceFrame } from '@/system/layout';
import Layout from './Layout';
import Login from '@/pages/Login';
import DemoFlowManager from '@/components/DemoFlowManager';
import LocationEngineStarter from '@/components/LocationEngineStarter';
import WaitMeRequestScheduler from '@/components/WaitMeRequestScheduler';
import IncomingRequestModal from '@/components/IncomingRequestModal';
import { useAuth } from '@/lib/AuthContext';
import { authTrace, updateAuthDebug } from '@/lib/authTrace';

function AuthRouter() {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    authTrace(9, 'App.jsx', 'AuthRouter', 'auth check -> loading');
    return <div style={{ background: '#000', color: '#fff', padding: 24 }}>Cargando...</div>;
  }

  if (!user?.id) {
    authTrace(10, 'App.jsx', 'AuthRouter', 'navigation decision -> login (user null)');
    authTrace(12, 'App.jsx', 'AuthRouter', 'final route -> login');
    updateAuthDebug({ redirectReason: 'user null', currentRoute: 'login' });
    return <Login />;
  }

  authTrace(10, 'App.jsx', 'AuthRouter', 'navigation decision -> home');
  authTrace(12, 'App.jsx', 'AuthRouter', 'final route -> home');
  updateAuthDebug({ redirectReason: 'user ok', currentRoute: 'home' });

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

  useEffect(() => {
    const onOAuthSuccess = async () => {
      authTrace(9, 'App.jsx', 'onOAuthComplete', 'onSuccess -> checkUserAuth');
      await checkUserAuth();
      authTrace(10, 'App.jsx', 'onOAuthComplete', 'onSuccess -> navigate /');
      navigate('/', { replace: true });
    };

    const onOAuthComplete = () => {
      onOAuthSuccess();
    };

    window.addEventListener('waitme:oauth-complete', onOAuthComplete);

    // Si oauthCapture ya procesó la URL antes de que App montara (cold start iOS)
    if (window.__WAITME_OAUTH_COMPLETE) {
      window.__WAITME_OAUTH_COMPLETE = false;
      onOAuthSuccess();
    }

    return () => window.removeEventListener('waitme:oauth-complete', onOAuthComplete);
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
