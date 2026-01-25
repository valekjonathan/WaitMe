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
    [0.0009, 0.0006],
    [-0.0007, 0.0008],
    [0.0011, -0.0005],
    [-0.0010, -0.0007],
    [0.0004, -0.0011],
    [-0.0004, 0.0012]
  ];

  // 6 coches inventados (variados: coche/suv/van, precios, tiempo, fotos)
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
      car_model: 'Traffic',
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

  const [mode, setMode] = useState(initialMode || null); // null, 'search', 'create'

  // Resetear mode cuando se navega a Home sin parámetros (al volver desde menú)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('mode')) setMode(null);
  }, [window.location.search]);

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

  // Usuario
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {
        // no auth
      }
    };
    fetchUser();
  }, []);

  // Unread
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadMessages', user?.email],
    queryFn: async () => {
      const messages = await base44.entities.ChatMessage.filter({ receiver_id: user?.email, read: false });
      return messages.length;
    },
    enabled: !!user?.email,
    refetchInterval: 5000
  });

  // Solo pedimos alertas reales en modo "search"
  const { data: rawAlerts = [] } = useQuery({
    queryKey: ['parkingAlerts'],
    queryFn: () => base44.entities.ParkingAlert.filter({ status: 'active' }),
    refetchInterval: mode === 'search' ? 5000 : false,
    enabled: mode === 'search'
  });

  // Distancia km
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Geoloc
  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setSelectedPosition({ lat: latitude, lng: longitude });

        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          .then((res) => res.json())
          .then((data) => {
            if (data?.address) {
              const road = data.address.road || data.address.street || '';
              const number = data.address.house_number || '';
              setAddress(number ? `${road}, ${number}` : road);
            }
          })
          .catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // DEMO: 6 coches alrededor (misma lista se usa en Home fondo y dentro de “Dónde quieres aparcar”)
  const demoAlerts = useMemo(() => {
    const fallback = [43.3619, -5.8494]; // Oviedo aprox
    const lat = userLocation?.[0] ?? fallback[0];
    const lng = userLocation?.[1] ?? fallback[1];
    return buildDemoAlerts(lat, lng);
  }, [userLocation]);

  // Filtrar alertas reales por filtros
  const realAlerts = rawAlerts.filter((alert) => {
    if (alert.price > filters.maxPrice) return false;
    if (alert.available_in_minutes > filters.maxMinutes) return false;
    if (userLocation) {
      const distance = calculateDistance(userLocation[0], userLocation[1], alert.latitude, alert.longitude);
      if (distance > filters.maxDistance) return false;
    }
    return true;
  });

  // En “Dónde quieres aparcar”: reales + relleno demo hasta 6 (siempre verás 6 posibilidades)
  const searchAlerts = useMemo(() => {
    const merged = [...(realAlerts || [])];
    const used = new Set(merged.map((a) => a.id));
    for (const d of demoAlerts) {
      if (merged.length >= 6) break;
      if (!used.has(d.id)) merged.push(d);
    }
    return merged.length ? merged : demoAlerts;
  }, [realAlerts, demoAlerts]);

  // En la Home principal (mapa de fondo): SIEMPRE los 6 demo
  const homeMapAlerts = demoAlerts;

  // Selección por defecto al entrar en search
  useEffect(() => {
    if (mode === 'search' && !selectedAlert && searchAlerts.length > 0) {
      setSelectedAlert(searchAlerts[0]);
    }
  }, [mode, selectedAlert, searchAlerts]);

  // Crear alerta
  const createAlertMutation = useMutation({
    mutationFn: async (alertData) => {
      const minutes = Number(alertData.minutes) || 0;
      const waitUntilIso = minutes > 0 ? new Date(Date.now() + minutes * 60000).toISOString() : null;

      const newAlert = await base44.entities.ParkingAlert.create({
        user_id: user?.id,
        user_email: user?.email,
        user_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Usuario',
        user_photo: user?.photo_url,
        car_brand: user?.car_brand || 'Sin especificar',
        car_model: user?.car_model || '',
        car_color: user?.car_color || 'gris',
        car_plate: user?.car_plate || '',
        vehicle_type: user?.vehicle_type || 'car',
        latitude: selectedPosition?.lat || userLocation?.[0] || 40.4168,
        longitude: selectedPosition?.lng || userLocation?.[1] || -3.7038,
        address: address,
        price: alertData.price,
        available_in_minutes: minutes,
        ...(waitUntilIso ? { wait_until: waitUntilIso, expires_at: waitUntilIso } : {}),
        allow_phone_calls: user?.allow_phone_calls || false,
        phone: user?.phone,
        status: 'active'
      });

      return newAlert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkingAlerts'] });
      setMode(null);
      setSelectedPosition(null);
      setAddress('');
    }
  });

  // Comprar alerta (solo reales)
  const buyAlertMutation = useMutation({
    mutationFn: async (alert) => {
      await base44.entities.Notification.create({
        type: 'reservation_request',
        recipient_id: alert.user_id,
        recipient_email: alert.user_email || alert.created_by,
        sender_id: user?.id,
        sender_name: user?.display_name || user?.full_name?.split(' ')[0],
        sender_photo: user?.photo_url,
        alert_id: alert.id,
        amount: alert.price,
        status: 'pending'
      });
      return alert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkingAlerts'] });
      setConfirmDialog({ open: false, alert: null });
      setSelectedAlert(null);
    }
  });

  const handleBuyAlert = (alert) => {
    if (alert?.is_demo) return; // demo: no comprar
    setConfirmDialog({ open: true, alert });
  };

  const handleChat = (alert) => {
    if (alert?.is_demo) return;
    window.location.href = createPageUrl(`Chat?alertId=${alert.id}&userId=${alert.user_email || alert.created_by}`);
  };

  const handleCall = (alert) => {
    if (alert?.is_demo) return;
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
        }}
      />

      {/* CONTENIDO (NO TOCAR tu overlay ni tu home, solo añade coches al mapa de fondo) */}
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
                  className="w-full h-20 bg-purple-600 hover:bg-purple-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-4"
                >
                  <MapPin className="w-14 h-14 text-purple-500" strokeWidth={2.5} />
                  ¿Dónde quieres aparcar?
                </Button>

                <Button
                  onClick={() => setMode('create')}
                  className="w-full h-20 bg-green-500 hover:bg-green-600 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-4"
                >
                  <Car className="w-14 h-14" strokeWidth={2.5} />
                  ¡Estoy aparcado aquí!
                </Button>
              </div>
            </motion.div>
          )}

          {/* DÓNDE QUIERES APARCAR */}
          {mode === 'search' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[60px] bottom-[88px] flex flex-col"
              style={{ overflow: 'hidden', height: 'calc(100vh - 148px)' }}
            >
              <div className="h-[42%] relative px-3 pt-1 flex-shrink-0">
                <ParkingMap
                  alerts={searchAlerts}
                  onAlertClick={setSelectedAlert}
                  userLocation={userLocation}
                  selectedAlert={selectedAlert}
                  showRoute={!!selectedAlert}
                  zoomControl={true}
                  className="h-full"
                />

                {!showFilters && (
                  <Button
                    onClick={() => setShowFilters(true)}
                    className="absolute top-5 right-7 z-[1000] bg-black/60 backdrop-blur-sm border border-purple-500/30 text-white p-2 rounded-full"
                  >
                    <SlidersHorizontal className="w-6 h-6" />
                  </Button>
                )}

                {showFilters && (
                  <AnimatePresence>
                    <MapFilters
                      filters={filters}
                      onFilterChange={setFilters}
                      onClose={() => setShowFilters(false)}
                      alertsCount={realAlerts.length}
                    />
                  </AnimatePresence>
                )}
              </div>

              <div className="flex-1 relative bg-black rounded-t-3xl px-3 pb-1 pt-3 -mt-2">
                {/* Lista de alertas / tarjetas */}
                {searchAlerts.length > 0 ? (
                  <div className="absolute inset-0 overflow-y-auto hide-scrollbar pb-24 px-0.5">
                    {/* Tarjeta de usuario seleccionada */}
                    {selectedAlert && (
                      <div className="mb-3">
                        <UserAlertCard
                          alert={selectedAlert}
                          onBuyAlert={handleBuyAlert}
                          onChat={handleChat}
                          onCall={handleCall}
                          isLoading={buyAlertMutation.isPending}
                          userLocation={userLocation}
                        />
                      </div>
                    )}

                    {/* Tarjetas de otras alertas (no seleccionadas) */}
                    {searchAlerts.map((alert) =>
                      alert.id !== selectedAlert?.id ? (
                        <div key={alert.id} className="mb-3">
                          <UserAlertCard
                            alert={alert}
                            onBuyAlert={handleBuyAlert}
                            onChat={handleChat}
                            onCall={handleCall}
                            isLoading={buyAlertMutation.isPending}
                            userLocation={userLocation}
                          />
                        </div>
                      ) : null
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500 text-center text-sm px-4">No se han encontrado plazas de aparcamiento disponibles en esta zona.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* CREAR ALERTA (Estoy aparcado) */}
          {mode === 'create' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[60px] bottom-[88px] flex flex-col"
              style={{ overflow: 'hidden', height: 'calc(100vh - 148px)' }}
            >
              <div className="h-[42%] relative px-3 pt-1 pb-1 flex-shrink-0">
                <ParkingMap
                  isSelecting={true}
                  selectedPosition={selectedPosition}
                  setSelectedPosition={setSelectedPosition}
                  userLocation={userLocation}
                  zoomControl={false}
                  className="h-full"
                />
              </div>

              <div className="flex-1 relative bg-black rounded-t-3xl px-4 py-3 -mt-2">
                <CreateAlertCard
                  onSubmit={(data) => createAlertMutation.mutate(data)}
                  onCancel={() => {
                    setMode(null);
                    setSelectedPosition(null);
                    setAddress('');
                  }}
                  address={address}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
      {/* Confirmación compra */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, alert: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar reserva</DialogTitle>
            <DialogDescription>¿Seguro que quieres reservar esta plaza de aparcamiento?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, alert: null })}>
              Cancelar
            </Button>
            <Button
              onClick={() => buyAlertMutation.mutate(confirmDialog.alert)}
              disabled={buyAlertMutation.isPending}
            >
              {buyAlertMutation.isPending ? 'Procesando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}