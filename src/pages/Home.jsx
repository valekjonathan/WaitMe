import React, { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import appLogo from '@/assets/d2ae993d3_WaitMe.png';

export default function Home() {

  const queryClient = useQueryClient();

  const [mode, setMode] = useState(null);
  const [logoSrc, setLogoSrc] = useState(appLogo);
  const [logoRetryCount, setLogoRetryCount] = useState(0);

  const resetToLogo = useCallback(() => {
    setMode(null);
    queryClient.invalidateQueries();
  }, [queryClient]);

  useEffect(() => {
    const goLogo = () => resetToLogo();
    window.addEventListener('waitme:goLogo', goLogo);
    return () => window.removeEventListener('waitme:goLogo', goLogo);
  }, [resetToLogo]);

  useEffect(() => {
    const img = new Image();
    img.src = logoSrc;
  }, [logoSrc]);

  const handleLogoError = () => {
    if (logoRetryCount >= 1) return;
    setLogoRetryCount(c => c + 1);
    setLogoSrc(`${appLogo}?v=${Date.now()}`);
  };

  return (
    <div className="min-h-screen w-full bg-black text-white">

      <Header
        iconVariant="bottom"
        title="WaitMe!"
        showBackButton={!!mode}
        onBack={() => resetToLogo()}
      />

      <main className="flex items-center justify-center h-[80vh]">

        {!mode && (
          <div className="text-center">
            <img
              src={logoSrc}
              alt="WaitMe!"
              onError={handleLogoError}
              className="w-52 h-52 mx-auto"
            />

            <h1 className="text-4xl font-bold mt-4">
              Wait<span className="text-purple-500">Me!</span>
            </h1>

            <div className="mt-8 space-y-4">
              <button
                onClick={() => setMode('search')}
                className="w-72 h-16 bg-gray-900 border border-gray-700 rounded-2xl"
              >
                ¿ Dónde quieres aparcar ?
              </button>

              <button
                onClick={() => setMode('create')}
                className="w-72 h-16 bg-purple-600 rounded-2xl"
              >
                ¡ Estoy aparcado aquí !
              </button>
            </div>
          </div>
        )}

        {mode === 'search' && (
          <div className="text-center">
            <h2 className="text-xl">Pantalla Buscar</h2>
          </div>
        )}

        {mode === 'create' && (
          <div className="text-center">
            <h2 className="text-xl">Pantalla Crear</h2>
          </div>
        )}

      </main>

      <BottomNav />
    </div>
  );
}
