import React from 'react';
import Layout from './Layout';
import DemoFlowManager from '@/components/DemoFlowManager';

export default function App() {
  return (
    <div className="min-h-[100dvh] bg-black flex justify-center">
      <div className="w-full max-w-[390px] min-h-[100dvh] bg-black flex flex-col">
        <DemoFlowManager />
        <Layout />
      </div>
    </div>
  );
}