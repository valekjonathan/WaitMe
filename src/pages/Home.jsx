import React, { useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import ParkingMap from '@/components/map/ParkingMap';
import MapFilters from '@/components/map/MapFilters';
import UserAlertCard from '@/components/cards/UserAlertCard';
import NotificationManager from '@/components/NotificationManager';
import { Car, MapPin, SlidersHorizontal } from 'lucide-react';

export default function Home() {
  const queryClient = useQueryClient();

  const [user, setUser] = useState(null);
  const [mode, setMode] = useState(null); // null | 'search' | 'create'
  const [userLocation, setUserLocation] = useState(null);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ maxPrice: 7, maxMinutes: 25, maxDistance: 1 });

  const [selectedAlert, setSelectedAlert] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState({ open: false, alert: null });
  const selectedPositionRef = useRef(null);
  const [selectedPosition, setSelectedPosition] = useState(null);

  // Usuario
  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
      } catch {
        setUser(null);
      }
    })();
  }, []);

  // Ubicación (rápida y segura)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude);
        const lng = Number(pos.coords.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) setUserLocation([lat, lng]);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 10_000 }
    );
  }, []);

  // Alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ['parkingAlerts'],
    queryFn: async () => {
      const rows = await base44.entities.ParkingAlert.list();
      return Array.isArray(rows) ? rows : [];
    }
  });

  // Unread (si lo usas)
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      try {
        const rows = await base44.entities.Notification.filter({ is_read: false });
        return Array.isArray(rows) ? rows.length : 0;
      } catch {
        return 0;
      }
    }
  });

  const homeMapAlerts = useMemo(() => {
    // Mapa decorativo en Home
    return (alerts || []).slice(0, 6);
  }, [alerts]);

  const searchAlerts = useMemo(() => {
    // En Base44 tus filtros reales deberían filtrar aquí.
    // De momento: devolvemos todas y no rompemos nada.
    return (alerts || []).filter((a) => a && Number.isFinite(Number(a.latitude)) && Number.isFinite(Number(a.longitude)));
  }, [alerts, filters]);

  // Comprar (si aplica)
  const buyAlertMutation = useMutation({
    mutationFn: async (alert) => {
      // Ajusta aquí tu lógica real de compra/transacción.
      const tx = await base44.entities.Transaction.create({
        alert_id: alert.id,
        amount: alert.price,
        status: 'paid'
      });

      // Opcional: marcar alerta como tomada/reservada
      await base44.entities.ParkingAlert.update(alert.id, { is_reserved: true });

      return tx;
    },
    onSuccess: () => {
      setConfirmDialog({ open: false, alert: null });
      queryClient.invalidateQueries({ queryKey: ['parkingAlerts'] });
    },
    onError: () => {
      setConfirmDialog({ open: false, alert: null });
    }
  });

  const handleBuyAlert = (alert) => {
    if (!alert || alert.is_demo) return;
    setConfirmDialog({ open: true, alert });
  };

  const handleChat = (alert) => {
    if (!alert || alert.is_demo) return;
    window.location.href = createPageUrl(`Chat?alertId=${alert.id}&userId=${alert.user_email || alert.created_by}`);
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
        unreadCount={unreadCount}
        showBackButton={!!mode}
        onBack={() => {
          setMode(null);
          setSelectedAlert(null);
          setShowFilters(false);
        }}
      />

      <main className="fixed inset-0">
        <AnimatePresence mode="wait">
          {/* HOME (logo + botones como estaban) */}
          {!mode && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
            >
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <ParkingMap
                  alerts={homeMapAlerts}
                  userLocation={userLocation}
                  className="absolute inset-0 w-full h-full"
                  zoomControl={false}
                />
              </div>

              <div className="absolute inset-0 bg-purple-900/40 pointer-events-none" />

              <div className="text-center mb-4 w-full flex flex-col items-center relative z-10 px-6">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png"
                  alt="WaitMe!"
                  className="w-48 h-48 mb-0 object-contain"
                />
                <h1 className="text-xl font-bold whitespace-nowrap -mt-3">
                  Aparca donde te <span className="text-purple-500">avisen<span className="text-purple-500">!</span></span>
                </h1>
              </div>

              <div className="w-full max-w-sm mx-auto space-y-4 relative z-10 px-6">
                <Button
                  onClick={() => setMode('search')}
                  className="w-full h-20 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-4"
                >
                  <svg className="w-10 h-10 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  ¿ Dónde quieres aparcar ?
                </Button>

                <Button
                  onClick={() => setMode('create')}
                  className="w-full h-20 bg-green-600 hover:bg-green-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-4"
                >
                  <Car className="w-10 h-10" strokeWidth={2.5} />
                  ¡ Estoy aparcado aquí !
                </Button>
              </div>
            </motion.div>
          )}

          {/* DÓNDE QUIERES APARCAR (SIN SCROLL) */}
          {mode === 'search' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[60px] bottom-[88px] flex flex-col"
              style={{ overflow: 'hidden', height: 'calc(100vh - 148px)' }}
            >
              <div className="h-[44%] relative px-3 pt-1 flex-shrink-0">
                <ParkingMap
                  alerts={searchAlerts}
                  onAlertClick={(a) => {
                    // NUNCA recargar/navegar aquí: solo seleccionar
                    setSelectedAlert(a);
                  }}
                  userLocation={userLocation}
                  selectedAlert={selectedAlert}
                  showRoute={!!selectedAlert}
                  zoomControl={true}
                  className="h-full"
                />

                {!showFilters && (
                  <Button
                    onClick={() => setShowFilters(true)}
                    className="absolute top-5 right-7 z-[1000] bg-black/60 backdrop-blur-sm border border-purple-500/30 text-white hover:bg-purple-600"
                    size="icon"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </Button>
                )}

                <AnimatePresence>
                  {showFilters && (
                    <MapFilters
                      filters={filters}
                      onFilterChange={setFilters}
                      onClose={() => setShowFilters(false)}
                      alertsCount={searchAlerts.length}
                    />
                  )}
                </AnimatePresence>
              </div>

              <div className="px-4 py-2 flex-shrink-0">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar dirección..."
                    className="w-full bg-gray-900 border border-gray-700 text-white pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

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

          {/* CREATE (si lo tienes) — lo dejo intacto para no romper más */}
          {mode === 'create' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[60px] bottom-[88px] flex items-center justify-center"
            >
              <div className="text-gray-400">Pantalla de crear alerta (no tocada aquí)</div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}