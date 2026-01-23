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
  // offsets (~0.001 ≈ 110m) para que se vean “alrededor”
  const offsets = [
    [0.0012, 0.0005],
    [-0.0009, 0.0011],
    [0.0006, -0.0012],
    [0.0015, -0.0004],
    [-0.0014, -0.0007],
    [0.0002, 0.0016]
  ];

  const cars = [
    { color: 'negro', type: 'car', price: 4, brand: 'Seat', model: 'Ibiza', user: 'Sofía', plate: '1234KLM' },
    { color: 'gris', type: 'suv', price: 6, brand: 'Kia', model: 'Sportage', user: 'Álvaro', plate: '2468GHT' },
    { color: 'blanco', type: 'car', price: 5, brand: 'BMW', model: 'Serie 1', user: 'Hugo', plate: '2847BNM' },
    { color: 'rojo', type: 'car', price: 2, brand: 'Ford', model: 'Fiesta', user: 'Lucía', plate: '7780KLP' },
    { color: 'azul', type: 'van', price: 7, brand: 'VW', model: 'Caddy', user: 'Marcos', plate: '5312JRD' },
    { color: 'verde', type: 'suv', price: 6, brand: 'Toyota', model: 'RAV4', user: 'Dani', plate: '9011PTC' }
  ];

  return offsets.map(([dLat, dLng], i) => {
    const c = cars[i % cars.length];
    const lat = centerLat + dLat;
    const lng = centerLng + dLng;
    return {
      id: `demo-${i + 1}`,
      is_demo: true,
      latitude: lat,
      longitude: lng,
      price: c.price,
      car_color: c.color,
      vehicle_type: c.type,
      car_brand: c.brand,
      car_model: c.model,
      car_plate: c.plate,
      user_name: c.user,
      user_photo: `https://i.pravatar.cc/120?img=${(i % 30) + 1}`,
      address: 'Calle Uría, Oviedo',
      available_in_minutes: 10 + i * 3,
      created_date: new Date().toISOString()
    };
  });
}

export default function Home() {
  const queryClient = useQueryClient();

  const [mode, setMode] = useState(null); // null | 'search' | 'create'
  const [user, setUser] = useState(null);

  const [userLocation, setUserLocation] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Create mode
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [address, setAddress] = useState('');

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ maxPrice: 7, maxMinutes: 25, maxDistance: 1 });

  const [confirmDialog, setConfirmDialog] = useState({ open: false, alert: null });
  const [toast, setToast] = useState(null);

  // Decide screen from URL (?mode=search / ?mode=create)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mode');
    if (m === 'search') setMode('search');
    else if (m === 'create') setMode('create');
    else setMode(null);
  }, [window.location.search]);

  // Auth user
  useEffect(() => {
    base44.auth
      .me()
      .then(setUser)
      .catch(() => {});
  }, []);

  // User geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setUserLocation([position.coords.latitude, position.coords.longitude]),
      () => setUserLocation([43.3614, -5.8593]) // Oviedo fallback
    );
  }, []);

  // Notif unread count (simple)
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notificationsUnread'],
    queryFn: async () => {
      try {
        const res = await base44.entities.Notification.filter({ read: false });
        return Array.isArray(res) ? res.length : 0;
      } catch {
        return 0;
      }
    },
    refetchInterval: 15000
  });

  // Load alerts for search map
  const { data: parkingAlerts = [] } = useQuery({
    queryKey: ['parkingAlerts'],
    queryFn: async () => {
      try {
        const res = await base44.entities.ParkingAlert.list();
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    refetchInterval: 12000
  });

  // Filtered alerts for search
  const searchAlerts = useMemo(() => {
    const arr = Array.isArray(parkingAlerts) ? parkingAlerts : [];
    const filtered = arr.filter((a) => {
      const price = Number(a?.price ?? 0);
      const mins = Number(a?.available_in_minutes ?? a?.availableInMinutes ?? 0);
      if (Number.isFinite(price) && price > filters.maxPrice) return false;
      if (Number.isFinite(mins) && mins > filters.maxMinutes) return false;
      return true;
    });
    return filtered;
  }, [parkingAlerts, filters]);

  // Select first alert by default (when entering search)
  useEffect(() => {
    if (mode !== 'search') return;
    if (selectedAlert) return;
    const first = searchAlerts[0];
    if (first) setSelectedAlert(first);
  }, [mode, searchAlerts, selectedAlert]);

  // Demo alerts for home background and search “cars”
  const homeMapAlerts = useMemo(() => {
    const loc = userLocation || [43.3614, -5.8593];
    return buildDemoAlerts(loc[0], loc[1]);
  }, [userLocation]);

  // Distance helper (km)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  // Mutations
  const createAlertMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        created_date: new Date().toISOString(),
        created_by: user?.email,
        latitude: selectedPosition?.lat || userLocation?.[0] || 40.4168,
        longitude: selectedPosition?.lng || userLocation?.[1] || -3.7038
      };
      return base44.entities.ParkingAlert.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkingAlerts'] });
      setMode(null);
      setSelectedAlert(null);
    }
  });

  const buyAlertMutation = useMutation({
    mutationFn: async (alert) => {
      // Guard
      if (!alert?.id) throw new Error('Sin alerta');
      // Demo: no crear transacción real
      if (alert?.is_demo) return null;

      const tx = await base44.entities.Transaction.create({
        alert_id: alert.id,
        amount: alert.price,
        buyer_email: user?.email,
        seller_email: alert.user_email || alert.created_by,
        status: 'pending',
        created_date: new Date().toISOString()
      });
      return tx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkingAlerts'] });
      setConfirmDialog({ open: false, alert: null });
      setSelectedAlert(null);
    }
  });

  const handleBuyAlert = (alert) => {
    setConfirmDialog({ open: true, alert });
  };

  const handleChat = (alert) => {
    if (alert?.is_demo) {
      setToast('Solo disponible en plazas reales');
      return;
    }
    window.location.href = createPageUrl(`Chat?alertId=${alert.id}&userId=${alert.user_email || alert.created_by}`);
  };

  const handleCall = (alert) => {
    if (alert?.is_demo) {
      setToast('Solo disponible en plazas reales');
      return;
    }
    if (alert.phone) window.location.href = `tel:${alert.phone}`;
  };

  // Auto-ocultar toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

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

      {/* CONTENIDO (NO TOCA tu overlay ni tu home, solo añade coches al mapa de fondo) */}
      <main className="fixed inset-0">
        <AnimatePresence mode="wait">
          {/* HOME PRINCIPAL */}
          {!mode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
            >
              {/* Mapa de fondo apagado + coches demo */}
              <div className="absolute top-0 left-0 right-0 bottom-0 opacity-20 pointer-events-none">
                <ParkingMap
                  alerts={homeMapAlerts}
                  userLocation={userLocation}
                  className="absolute inset-0 w-full h-full"
                  zoomControl={false}
                />
              </div>

              {/* Overlay morado apagado (NO TOCAR) */}
              <div className="absolute inset-0 bg-purple-900/40 pointer-events-none"></div>

              {/* Contenido centrado */}
              <div className="relative z-10 w-full px-6">
                <div className="text-center space-y-6">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white">WaitMe!</h1>
                    <p className="text-gray-200 text-lg">¿Qué quieres hacer?</p>
                  </div>

                  <div className="space-y-4 max-w-sm mx-auto">
                    <Button
                      onClick={() => (window.location.href = createPageUrl('Home?mode=search'))}
                      className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-2xl flex items-center justify-center gap-3 text-lg shadow-lg"
                    >
                      <MapPin className="w-6 h-6" />
                      Encontrar aparcamiento
                    </Button>

                    <Button
                      onClick={() => (window.location.href = createPageUrl('Home?mode=create'))}
                      className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-2xl flex items-center justify-center gap-3 text-lg shadow-lg"
                    >
                      <Car className="w-6 h-6" />
                      Estoy aparcado aquí
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* DONDE QUIERES APARCAR (search) */}
          {mode === 'search' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[60px] bottom-[88px] flex flex-col"
              style={{ overflow: 'hidden', height: 'calc(100vh - 148px)' }}
            >
              {/* Mapa */}
              <div className="h-[42%] relative px-3 pt-2 flex-shrink-0">
                <ParkingMap
                  alerts={[...searchAlerts, ...homeMapAlerts]}
                  onAlertClick={(a) => setSelectedAlert(a)}
                  userLocation={userLocation}
                  selectedAlert={selectedAlert}
                  showRoute={false}
                  zoomControl={true}
                  className="h-full"
                />

                {/* Botón filtros */}
                <Button
                  onClick={() => setShowFilters(true)}
                  size="icon"
                  className="absolute top-4 right-4 z-[1001] bg-black/80 border border-purple-500/30 hover:bg-purple-600 rounded-xl h-10 w-10 shadow-lg"
                >
                  <SlidersHorizontal className="w-5 h-5 text-white" />
                </Button>

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

              <div className="px-4 py-2">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar dirección..."
                    className="w-full bg-gray-900 border border-gray-700 text-white pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Centro vertical: si cabe -> centrado; si no -> scroll */}
              <div className="flex-1 px-4 min-h-0 overflow-y-auto">
                <div className="min-h-full flex items-center">
                  <div className="w-full">
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
              </div>
            </motion.div>
          )}

          {/* ESTOY APARCADO AQUÍ (sin scroll: centrado dentro de pantalla) */}
          {mode === 'create' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[60px] bottom-[88px] flex flex-col"
              style={{ overflow: 'hidden', height: 'calc(100vh - 148px)' }}
            >
              {/* mapa un poco más grande y bien centrado */}
              <div className="h-[45%] relative px-3 pt-2 flex-shrink-0">
                <ParkingMap
                  isSelecting={true}
                  selectedPosition={selectedPosition}
                  setSelectedPosition={(pos) => {
                    setSelectedPosition(pos);
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`)
                      .then((res) => res.json())
                      .then((data) => {
                        if (data?.display_name) setAddress(data.display_name);
                      })
                      .catch(() => {});
                  }}
                  userLocation={userLocation}
                  zoomControl={true}
                  className="h-full"
                />
              </div>

              <h3 className="text-white font-semibold text-center py-2 text-sm flex-shrink-0">
                ¿ Dónde estas aparcado ?
              </h3>

              {/* tarjeta: SIN scroll externo */}
              <div className="px-4 pb-3 flex-1 min-h-0 overflow-hidden flex items-start">
                <div className="w-full">
                  <CreateAlertCard
                    address={address}
                    onAddressChange={setAddress}
                    onUseCurrentLocation={() => {
                      if (!navigator.geolocation) return;
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          const lat = position.coords.latitude;
                          const lng = position.coords.longitude;
                          setUserLocation([lat, lng]);
                        },
                        () => setToast('No pude obtener tu ubicación')
                      );
                    }}
                    onCreateAlert={(data) => createAlertMutation.mutate(data)}
                    isLoading={createAlertMutation.isPending}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Toast simple (para demo y avisos) */}
      <AnimatePresence>
        {toast ? (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed left-1/2 -translate-x-1/2 bottom-[98px] z-[2000] bg-black/80 backdrop-blur-sm border border-purple-500/30 text-white text-sm px-4 py-2 rounded-xl"
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <BottomNav />

      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ open, alert: confirmDialog.alert })}
      >
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {confirmDialog.alert?.is_demo ? 'Modo demo' : 'Confirmar reserva'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {confirmDialog.alert?.is_demo ? (
                <>Esta plaza es solo de ejemplo. Elige otra para reservar.</>
              ) : (
                <>
                  Vas a enviar una solicitud de reserva por{' '}
                  <span className="text-purple-400 font-bold">{confirmDialog.alert?.price}€</span> a{' '}
                  <span className="text-white font-medium">{confirmDialog.alert?.user_name}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
            <p className="text-sm text-gray-400">
              <span className="text-white">
                {confirmDialog.alert?.car_brand} {confirmDialog.alert?.car_model}
              </span>
            </p>
            <p className="text-sm text-gray-400">
              Matrícula: <span className="text-white font-mono">{confirmDialog.alert?.car_plate}</span>
            </p>
            <p className="text-sm text-gray-400">
              Se va en: <span className="text-purple-400">{confirmDialog.alert?.available_in_minutes} min</span>
            </p>
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, alert: null })}
              className="flex-1 border-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => buyAlertMutation.mutate(confirmDialog.alert)}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={buyAlertMutation.isPending || confirmDialog.alert?.is_demo}
            >
              {confirmDialog.alert?.is_demo
                ? 'Solo demo'
                : buyAlertMutation.isPending
                ? 'Enviando...'
                : 'Enviar solicitud'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
