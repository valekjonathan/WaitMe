import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, SlidersHorizontal } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ParkingMap from '@/components/map/ParkingMap';
import MapFilters from '@/components/map/MapFilters';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import UserAlertCard from '@/components/cards/UserAlertCard';
import NotificationManager from '@/components/NotificationManager';
import { isDemoMode, startDemoFlow, subscribeDemoFlow, getDemoAlerts } from '@/components/DemoFlowManager';

// ======================
// Helpers
// ======================
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const buildDemoAlerts = (lat, lng) => {
  const baseLat = lat ?? 43.3619;
  const baseLng = lng ?? -5.8494;

  return [
    {
      id: 'demo_1',
      is_demo: true,
      user_name: 'SOFIA',
      user_photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
      car_brand: 'Seat',
      car_model: 'Ibiza',
      car_color: 'azul',
      car_plate: '1234ABC',
      price: 3.0,
      available_in_minutes: 5,
      latitude: baseLat + 0.002,
      longitude: baseLng + 0.001,
      address: 'Calle Uría, Oviedo',
      phone: '+34612345678',
      allow_phone_calls: true
    },
    {
      id: 'demo_2',
      is_demo: true,
      user_name: 'MARCO',
      user_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
      car_brand: 'BMW',
      car_model: 'Serie 1',
      car_color: 'negro',
      car_plate: '5678DEF',
      price: 4.0,
      available_in_minutes: 12,
      latitude: baseLat - 0.001,
      longitude: baseLng - 0.002,
      address: 'Calle Campoamor, Oviedo',
      phone: '+34623456789',
      allow_phone_calls: false
    },
    {
      id: 'demo_3',
      is_demo: true,
      user_name: 'DIEGO',
      user_photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
      car_brand: 'Volkswagen',
      car_model: 'Golf',
      car_color: 'blanco',
      car_plate: '9012GHI',
      price: 2.5,
      available_in_minutes: 20,
      latitude: baseLat + 0.001,
      longitude: baseLng - 0.001,
      address: 'Plaza de la Escandalera, Oviedo',
      phone: '+34634567890',
      allow_phone_calls: true
    }
  ];
};

const CarIconProfile = ({ color, size = "w-16 h-10" }) =>
  <svg viewBox="0 0 48 24" className={size} fill="none">
    {/* Cuerpo del coche - vista lateral */}
    <path
      d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
      fill={color}
      stroke="white"
      strokeWidth="1.5" />

    {/* Ventanas */}
    <path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="0.5" />
    {/* Rueda trasera */}
    <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
    <circle cx="14" cy="18" r="2" fill="#666" />
    {/* Rueda delantera */}
    <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
    <circle cx="36" cy="18" r="2" fill="#666" />
  </svg>;

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState('home'); // home | search | create
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showAlertDialog, setShowAlertDialog] = useState(false);

  // DEMO
  const [demoAlerts, setDemoAlerts] = useState([]);
  const [demoStarted, setDemoStarted] = useState(false);

  // ======================
  // Queries
  // ======================
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const { data, error } = await base44
          .from('profiles')
          .select('*')
          .single();
        if (error) return null;
        return data;
      } catch (e) {
        return null;
      }
    },
    staleTime: 60_000
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      try {
        const { data, error } = await base44
          .from('alerts')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) return [];
        return data ?? [];
      } catch (e) {
        return [];
      }
    },
    staleTime: 10_000
  });

  // ======================
  // Demo Flow Init
  // ======================
  useEffect(() => {
    if (!isDemoMode()) return;

    if (!demoStarted) {
      startDemoFlow();
      setDemoStarted(true);
    }

    // Primer set inmediato
    const initial = getDemoAlerts();
    if (initial?.length) setDemoAlerts(initial);

    // Suscripción
    const unsub = subscribeDemoFlow((state) => {
      if (state?.alerts) setDemoAlerts(state.alerts);
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [demoStarted]);

  // ======================
  // Location
  // ======================
  useEffect(() => {
    if (!navigator?.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setUserLocation(loc);

        // Si está en demo y aún no había alerts, crea base alrededor del user
        if (isDemoMode() && (!demoAlerts || demoAlerts.length === 0)) {
          const built = buildDemoAlerts(loc.latitude, loc.longitude);
          setDemoAlerts(built);
        }
      },
      () => {
        // fallback Oviedo
        const loc = { latitude: 43.3619, longitude: -5.8494 };
        setUserLocation(loc);

        if (isDemoMode() && (!demoAlerts || demoAlerts.length === 0)) {
          const built = buildDemoAlerts(loc.latitude, loc.longitude);
          setDemoAlerts(built);
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // ======================
  // Alerts list: real + demo
  // ======================
  const mergedAlerts = useMemo(() => {
    if (isDemoMode()) {
      return demoAlerts?.length ? demoAlerts : buildDemoAlerts(userLocation?.latitude, userLocation?.longitude);
    }
    return alerts;
  }, [alerts, demoAlerts, userLocation]);

  const sortedAlerts = useMemo(() => {
    if (!mergedAlerts?.length) return [];

    const uLat = userLocation?.latitude;
    const uLng = userLocation?.longitude;

    if (!uLat || !uLng) return mergedAlerts;

    return [...mergedAlerts].sort((a, b) => {
      const da = calculateDistance(uLat, uLng, a.latitude, a.longitude);
      const db = calculateDistance(uLat, uLng, b.latitude, b.longitude);
      return da - db;
    });
  }, [mergedAlerts, userLocation]);

  // ======================
  // Handlers
  // ======================
  const onSelectAlert = (alert) => {
    setSelectedAlert(alert);
    setShowAlertDialog(true);
  };

  const onGoToSearch = () => setMode('search');
  const onGoToCreate = () => setMode('create');
  const onGoHome = () => setMode('home');

  // ======================
  // UI
  // ======================
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* MAIN */}
      <div className="pb-24">
        <AnimatePresence mode="wait">
          {mode === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="px-0"
            >
              {/* HERO */}
              <div className="relative overflow-hidden rounded-b-[28px] bg-gradient-to-b from-[#1b0f24] to-black border-b border-white/10">
                <div className="absolute inset-0 opacity-20">
                  <div className="w-full h-full bg-[radial-gradient(circle_at_top,#a855f7,transparent_60%)]" />
                </div>

                <div className="relative z-10 px-6 pt-6 pb-6 flex flex-col items-center">
                  {/* 1) Logo +10px */}
                  <div className="w-[212px] h-[212px] overflow-hidden mb-0">
                    <img
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png"
                      alt="WaitMe!"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>

                  {/* SUBIDO “AL RAS” */}
                  <h1 className="text-4xl font-bold leading-none -mt-6 whitespace-nowrap">
                    Wait<span className="text-purple-500">Me!</span>
                  </h1>

                  <p className="text-xl font-bold mt-[3px] whitespace-nowrap">
                    Aparca donde te <span className="text-purple-500">avisen!</span>
                  </p>
                </div>

                {/* BOTONES: NO SE MUEVEN */}
                <div className="w-full max-w-sm mx-auto space-y-4 relative z-10 px-6 pb-8">
                  <Button
                    onClick={() => setMode('search')}
                    className="w-full h-14 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white flex items-center justify-center gap-3"
                  >
                    <MapPin className="w-6 h-6 text-purple-400" />
                    ¿Dónde quieres aparcar?
                  </Button>

                  <Button
                    onClick={() => setMode('create')}
                    className="w-full h-16 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-lg font-bold flex items-center justify-center gap-3"
                  >
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 border border-white/10">
                      <CarIconProfile color="#ffffff" size="w-8 h-5" />
                    </span>
                    ¡Estoy aparcado aquí!
                  </Button>
                </div>
              </div>

              {/* LISTADO ALERTAS */}
              <div className="px-4 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold">
                    Alertas cerca
                    {isDemoMode() && <span className="ml-2 text-xs text-purple-400 font-semibold">(DEMO)</span>}
                  </h2>

                  <Button
                    variant="ghost"
                    onClick={() => setShowFilters(true)}
                    className="text-white/80 hover:text-white"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </Button>
                </div>

                {alertsLoading && !isDemoMode() ? (
                  <div className="text-white/70 text-sm py-8 text-center">Cargando alertas...</div>
                ) : sortedAlerts.length === 0 ? (
                  <div className="text-white/70 text-sm py-8 text-center">
                    No hay alertas ahora mismo.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedAlerts.map((alert) => (
                      <UserAlertCard
                        key={alert.id}
                        alert={alert}
                        userLocation={userLocation}
                        onClick={() => onSelectAlert(alert)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <NotificationManager />
            </motion.div>
          )}

          {mode === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="px-0"
            >
              <div className="px-4 pt-4">
                <ParkingMap
                  mode="search"
                  alerts={sortedAlerts}
                  userLocation={userLocation}
                  onSelectAlert={onSelectAlert}
                  onBack={onGoHome}
                />
              </div>
            </motion.div>
          )}

          {mode === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="px-0"
            >
              <div className="px-4 pt-4">
                <CreateAlertCard
                  userLocation={userLocation}
                  profile={profile}
                  onCancel={onGoHome}
                  onCreated={() => {
                    setMode('home');
                    queryClient.invalidateQueries({ queryKey: ['alerts'] });
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dialog detalle alerta */}
      <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <DialogContent className="bg-[#0b0b0f] text-white border border-white/10 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Alerta</DialogTitle>
            <DialogDescription className="text-white/60">
              Detalles de la alerta seleccionada
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedAlert.user_photo}
                  alt={selectedAlert.user_name}
                  className="w-12 h-12 rounded-2xl object-cover border border-white/10"
                />
                <div>
                  <div className="font-bold">{selectedAlert.user_name}</div>
                  <div className="text-white/70 text-sm">
                    {selectedAlert.car_brand} {selectedAlert.car_model} · {selectedAlert.car_plate}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-3">
                <div className="text-white/70 text-sm">Precio</div>
                <div className="font-bold text-purple-400">{Number(selectedAlert.price).toFixed(2)}€</div>
              </div>

              <div className="text-white/70 text-sm">
                Dirección: <span className="text-white">{selectedAlert.address}</span>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              onClick={() => setShowAlertDialog(false)}
              className="w-full rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="bg-[#0b0b0f] text-white border border-white/10 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Filtros</DialogTitle>
            <DialogDescription className="text-white/60">
              Ajusta qué alertas quieres ver
            </DialogDescription>
          </DialogHeader>
          <MapFilters onClose={() => setShowFilters(false)} />
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}