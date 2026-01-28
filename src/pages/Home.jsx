import React, { useState, useEffect, useMemo } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

import ParkingMap from '@/components/map/ParkingMap';
import UserAlertCard from '@/components/cards/UserAlertCard';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import MapFilters from '@/components/map/MapFilters';
import BottomNav from '@/components/BottomNav';
import NotificationManager from '@/components/NotificationManager';
import Header from '@/components/Header';

export default function Home() {
  const queryClient = useQueryClient();

  // 🔴 AQUÍ ESTABA EL ERROR → initialMode NO EXISTE
  // ✅ Se inicializa correctamente
  const [mode, setMode] = useState(null); // null | 'search' | 'create'

  const [userLocation, setUserLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {}
    );
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <Header
        title="WaitMe!"
        showBackButton={!!mode}
        onBack={() => setMode(null)}
      />

      {/* ---------- HOME / DÓNDE QUIERES APARCAR ---------- */}
      <AnimatePresence mode="wait">
        {mode === null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-[60px] bottom-[88px] flex flex-col items-center justify-center overflow-hidden"
          >
            {/* MAPA FONDO */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <ParkingMap
                alerts={[]}
                userLocation={userLocation}
                zoomControl={false}
              />
            </div>

            <div className="absolute inset-0 bg-purple-900/40 pointer-events-none" />

            {/* CONTENIDO CENTRADO */}
            <div className="relative z-10 w-full px-6 flex flex-col items-center">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png"
                alt="WaitMe"
                className="w-32 h-32 mb-4"
              />

              <h1 className="text-white text-3xl font-bold mb-8">
                WaitMe!
              </h1>

              <Button
                onClick={() => setMode('search')}
                className="w-full h-20 bg-gray-900 border border-gray-700 text-white rounded-2xl flex items-center justify-center gap-4"
              >
                <MapPin />
                ¿ Dónde quieres aparcar ?
              </Button>

              <Button
                onClick={() => setMode('create')}
                className="w-full h-20 mt-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl flex items-center justify-center gap-4"
              >
                <Car />
                ¡ Estoy aparcado aquí !
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- MODO BUSCAR ---------- */}
      <AnimatePresence mode="wait">
        {mode === 'search' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-[60px] bottom-[88px] flex flex-col overflow-hidden"
          >
            <div className="h-[44%] px-3 pt-1">
              <ParkingMap
                alerts={[]}
                userLocation={userLocation}
                onAlertClick={setSelectedAlert}
                selectedAlert={selectedAlert}
              />
            </div>

            <div className="px-4 py-2">
              <input
                placeholder="Buscar dirección..."
                className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg"
              />
            </div>

            <div className="flex-1 px-4 pb-3 overflow-hidden">
              <UserAlertCard
                alert={selectedAlert}
                isEmpty={!selectedAlert}
                userLocation={userLocation}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- MODO CREAR ---------- */}
      <AnimatePresence mode="wait">
        {mode === 'create' && (
          <CreateAlertCard onBack={() => setMode(null)} />
        )}
      </AnimatePresence>

      <BottomNav />
      <NotificationManager />
    </div>
  );
}