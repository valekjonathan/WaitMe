import React, { useState, useEffect, useMemo } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Car, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import ParkingMap from '@/components/map/ParkingMap';
import UserCard from '@/components/cards/UserCard';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import MapFilters from '@/components/map/MapFilters';
import BottomNav from '@/components/BottomNav';
import NotificationManager from '@/components/NotificationManager';
import Header from '@/components/Header';

function buildDemoAlerts(centerLat, centerLng) {
  const offsets = [
    [0.0009, 0.0006],
    [-0.0007, 0.0008],
    [0.0011, -0.0005],
    [-0.0010, -0.0007],
    [0.0004, -0.0011],
    [-0.0004, 0.0012]
  ];

  const base = [
    {
      id: 'demo_1',
      user_name: 'Sofía',
      user_photo: 'https://randomuser.me/api/portraits/women/44.jpg',
      car_brand: 'SEAT',
      car_model: 'Ibiza',
      car_color: 'blanco',
      car_plate: '1234 KLM',
      vehicle_type: 'car',
      price: 3,
      available_in_minutes: 6,
      address: 'Calle Uría, Oviedo'
    },
    {
      id: 'demo_2',
      user_name: 'Marco',
      user_photo: 'https://randomuser.me/api/portraits/men/32.jpg',
      car_brand: 'Volkswagen',
      car_model: 'Golf',
      car_color: 'negro',
      car_plate: '5678 HJP',
      vehicle_type: 'car',
      price: 5,
      available_in_minutes: 10,
      address: 'Calle Fray Ceferino, Oviedo'
    }
  ];

  return base.map((a, i) => {
    const [dLat, dLng] = offsets[i] || [0, 0];
    return {
      ...a,
      latitude: centerLat + dLat,
      longitude: centerLng + dLng,
      allow_phone_calls: false,
      phone: null,
      is_demo: true
    };
  });
}

export default function Home() {
  const [mode, setMode] = useState(null); // null | search | create
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, alert: null });
  const [user, setUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxPrice: 7,
    maxMinutes: 25,
    maxDistance: 1
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {}
    };
    fetchUser();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      setUserLocation([latitude, longitude]);
      setSelectedPosition({ lat: latitude, lng: longitude });
    });
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const demoAlerts = useMemo(() => {
    const fallback = [43.3619, -5.8494];
    const lat = userLocation?.[0] ?? fallback[0];
    const lng = userLocation?.[1] ?? fallback[1];
    return buildDemoAlerts(lat, lng);
  }, [userLocation]);

  const handleBuyAlert = (alert) => {
    if (!alert || alert.is_demo) return;
    setConfirmDialog({ open: true, alert });
  };

  const handleChat = (alert) => {
    if (!alert || alert.is_demo) return;
    window.location.href = createPageUrl(`Chat?alertId=${alert.id}`);
  };

  const handleCall = (alert) => {
    if (!alert || alert.is_demo) return;
    if (alert.phone) window.location.href = `tel:${alert.phone}`;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <NotificationManager user={user} />

      <Header
        title="WaitMe!"
        showBackButton={!!mode}
        onBack={() => {
          setMode(null);
          setSelectedAlert(null);
        }}
      />

      <main className="fixed inset-0">
        <AnimatePresence mode="wait">
          {!mode && (
            <motion.div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <ParkingMap
                  alerts={demoAlerts}
                  userLocation={userLocation}
                  zoomControl={false}
                />
              </div>

              <div className="absolute inset-0 bg-purple-900/40 pointer-events-none"></div>

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
                  ¡ Estoy aparcado aquí !
                </Button>
              </div>
            </motion.div>
          )}

          {mode === 'search' && (
            <motion.div className="fixed inset-0 top-[60px] bottom-[88px] flex flex-col">
              <div className="h-[42%] relative px-3 pt-1">
                <ParkingMap
                  alerts={demoAlerts}
                  onAlertClick={setSelectedAlert}
                  userLocation={userLocation}
                  selectedAlert={selectedAlert}
                  zoomControl={true}
                />
              </div>

              <div className="flex-1 px-4 overflow-y-auto">
                <UserCard
                  alert={selectedAlert}
                  userLocation={userLocation}
                  mode="search"
                  onPrimaryAction={() => handleBuyAlert(selectedAlert)}
                  onChat={() => handleChat(selectedAlert)}
                  onCall={() => handleCall(selectedAlert)}
                />
              </div>
            </motion.div>
          )}

          {mode === 'create' && (
            <motion.div className="fixed inset-0 top-[60px] bottom-[88px] flex flex-col">
              <CreateAlertCard
                address={address}
                onAddressChange={setAddress}
                onUseCurrentLocation={getCurrentLocation}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />

      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ open, alert: confirmDialog.alert })}
      >
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirmar reserva</DialogTitle>
            <DialogDescription className="text-gray-400">
              Vas a enviar una solicitud por{' '}
              <span className="text-purple-400 font-bold">{confirmDialog.alert?.price}€</span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, alert: null })}
              className="flex-1 border-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => handleBuyAlert(confirmDialog.alert)}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}