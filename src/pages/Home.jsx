import React, { useState, useEffect, useMemo } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Car, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import ParkingMap from '@/components/map/ParkingMap';
import ActiveAlertCard from '@/components/cards/ActiveAlertCard'; // 🔴 MISMO QUE HISTORY
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import MapFilters from '@/components/map/MapFilters';
import BottomNav from '@/components/BottomNav';
import NotificationManager from '@/components/NotificationManager';
import Header from '@/components/Header';

/* ===== FIX COORDENADAS ===== */
const safeAlerts = (alerts = []) =>
  alerts.filter(
    (a) =>
      typeof a?.latitude === 'number' &&
      typeof a?.longitude === 'number' &&
      !Number.isNaN(a.latitude) &&
      !Number.isNaN(a.longitude)
  );
/* ========================== */

function buildDemoAlerts(lat, lng) {
  const offsets = [
    [0.0009, 0.0006],
    [-0.0007, 0.0008],
    [0.0011, -0.0005],
    [-0.0010, -0.0007],
    [0.0004, -0.0011],
    [-0.0004, 0.0012]
  ];

  const users = [
    ['Sofía', 'https://randomuser.me/api/portraits/women/44.jpg', 3, 6],
    ['Marco', 'https://randomuser.me/api/portraits/men/32.jpg', 5, 10],
    ['Nerea', 'https://randomuser.me/api/portraits/women/68.jpg', 7, 14],
    ['David', 'https://randomuser.me/api/portraits/men/19.jpg', 4, 4],
    ['Lucía', 'https://randomuser.me/api/portraits/women/12.jpg', 2, 3],
    ['Álvaro', 'https://randomuser.me/api/portraits/men/61.jpg', 6, 18]
  ];

  return users.map((u, i) => ({
    id: `demo_${i}`,
    user_name: u[0],
    user_photo: u[1],
    car_brand: 'SEAT',
    car_model: 'Ibiza',
    car_color: 'gris',
    car_plate: '1234 KLM',
    vehicle_type: 'car',
    price: u[2],
    available_in_minutes: u[3],
    address: 'Oviedo',
    latitude: lat + offsets[i][0],
    longitude: lng + offsets[i][1],
    is_demo: true,
    status: 'active'
  }));
}

export default function Home() {
  const [mode, setMode] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxPrice: 7,
    maxMinutes: 25,
    maxDistance: 1
  });

  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setUserLocation([p.coords.latitude, p.coords.longitude]),
      () => {},
      { enableHighAccuracy: true }
    );
  }, []);

  const { data: rawAlerts = [] } = useQuery({
    queryKey: ['parkingAlerts'],
    queryFn: () => base44.entities.ParkingAlert.filter({ status: 'active' }),
    enabled: mode === 'search'
  });

  const demoAlerts = useMemo(() => {
    const lat = userLocation?.[0] ?? 43.3619;
    const lng = userLocation?.[1] ?? -5.8494;
    return buildDemoAlerts(lat, lng);
  }, [userLocation]);

  const searchAlerts = useMemo(() => {
    const real = safeAlerts(rawAlerts);
    const merged = [...real];
    for (const d of demoAlerts) {
      if (merged.length >= 6) break;
      merged.push(d);
    }
    return merged;
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

      <main className="pt-[56px] pb-[88px]">
        <AnimatePresence>
          {!mode && (
            <motion.div className="relative h-[calc(100vh-144px)]">
              <ParkingMap
                alerts={safeAlerts(demoAlerts)}
                userLocation={userLocation}
                zoomControl={false}
                className="absolute inset-0 opacity-20"
              />
              <div className="absolute inset-0 bg-purple-900/40" />

              <div className="relative z-10 h-full flex flex-col justify-center px-6 gap-4">
                <Button onClick={() => setMode('search')} className="h-20 bg-gray-900 rounded-2xl text-lg">
                  ¿Dónde quieres aparcar?
                </Button>

                <Button onClick={() => setMode('create')} className="h-20 bg-purple-600 rounded-2xl text-lg">
                  <Car className="w-8 h-8 mr-2" />
                  Estoy aparcado aquí
                </Button>
              </div>
            </motion.div>
          )}

          {mode === 'search' && (
            <motion.div className="flex flex-col h-[calc(100vh-144px)]">
              <div className="h-[45%] px-3 pt-2 relative">
                <ParkingMap
                  alerts={safeAlerts(searchAlerts)}
                  userLocation={userLocation}
                  selectedAlert={selectedAlert}
                  onAlertClick={setSelectedAlert}
                  zoomControl
                  className="h-full"
                />

                {!showFilters && (
                  <Button
                    size="icon"
                    className="absolute top-4 right-4 bg-black/60"
                    onClick={() => setShowFilters(true)}
                  >
                    <SlidersHorizontal />
                  </Button>
                )}

                {showFilters && (
                  <MapFilters
                    filters={filters}
                    onFilterChange={setFilters}
                    onClose={() => setShowFilters(false)}
                    alertsCount={searchAlerts.length}
                  />
                )}
              </div>

              <div className="flex-1 px-4 overflow-y-auto">
                {selectedAlert && (
                  <ActiveAlertCard alert={selectedAlert} /> // 🔴 MISMO COMPONENTE QUE HISTORY
                )}
              </div>
            </motion.div>
          )}

          {mode === 'create' && (
            <motion.div className="h-[calc(100vh-144px)] px-4 flex items-center">
              <CreateAlertCard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}