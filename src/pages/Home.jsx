import React, { useState, useEffect, useMemo } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Car, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import ParkingMap from '@/components/map/ParkingMap';
import UserAlertCard from '@/components/cards/UserAlertCard';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import MapFilters from '@/components/map/MapFilters';
import BottomNav from '@/components/BottomNav';
import NotificationManager from '@/components/NotificationManager';
import Header from '@/components/Header';

/* ===================== DEMO ===================== */
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
    { id: 'demo_1', user_name: 'Sofía', car_brand: 'SEAT', car_model: 'Ibiza', car_color: 'blanco', car_plate: '1234 KLM', vehicle_type: 'car', price: 3, available_in_minutes: 6, address: 'Calle Uría, Oviedo' },
    { id: 'demo_2', user_name: 'Marco', car_brand: 'Volkswagen', car_model: 'Golf', car_color: 'negro', car_plate: '5678 HJP', vehicle_type: 'car', price: 5, available_in_minutes: 10, address: 'Calle Fray Ceferino, Oviedo' },
    { id: 'demo_3', user_name: 'Nerea', car_brand: 'Toyota', car_model: 'RAV4', car_color: 'azul', car_plate: '9012 LSR', vehicle_type: 'suv', price: 7, available_in_minutes: 14, address: 'Calle Campoamor, Oviedo' },
    { id: 'demo_4', user_name: 'David', car_brand: 'Renault', car_model: 'Trafic', car_color: 'gris', car_plate: '3456 JTZ', vehicle_type: 'van', price: 4, available_in_minutes: 4, address: 'Plaza de la Escandalera, Oviedo' }
  ];

  return base.map((a, i) => ({
    ...a,
    latitude: centerLat + (offsets[i]?.[0] || 0),
    longitude: centerLng + (offsets[i]?.[1] || 0),
    is_demo: true
  }));
}

/* ===================== HOME ===================== */
export default function Home() {
  const queryClient = useQueryClient();

  /* 🔴 FIX 1: user EXISTE */
  const [user, setUser] = useState(null);

  const [mode, setMode] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, alert: null });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ maxPrice: 7, maxMinutes: 25, maxDistance: 1 });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch {}
    };
    fetchUser();
  }, []);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadMessages', user?.email],
    queryFn: async () => {
      const msgs = await base44.entities.ChatMessage.filter({ receiver_id: user?.email, read: false });
      return msgs.length;
    },
    enabled: !!user?.email,
    refetchInterval: 5000
  });

  const { data: rawAlerts = [] } = useQuery({
    queryKey: ['parkingAlerts'],
    queryFn: () => base44.entities.ParkingAlert.filter({ status: 'active' }),
    enabled: mode === 'search',
    refetchInterval: mode === 'search' ? 5000 : false
  });

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setUserLocation([p.coords.latitude, p.coords.longitude]),
      () => {},
      { enableHighAccuracy: true }
    );
  }, []);

  const homeMapAlerts = useMemo(() => {
    const center = userLocation || [43.3619, -5.8494];
    return buildDemoAlerts(center[0], center[1]);
  }, [userLocation]);

  const searchAlerts = useMemo(() => {
    if (rawAlerts.length) return rawAlerts;
    const center = userLocation || [43.3619, -5.8494];
    return buildDemoAlerts(center[0], center[1]);
  }, [rawAlerts, userLocation]);

  return (
    <div className="min-h-screen bg-black text-white">
      <NotificationManager user={user} />

      <Header
        title="WaitMe!"
        unreadCount={unreadCount}
        showBackButton={!!mode}
        onBack={() => {
          setMode(null);
          setSelectedAlert(null);
        }}
      />

      {/* 🔴 FIX 2: MAPA PERSISTENTE → NO PANTALLA BLANCA */}
      <div
        className="fixed inset-0"
        style={{ top: '60px', bottom: '88px', display: mode ? 'block' : 'none', zIndex: 0 }}
      >
        <ParkingMap
          alerts={mode === 'search' ? searchAlerts : []}
          userLocation={userLocation}
          onAlertClick={setSelectedAlert}
          selectedAlert={selectedAlert}
          showRoute={!!selectedAlert}
          isSelecting={mode === 'create'}
          selectedPosition={selectedPosition}
          setSelectedPosition={setSelectedPosition}
          zoomControl
          className="h-full"
        />
      </div>

      <main className="fixed inset-0">
        <AnimatePresence>
          {!mode && (
            <motion.div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <ParkingMap alerts={homeMapAlerts} userLocation={userLocation} zoomControl={false} />
              </div>

              <Button onClick={() => setMode('search')} className="mb-4 h-20 w-72 bg-gray-900">
                ¿Dónde quieres aparcar?
              </Button>
              <Button onClick={() => setMode('create')} className="h-20 w-72 bg-purple-600">
                ¡Estoy aparcado aquí!
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}