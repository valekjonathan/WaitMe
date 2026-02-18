import React from 'react';
import Layout from './Layout';
import DemoFlowManager from '@/components/DemoFlowManager';

export default function App() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-black">
      <DemoFlowManager />
      <Layout />
    </div>
  );
}