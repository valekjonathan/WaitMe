import React, { useEffect, useRef } from 'react';
import Layout from './Layout';
import DemoFlowManager from '@/components/DemoFlowManager';
import { useAuth } from '@/lib/AuthContext';

/**
 * Igualar la app al "preview" de Base44:
 * - Base size: 390x844
 * - Escala para encajar en cualquier móvil manteniendo proporción
 *
 * Y además: si no hay sesión, fuerza login (para que Perfil tenga datos).
 */
export default function App() {
  const { user, isLoadingAuth, navigateToLogin } = useAuth();
  const redirectedRef = useRef(false);

  // Escalado tipo preview
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

  // Guardia de autenticación (evita perfil vacío / sin datos)
  useEffect(() => {
    if (redirectedRef.current) return;
    if (isLoadingAuth) return;

    // Si no hay usuario autenticado, redirige a login del SDK
    if (!user) {
      redirectedRef.current = true;
      navigateToLogin();
    }
  }, [user, isLoadingAuth, navigateToLogin]);

  return (
    <div className="wm-screen">
      <DemoFlowManager />

      <div className="wm-stage">
        <div className="wm-app">
          <Layout />
        </div>
      </div>
    </div>
  );
}
