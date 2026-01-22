import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ParkingMap from '@/components/map/ParkingMap';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import NotificationManager from '@/components/NotificationManager';

function buildDemoAlerts(lat, lng) {
  const offsets = [
    [0.0009, 0.0006], [-0.0007, 0.0008], [0.0011, -0.0005],
    [-0.0010, -0.0007], [0.0004, -0.0011], [-0.0004, 0.0012]
  ];
  return offsets.map((o, i) => ({
    id: `demo_${i}`,
    user_name: 'Demo',
    latitude: lat + o[0],
    longitude: lng + o[1],
    price: 3,
    available_in_minutes: 5,
    is_demo: true
  }));
}

export default function Home() {
  const [mode, setMode] = useState(null); // null | search | create
  const [userLocation, setUserLocation] = useState(null);

  /* RESET INMEDIATO */
  useEffect(() => {
    const reset = () => {
      if (mode !== null) setMode(null); // 👈 evita renders innecesarios
    };
    window.addEventListener('RESET_HOME', reset);
    return () => window.removeEventListener('RESET_HOME', reset);
  }, [mode]);

  /* GEO */
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(pos => {
      setUserLocation([pos.coords.latitude, pos.coords.longitude]);
    });
  }, []);

  const demoAlerts = useMemo(() => {
    const lat = userLocation?.[0] ?? 43.3619;
    const lng = userLocation?.[1] ?? -5.8494;
    return buildDemoAlerts(lat, lng);
  }, [userLocation]);

  return (
    <div className="min-h-screen bg-black text-white">
      <NotificationManager />

      <Header
        title="WaitMe!"
        showBackButton={!!mode}
        onBack={() => setMode(null)}
      />

      {/* MAPA DE FONDO — NUNCA SE DESMONTA */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <ParkingMap
          alerts={demoAlerts}
          userLocation={userLocation}
          zoomControl={false}
        />
      </div>

      <div className="fixed inset-0 bg-purple-900/40 pointer-events-none" />

      {/* HOME PRINCIPAL */}
      {!mode && (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-10">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png"
            className="w-48 h-48"
          />

          <div className="w-full max-w-sm px-6 space-y-4">
            <Button
              onClick={() => setMode('search')}
              className="w-full h-20 bg-gray-900 rounded-2xl text-lg"
            >
              ¿ Dónde quieres aparcar ?
            </Button>

            <Button
              onClick={() => setMode('create')}
              className="w-full h-20 bg-purple-600 rounded-2xl text-lg"
            >
              <Car className="mr-3" />
              ¡ Estoy aparcado aquí !
            </Button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}