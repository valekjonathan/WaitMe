import React from 'react';
import Layout from './Layout';
import DemoFlowManager from '@/components/DemoFlowManager';

export default function App() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <DemoFlowManager />
      <Layout />
    </div>
  );
}
