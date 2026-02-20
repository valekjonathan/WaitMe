import React, { useEffect, useRef } from 'react';
import Layout from './Layout';
import GlobalExpiryManager from '@/components/GlobalExpiryManager';
import DemoFlowManager from '@/components/DemoFlowManager';
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
  return (
    <div className="min-h-[100dvh] bg-black flex flex-col">
      <DemoFlowManager />
      <AuthGate />
      <GlobalExpiryManager />
      <Layout />
    </div>
  );
}
