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

export default function Home() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialMode = urlParams.get('mode');

  const [mode, setMode] = useState(initialMode || null); // null, 'search', 'create'

  useEffect(() => {
    const checkReset = () => {
      const params = new URLSearchParams(window.location.search);
      if (!params.has('mode')) {
        setMode(null);
      }
    };
    checkReset();
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

  // DEMO: alertas inventadas cerca de tu ubicación
  const demoAlerts = useMemo(() => {
    const [lat, lng] = userLocation || [40.4168, -3.7038];

    const photo = (n) => `https://i.pravatar.cc/150?img=${n}`; // placeholder
    const add = (dLat, dLng) => [lat + dLat, lng + dLng];

    const list = [
      {
        id: 'demo_1',
        user_id: 'demo_user_1',
        user_email: 'laura@demo.com',
        user_name: 'Laura',
        user_photo: photo(47),
        car_brand: 'Opel',
        car_model: 'Corsa',
        car_color: 'gris',
        car_plate: '9812 GHJ',
        vehicle_type: 'car',
        price: 4,
        available_in_minutes: 12,
        address: 'Calle Uría, 20',
        allow_phone_calls: true,
        phone: '+34611111111',
        status: 'active',
        latitude: add(0.0016, 0.0012)[0],
        longitude: add(0.0016, 0.0012)[1]
      },
      {
        id: 'demo_2',
        user_id: 'demo_user_2',
        user_email: 'marta@demo.com',
        user_name: 'Marta',
        user_photo: photo(32),
        car_brand: 'Seat',
        car_model: 'Ibiza',
        car_color: 'rojo',
        car_plate: '1234 ABC',
        vehicle_type: 'car',
        price: 3,
        available_in_minutes: 7,
        address: 'Calle Pelayo, 8',
        allow_phone_calls: false,
        phone: null,
        status: 'active',
        latitude: add(-0.0012, 0.0008)[0],
        longitude: add(-0.0012, 0.0008)[1]
      },
      {
        id: 'demo_3',
        user_id: 'demo_user_3',
        user_email: 'carlos@demo.com',
        user_name: 'Carlos',
        user_photo: photo(12),
        car_brand: 'Toyota',
        car_model: 'Yaris',
        car_color: 'azul',
        car_plate: '5678 DEF',
        vehicle_type: 'suv',
        price: 5,
        available_in_minutes: 18,
        address: 'Avenida de Galicia, 14',
        allow_phone_calls: true,
        phone: '+34622222222',
        status: 'active',
        latitude: add(0.0009, -0.0014)[0],
        longitude: add(0.0009, -0.0014)[1]
      },
      {
        id: 'demo_4',
        user_id: 'demo_user_4',
        user_email: 'ana@demo.com',
        user_name: 'Ana',
        user_photo: photo(5),
        car_brand: 'Volkswagen',
        car_model: 'Polo',
        car_color: 'blanco',
        car_plate: '9090 KLM',
        vehicle_type: 'car',
        price: 6,
        available_in_minutes: 25,
        address: 'Plaza de la Escandalera',
        allow_phone_calls: true,
        phone: '+34633333333',
        status: 'active',
        latitude: add(-0.0007, -0.0009)[0],
        longitude: add(-0.0007, -0.0009)[1]
      },
      {
        id: 'demo_5',
        user_id: 'demo_user_5',
        user_email: 'david@demo.com',
        user_name: 'David',
        user_photo: photo(18),
        car_brand: 'Renault',
        car_model: 'Clio',
        car_color: 'negro',
        car_plate: '2222 ZZZ',
        vehicle_type: 'van',
        price: 7,
        available_in_minutes: 30,
        address: 'Calle Cervantes, 3',
        allow_phone_calls: false,
        phone: null,
        status: 'active',
        latitude: add(0.0011, 0.0002)[0],
        longitude: add(0.0011, 0.0002)[1]
      }
    ];

    return list;
  }, [userLocation]);

  // Obtener usuario actual
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Usuario no autenticado');
      }
    };
    fetchUser();
  }, []);

  // Obtener alertas reales (si existen)
  const { data: rawAlertsReal = [] } = useQuery({
    queryKey: ['parkingAlertsAllActive'],
    queryFn: () => base44.entities.ParkingAlert.filter({ status: 'active' }),
    refetchInterval: 8000,
    enabled: true
  });

  const combinedRawAlerts = useMemo(() => {
    // demo primero para que SIEMPRE veas coches aunque no haya nada real
    const real = Array.isArray(rawAlertsReal) ? rawAlertsReal : [];
    return [...demoAlerts, ...real];
  }, [demoAlerts, rawAlertsReal]);

  // Calcular distancia en km
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

  // Filtrar alertas según criterios (para modo search)
  const alertsFiltered = combinedRawAlerts.filter((alert) => {
    if (alert.price > filters.maxPrice) return false;
    if (alert.available_in_minutes > filters.maxMinutes) return false;

    if (userLocation) {
      const distance = calculateDistance(
        userLocation[0], userLocation[1],
        alert.latitude, alert.longitude
      );
      if (distance > filters.maxDistance) return false;
    }

    return true;
  });

  // Alertas para el mapa de fondo (modo null): cerca y bonitas
  const backgroundAlerts = useMemo(() => {
    if (!userLocation) return combinedRawAlerts.slice(0, 8);
    return combinedRawAlerts
      .filter(a => calculateDistance(userLocation[0], userLocation[1], a.latitude, a.longitude) <= 1.2)
      .slice(0, 10);
  }, [combinedRawAlerts, userLocation]);

  // Crear alerta
  const createAlertMutation = useMutation({
    mutationFn: async (alertData) => {
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
        available_in_minutes: alertData.minutes,
        allow_phone_calls: user?.allow_phone_calls || false,
        phone: user?.phone,
        status: 'active'
      });
      return newAlert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkingAlertsAllActive'] });
      setMode(null);
      setSelectedPosition(null);
      setAddress('');
    }
  });

  // Comprar alerta - crea notificación
  const buyAlertMutation = useMutation({
    mutationFn: async (alert) => {
      // si es demo, solo simula cierre (no toca DB)
      if (String(alert?.id || '').startsWith('demo_')) return alert;

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
      queryClient.invalidateQueries({ queryKey: ['parkingAlertsAllActive'] });
      setConfirmDialog({ open: false, alert: null });
      setSelectedAlert(null);
    }
  });

  // Obtener ubicación actual
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setSelectedPosition({ lat: latitude, lng: longitude });

          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.address) {
                const road = data.address.road || data.address.street || '';
                const number = data.address.house_number || '';
                setAddress(number ? `${road}, ${number}` : road);
              }
            });
        },
        (error) => console.log('Error obteniendo ubicación:', error)
      );
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Centrar en ubicación cuando se entra en modo search
  useEffect(() => {
    if (mode === 'search' && userLocation) {
      setTimeout(() => {
        getCurrentLocation();
      }, 300);
    }
  }, [mode]);

  const handleBuyAlert = (alert) => {
    setConfirmDialog({ open: true, alert });
  };

  const handleChat = (alert) => {
    window.location.href = createPageUrl(`Chat?alertId=${alert.id}&userId=${alert.user_email || alert.created_by}`);
  };

  const handleCall = (alert) => {
    if (alert.phone) {
      window.location.href = `tel:${alert.phone}`;
    }
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
            >
              {/* Mapa de fondo (CON coches demo alrededor) */}
              <div className="absolute top-0 left-0 right-0 bottom-0 opacity-45 pointer-events-none">
                <ParkingMap
                  alerts={backgroundAlerts}
                  userLocation={userLocation}
                  className="absolute inset-0 w-full h-full"
                  zoomControl={false}
                />
              </div>

              {/* Overlay morado */}
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
                  className="w-full h-20 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-4"
                >
                  <svg className="w-28 h-28 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  ¿ Dónde quieres aparcar ?
                </Button>

                <Button
                  onClick={() => setMode('create')}
                  className="w-full h-20 bg-purple-600 hover:bg-purple-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-4"
                >
                  <Car className="w-14 h-14" strokeWidth={2.5} />
                  ¡ Estoy aparcado aquí !
                </Button>
              </div>
            </motion.div>
          )}

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
                  alerts={alertsFiltered}
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
                      alertsCount={alertsFiltered.length}
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

              <div className="flex-1 px-4 min-h-0 overflow-y-auto">
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
            </motion.div>
          )}

          {mode === 'create' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-screen pt-4"
            >
              <div className="h-[35%] relative px-3">
                <ParkingMap
                  isSelecting={true}
                  selectedPosition={selectedPosition}
                  setSelectedPosition={(pos) => {
                    setSelectedPosition(pos);
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`)
                      .then((res) => res.json())
                      .then((data) => {
                        if (data.address) {
                          const road = data.address.road || data.address.street || '';
                          const number = data.address.house_number || '';
                          setAddress(number ? `${road}, ${number}` : road);
                        }
                      });
                  }}
                  userLocation={userLocation}
                  zoomControl={true}
                  className="h-full"
                />
              </div>

              <h3 className="text-white font-semibold text-center py-2 text-sm">
                ¿ Dónde estas aparcado ?
              </h3>

              <div className="px-4">
                <CreateAlertCard
                  address={address}
                  onAddressChange={setAddress}
                  onUseCurrentLocation={getCurrentLocation}
                  onCreateAlert={(data) => createAlertMutation.mutate(data)}
                  isLoading={createAlertMutation.isPending}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, alert: confirmDialog.alert })}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirmar reserva</DialogTitle>
            <DialogDescription className="text-gray-400">
              Vas a enviar una solicitud de reserva por <span className="text-purple-400 font-bold">{confirmDialog.alert?.price}€</span> a{' '}
              <span className="text-white font-medium">{confirmDialog.alert?.user_name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
            <p className="text-sm text-gray-400">
              <span className="text-white">{confirmDialog.alert?.car_brand} {confirmDialog.alert?.car_model}</span>
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
              disabled={buyAlertMutation.isPending}
            >
              {buyAlertMutation.isPending ? 'Enviando...' : 'Enviar solicitud'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}