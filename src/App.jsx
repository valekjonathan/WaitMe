import React, { useEffect } from 'react';
import Layout from './Layout';
import DemoFlowManager from '@/components/DemoFlowManager';

/**
 * Fuerza el mismo "viewport" que el Preview de Base44:
 * - Base size: 390x844 (aprox iPhone preview)
 * - Escala para encajar en cualquier móvil manteniendo proporción
 */
export default function App() {
  useEffect(() => {
    const BASE_W = 390;
    const BASE_H = 844;

    const setScale = () => {
      const w = window.innerWidth || BASE_W;
      const h = window.innerHeight || BASE_H;
      const scale = Math.min(w / BASE_W, h / BASE_H);
      document.documentElement.style.setProperty('--app-scale', String(scale));
    };

    setScale();
    window.addEventListener('resize', setScale);
    window.addEventListener('orientationchange', setScale);
    return () => {
      window.removeEventListener('resize', setScale);
      window.removeEventListener('orientationchange', setScale);
    };
  }, []);

  return (
    <div className="wm-screen">
      {/* Mantiene datos sincronizados (sin UI extra) */}
      <DemoFlowManager />

      <div className="wm-stage">
        <div className="wm-app">
          <Layout />
        </div>
      </div>
    </div>
  );
}
