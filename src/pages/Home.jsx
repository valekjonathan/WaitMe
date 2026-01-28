// src/pages/Home.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Car, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import ParkingMap from '@/components/map/ParkingMap';
import UserAlertCard from '@/components/cards/UserAlertCard';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import MapFilters from '@/components/map/MapFilters';
import BottomNav from '@/components/BottomNav';
import NotificationManager from '@/components/NotificationManager';
import Header from '@/components/Header';

function buildDemoAlerts(centerLat, centerLng) {
  const offsets = [
    [0.0009, 0.0008],
    [-0.0009, -0.0009],
    [0.0009, -0.0008],
    [-0.0009, 0.0008],
  ];
  // ... resto de la función sin cambios
}

// ...

export default function Home() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState(initialMode || null); // null, 'search', 'create'
  // ... resto de estados y hooks

  const [userLocation, setUserLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    // Obtiene geolocalización
    const getCurrentLocation = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => {}
      );
    };
    getCurrentLocation();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <Header title="WaitMe!" unreadCount={unreadCount} showBackButton={!!mode} onBack={() => setMode(null)} />
      {/* HOME PRINCIPAL (overlay con botones) */}
      <AnimatePresence mode="wait">
        {mode === null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-[60px] bottom-[88px] flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Mapa de fondo semi-transparente */}
            <div className="absolute top-0 left-0 right-0 bottom-0 opacity-20 pointer-events-none">
              <ParkingMap
                alerts={homeMapAlerts}
                userLocation={userLocation}
                className="absolute inset-0 w-full h-full"
                zoomControl={false}
              />
            </div>
            <div className="absolute inset-0 bg-purple-900/40 pointer-events-none"></div>
            {/* Contenedor centrado con logo, título y botones */}
            <div className="text-center w-full flex flex-col items-center relative z-10 px-6">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png"
                alt="WaitMe!"
                className="w-32 h-32 mb-4"
              />
              <h1 className="text-white text-3xl font-bold mb-8">WaitMe!</h1>
              <Button
                onClick={() => setMode('search')}
                className="w-full h-20 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white px-3 font-medium rounded-2xl flex items-center justify-center gap-4"
                leftIcon={<MapPin size={18} />}
              >
                ¿ Dónde quieres aparcar ?
              </Button>
              <Button
                onClick={() => setMode('create')}
                className="w-full h-20 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white px-3 font-medium rounded-2xl flex items-center justify-center gap-4 mt-4"
              >
                <Car className="w-14 h-14" strokeWidth={2.5} />
                ¡ Estoy aparcado aquí !
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PANTALLA DE BÚSQUEDA (modo 'search') */}
      <AnimatePresence mode="wait">
        {mode === 'search' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-[60px] bottom-[88px] flex flex-col"
            style={{ overflow: 'hidden', height: 'calc(100vh - 148px)' }}
          >
            {/* Mapa con alertas */}
            <div className="h-[44%] relative px-3 pt-1 flex-shrink-0">
              <ParkingMap
                alerts={searchAlerts}
                onAlertClick={setSelectedAlert}
                userLocation={userLocation}
                selectedAlert={selectedAlert}
                showRoute={!!selectedAlert}
                zoomControl={true}
              />
              {/* Filtros */}
              <AnimatePresence>
                {showFilters && (
                  <MapFilters
                    onFilterChange={setFilters}
                    onClose={() => setShowFilters(false)}
                    alertsCount={searchAlerts.length}
                  />
                )}
              </AnimatePresence>
            </div>
            {/* Buscador de dirección */}
            <div className="px-4 py-2 flex-shrink-0">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar dirección..."
                  className="w-full bg-gray-900 border border-gray-700 text-white placeholder-gray-500 pl-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            {/* Tarjeta de alerta */}
            <div className="flex-1 px-4 pb-3 min-h-0 overflow-hidden flex items-start">
              <div className="w-full h-full">
                <UserAlertCard
                  alert={selectedAlert}
                  isEmpty={!selectedAlert}
                  onBuyAlert={handleBuyAlert}
                  onChat={handleChat}
                  onCall={handleCall}
                  isLoading={buyAlertMutation.isPending}
                  userLocation={userLocation}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
      <NotificationManager />
      {/* ... posibles diálogos y demás ... */}
    </div>
  );
}