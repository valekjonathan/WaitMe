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

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

export default function App() {
  const appContent = (
    <div className="min-h-[100dvh] bg-black flex flex-col">
      <DemoFlowManager />
      <WaitMeRequestScheduler />
      <IncomingRequestModal />
      <AuthGate />
      <Layout />
    </div>
  );

  if (isLocalhost) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000' }}>
        <div style={{
          width: '393px',
          height: '852px',
          margin: '0 auto',
          overflow: 'hidden',
        }}>
          {appContent}
        </div>
      </div>
    );
  }

  return appContent;
}
