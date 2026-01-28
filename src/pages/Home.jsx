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
  const [mode, setMode] = useState(initialMode || null); // null, 'search', 'create'

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
  const [filters, setFilters] = useState({ maxPrice: 7, maxMinutes: 25, maxDistance: 1 });

  const queryClient = useQueryClient();

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

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadMessages', user?.email],
    queryFn: async () => {
      const messages = await base44.entities.ChatMessage.filter({ receiver_id: user?.email, read: false });
      return messages.length;
    },
    enabled: !!user?.email
  });

  const { data: rawAlerts = [] } = useQuery({
    queryKey: ['parkingAlerts'],
    queryFn: () => base44.entities.ParkingAlert.filter({ status: 'active' }),
    enabled: mode === 'search'
  });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const homeMapAlerts = useMemo(() => {
    const center = userLocation || [43.3619, -5.8494];
    return buildDemoAlerts(center[0], center[1]);
  }, [userLocation]);

  const filteredAlerts = useMemo(() => {
    const list = Array.isArray(rawAlerts) ? rawAlerts : [];
    const [uLat, uLng] = Array.isArray(userLocation) ? userLocation : [null, null];

    return list.filter((a) => {
      if (!a) return false;

      const price = Number(a.price);
      if (Number.isFinite(price) && price > filters.maxPrice) return false;

      const mins = Number(a.available_in_minutes ?? a.availableInMinutes);
      if (Number.isFinite(mins) && mins > filters.maxMinutes) return false;

      const lat = a.latitude ?? a.lat;
      const lng = a.longitude ?? a.lng;

      if (uLat != null && uLng != null && lat != null && lng != null) {
        const km = calculateDistance(uLat, uLng, lat, lng);
        if (Number.isFinite(km) && km > filters.maxDistance) return false;
      }
      return true;
    });
  }, [rawAlerts, filters, userLocation]);

  const searchAlerts = useMemo(() => {
    if (mode !== 'search') return [];
    const real = filteredAlerts || [];
    if (real.length > 0) return real;

    const center = userLocation || [43.3619, -5.8494];
    return buildDemoAlerts(center[0], center[1]);
  }, [mode, filteredAlerts, userLocation]);

  const createAlertMutation = useMutation({
    mutationFn: async (data) => {
      const currentUser = await base44.auth.me();
      const payload = {
        ...data,
        status: 'active',
        user_email: currentUser?.email || currentUser?.id || '',
        created_by: currentUser?.email || currentUser?.id || ''
      };
      return base44.entities.ParkingAlert.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkingAlerts'] });
      setMode(null);
    }
  });

  const buyAlertMutation = useMutation({
    mutationFn: async (alert) => {
      // Si es demo, simular delay
      if (alert?.is_demo) {
        await new Promise(resolve => setTimeout(resolve, 800));
        return { success: true, demo: true };
      }
      
      const currentUser = await base44.auth.me();
      const tx = await base44.entities.Transaction.create({
        alert_id: alert.id,
        buyer_id: currentUser?.email || currentUser?.id || '',
        seller_id: alert.user_email || alert.created_by || '',
        amount: Number(alert.price) || 0,
        status: 'pending'
      });

      await base44.entities.ChatMessage.create({
        alert_id: alert.id,
        sender_id: currentUser?.email || currentUser?.id || '',
        receiver_id: alert.user_email || alert.created_by || '',
        message: `Solicitud de reserva enviada (${Number(alert.price || 0).toFixed(2)}€).`,
        read: false
      });

      return tx;
    },
    onSuccess: (data, alert) => {
      setConfirmDialog({ open: false, alert: null });
      
      if (alert?.is_demo) {
        // Mostrar mensaje de éxito para demo
        const demoConvId = `demo_conv_${alert.id}`;
        window.location.href = createPageUrl(`Chat?conversationId=${demoConvId}&demo=true&userName=${alert.user_name}&userPhoto=${encodeURIComponent(alert.user_photo)}&alertId=${alert.id}&justReserved=true`);
      } else {
        queryClient.invalidateQueries({ queryKey: ['parkingAlerts'] });
      }
    },
    onError: () => {
      setConfirmDialog({ open: false, alert: null });
      setSelectedAlert(null);
    }
  });

  const handleBuyAlert = (alert) => {
    setConfirmDialog({ open: true, alert });
  };

  const handleChat = async (alert) => {
    try {
      const currentUser = await base44.auth.me();
      
      // Si es demo, ir a conversación demo
      if (alert?.is_demo) {
        const demoConvId = `demo_conv_${alert.id}`;
        window.location.href = createPageUrl(`Chat?conversationId=${demoConvId}&demo=true&userName=${alert.user_name}&userPhoto=${encodeURIComponent(alert.user_photo)}&alertId=${alert.id}`);
        return;
      }
      
      const otherUserId = alert.user_id || alert.user_email || alert.created_by;
      
      // Buscar conversación existente
      const conversations = await base44.entities.Conversation.filter({});
      const existingConv = conversations.find(c => 
        (c.participant1_id === currentUser.id && c.participant2_id === otherUserId) ||
        (c.participant2_id === currentUser.id && c.participant1_id === otherUserId)
      );
      
      if (existingConv) {
        window.location.href = createPageUrl(`Chat?conversationId=${existingConv.id}`);
        return;
      }
      
      // Crear nueva conversación
      const newConv = await base44.entities.Conversation.create({
        participant1_id: currentUser.id,
        participant1_name: currentUser.display_name || currentUser.full_name?.split(' ')[0] || 'Tú',
        participant1_photo: currentUser.photo_url,
        participant2_id: otherUserId,
        participant2_name: alert.user_name,
        participant2_photo: alert.user_photo,
        alert_id: alert.id,
        last_message_text: '',
        last_message_at: new Date().toISOString(),
        unread_count_p1: 0,
        unread_count_p2: 0
      });
      
      window.location.href = createPageUrl(`Chat?conversationId=${newConv.id}`);
    } catch (error) {
      console.error('Error al abrir chat:', error);
    }
  };

  const handleCall = (alert) => {
    const phone = alert?.phone || '+34612345678';
    window.location.href = `tel:${phone}`;
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

      <main className="fixed inset-0">
        <AnimatePresence mode="wait">
          {/* HOME PRINCIPAL (RESTABLECIDO: logo + botones como estaban) */}
          {!mode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 bottom-0 opacity-20 pointer-events-none">
                <ParkingMap
                  alerts={homeMapAlerts}
                  userLocation={userLocation}
                  className="absolute inset-0 w-full h-full"
                  zoomControl={false}
                />
              </div>

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

          {/* DÓNDE QUIERES APARCAR (SIN SCROLL) */}
          {mode === 'search' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[60px] bottom-[76px] flex flex-col"
              style={{ overflow: 'hidden', height: 'calc(100vh - 136px)' }}
            >
              <div className="h-[44%] relative px-3 pt-1 flex-shrink-0">
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

              <div className="px-4 py-0.5 flex-shrink-0">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar dirección..."
                    className="w-full bg-gray-900 border border-gray-700 text-white pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* SIN SCROLL: tarjeta encaja en el resto */}
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

          {/* ESTOY APARCADO AQUÍ (sin scroll) */}
          {mode === 'create' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[60px] bottom-[88px] flex flex-col"
              style={{ overflow: 'hidden', height: 'calc(100vh - 148px)' }}
            >
              <div className="h-[45%] relative px-3 pt-2 flex-shrink-0">
                <ParkingMap
                  isSelecting={true}
                  selectedPosition={selectedPosition}
                  setSelectedPosition={(pos) => {
                    setSelectedPosition(pos);
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`)
                      .then((res) => res.json())
                      .then((data) => {
                        if (data?.address) {
                          const road = data.address.road || data.address.street || '';
                          const number = data.address.house_number || '';
                          setAddress(number ? `${road}, ${number}` : road);
                        }
                      })
                      .catch(() => {});
                  }}
                  userLocation={userLocation}
                  zoomControl={true}
                  className="h-full"
                />
              </div>

              <h3 className="text-white font-semibold text-center py-3 text-sm flex-shrink-0">
                ¿ Dónde estas aparcado ?
              </h3>

              <div className="px-4 pb-3 flex-1 min-h-0 overflow-hidden flex items-start">
                <div className="w-full">
                  <CreateAlertCard
                    address={address}
                    onAddressChange={setAddress}
                    onUseCurrentLocation={getCurrentLocation}
                    onCreateAlert={(data) => createAlertMutation.mutate(data)}
                    isLoading={createAlertMutation.isPending}
                  />
                </div>
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
              Vas a enviar una solicitud de reserva por{' '}
              <span className="text-purple-400 font-bold">{confirmDialog.alert?.price}€</span> a{' '}
              <span className="text-white font-medium">{confirmDialog.alert?.user_name}</span>
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
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, alert: null })} className="flex-1 border-gray-700">
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