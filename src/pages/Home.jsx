import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Car } from 'lucide-react';

export default function Home() {
  const [mode, setMode] = useState(null); // null | 'search' | 'create'

  return (
    <div className="min-h-[100dvh] bg-black text-white">
      <Header title="WaitMe!" showBackButton={!!mode} onBack={() => setMode(null)} />

      <main className="pt-[60px] pb-[88px] px-6">
        {!mode && (
          <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-148px)]">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png"
              alt="WaitMe!"
              className="w-48 h-48 object-contain"
            />

            <h1 className="text-xl font-bold whitespace-nowrap -mt-3 mb-8 text-center">
              Aparca donde te <span className="text-purple-500">avisen!</span>
            </h1>

            <div className="w-full max-w-sm mx-auto space-y-4">
              <Button
                onClick={() => setMode('search')}
                className="w-full h-20 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-4"
              >
                ¿ Dónde quieres aparcar ?
              </Button>

              <Button
                onClick={() => setMode('create')}
                className="w-full h-20 bg-purple-600 hover:bg-purple-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-4"
              >
                <Car className="w-14 h-14" strokeWidth={2.5} />
                ¡ Estoy aparcado aquí !
              </Button>
            </div>
          </div>
        )}

        {mode === 'search' && (
          <div className="text-white">
            <p className="mb-4">MODO SEARCH (iPhone seguro). Ahora añadimos mapa.</p>
          </div>
        )}

        {mode === 'create' && (
          <div className="text-white">
            <p className="mb-4">MODO CREATE (iPhone seguro). Ahora añadimos mapa.</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}