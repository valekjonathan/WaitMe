import React from 'react';
import Layout from './Layout';
import DemoFlowManager from '@/components/DemoFlowManager';

export default function App() {
  return (
    <div className="min-h-[100dvh] bg-black pb-[env(safe-area-inset-bottom)]">
      {/* Arranca el flujo demo y mantiene datos sincronizados (sin UI extra) */}
      <DemoFlowManager />
      <Layout />
    </div>
  );
}
