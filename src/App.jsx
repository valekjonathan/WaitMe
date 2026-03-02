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
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '393px',
          height: '852px',
          overflow: 'hidden',
          position: 'relative',
          borderRadius: '48px',
          boxShadow: '0 0 0 2px #333, 0 0 40px rgba(0,0,0,0.8)',
        }}>
          {appContent}
        </div>
      </div>
    );
  }

  return appContent;
}
