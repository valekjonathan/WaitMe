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

/* ===================== FIX DEFINITIVO MAPA ===================== */
const safeAlerts = (alerts = []) =>
  alerts.filter(
    (a) =>
      typeof a?.latitude === 'number' &&
      typeof a?.longitude === 'number' &&
      !Number.isNaN(a.latitude) &&
      !Number.isNaN(a.longitude)
  );
/* =============================================================== */

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
    },
    {
      id: 'demo_3',
      user_name: 'Nerea',
      user_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
      car_brand: 'Toyota',
      car_model: 'RAV4',
      car_color: 'azul',
      car_plate: '9012 LSR',
      vehicle_type: 'suv',
      price: 7,
      available_in_minutes: 14,
      address: 'Calle Campoamor, Oviedo'
    },
    {
      id: 'demo_4',
      user_name: 'David',
      user_photo: 'https://randomuser.me/api/portraits/men/19.jpg',
      car_brand: 'Renault',
      car_model: 'Trafic',
      car_color: 'gris',
      car_plate: '3456 JTZ',
      vehicle_type: 'van',
      price: 4,
      available_in_minutes: 4,
      address: 'Plaza de la Escandalera, Oviedo'
    },
    {
      id: 'demo_5',
      user_name: 'Lucía',
      user_photo: 'https://randomuser.me/api/portraits/women/12.jpg',
      car_brand: 'Peugeot',
      car_model: '208',
      car_color: 'rojo',
      car_plate: '7788 MNB',
      vehicle_type: 'car',
      price: 2,
      available_in_minutes: 3,
      address: 'Calle Rosal, Oviedo'
    },
    {
      id: 'demo_6',
      user_name: 'Álvaro',
      user_photo: 'https://randomuser.me/api/portraits/men/61.jpg',
      car_brand: 'Kia',
      car_model: 'Sportage',
      car_color: 'verde',
      car_plate: '2468 GHT',
      vehicle_type: 'suv',
      price: 6,
      available_in_minutes: 18,
      address: 'Calle Jovellanos, Oviedo'
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
  const urlParams = new URLSearchParams(window.location.search);
  const initialMode = urlParams.get('mode');

  const [mode, setMode] = useState(initialMode || null);
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
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: rawAlerts = [] } = useQuery({
    queryKey: ['parkingAlerts'],
    queryFn: () => base44.entities.ParkingAlert.filter({ status: 'active' }),
    enabled: mode === 'search',
    refetchInterval: mode === 'search' ? 5000 : false
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setSelectedPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: true }
    );
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

  const homeMapAlerts = demoAlerts;

  const searchAlerts = useMemo(() => {
    const merged = [...safeAlerts(rawAlerts)];
    const used = new Set(merged.map((a) => a.id));
    for (const d of demoAlerts) {
      if (merged.length >= 6) break;
      if (!used.has(d.id)) merged.push(d);
    }
    return merged.length ? merged : demoAlerts;
  }, [rawAlerts, demoAlerts]);

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
            <motion.div className="absolute inset-0">
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <ParkingMap
                  alerts={safeAlerts(homeMapAlerts)}
                  userLocation={userLocation}
                  className="absolute inset-0"
                  zoomControl={false}
                />
              </div>
              <div className="absolute inset-0 bg-purple-900/40" />
              <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 gap-6">
                <Button
                  onClick={() => setMode('search')}
                  className="w-full h-20 bg-gray-900 rounded-2xl text-lg"
                >
                  ¿Dónde quieres aparcar?
                </Button>
                <Button
                  onClick={() => setMode('create')}
                  className="w-full h-20 bg-purple-600 rounded-2xl text-lg"
                >
                  ¡Estoy aparcado aquí!
                </Button>
              </div>
            </motion.div>
          )}

          {mode === 'search' && (
            <motion.div className="fixed inset-0 top-[60px] bottom-[88px] flex flex-col">
              <div className="h-[45%] px-3 pt-2">
                <ParkingMap
                  alerts={safeAlerts(searchAlerts)}
                  onAlertClick={setSelectedAlert}
                  userLocation={userLocation}
                  selectedAlert={selectedAlert}
                  showRoute={!!selectedAlert}
                  zoomControl
                  className="h-full"
                />
              </div>

              <div className="flex-1 px-4 overflow-y-auto">
                <UserAlertCard
                  alert={selectedAlert}
                  isEmpty={!selectedAlert}
                  onBuyAlert={() => {}}
                  onChat={() => {}}
                  onCall={() => {}}
                  userLocation={userLocation}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}