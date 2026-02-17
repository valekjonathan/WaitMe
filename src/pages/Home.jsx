import React, { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import appLogo from '@/assets/d2ae993d3_WaitMe.png';

export default function Home() {

  const [mode, setMode] = useState(null);
  const [logoError, setLogoError] = useState(false);

  // 🔥 Fuerza volver al logo SIEMPRE
  useEffect(() => {
    const forceHome = () => {
      setMode(null);
    };
    window.addEventListener('forceGoHome', forceHome);
    return () => window.removeEventListener('forceGoHome', forceHome);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">

      {!mode && (
        <div className="text-center">
          {!logoError && (
            <img
              src={appLogo}
              alt="WaitMe"
              className="w-52 h-52 mx-auto"
              onError={() => setLogoError(true)}
            />
          )}

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
        <div className="text-center mt-20">
          <h2 className="text-xl">Pantalla Buscar</h2>
        </div>
      )}

      {mode === 'create' && (
        <div className="text-center mt-20">
          <h2 className="text-xl">Pantalla Crear</h2>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
