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
      car_brand: 'Kia',
      car_model: 'Sportage',
      car_color: 'verde',
      car_plate: '2468 GHT',
      vehicle_type: 'suv',
      price: 6,
      available_in_minutes: 18,
      address: 'Calle Jovellanos, Oviedo'
    },
    {
      id: 'demo_6',
      user_name: 'Álvaro',
      user_photo: 'https://randomuser.me/api/portraits/men/14.jpg',
      car_brand: 'Porsche',
      car_model: 'Macan',
      car_color: 'rojo',
      car_plate: '2026 VSR',
      vehicle_type: 'car',
      price: 9,
      available_in_minutes: 25,
      address: 'Calle Fray Ceferino, 10'
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

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeAlert(a) {
  if (!a) return null;

  const lat = toNumber(
    a.latitude ??
      a.lat ??
      a.user_location?.lat ??
      a.user_location?.latitude ??
      a.location?.lat ??
      a.location?.latitude
  );

  const lng = toNumber(
    a.longitude ??
      a.lng ??
      a.user_location?.lng ??
      a.user_location?.lon ??
      a.user_location?.longitude ??
      a.location?.lng ??
      a.location?.lon ??
      a.location?.longitude
  );

  if (lat == null || lng == null) return null;

  return {
    id: String(a.id ?? `${lat}_${lng}`),
    status: a.status ?? a.state ?? 'active',

    user_name: a.user_name ?? a.userName ?? 'Usuario',
    user_photo: a.user_photo ?? a.userPhoto ?? null,
    user_email: a.user_email ?? a.userEmail ?? a.created_by ?? '',

    car_brand: a.car_brand ?? a.carBrand ?? '',
    car_model: a.car_model ?? a.carModel ?? '',
    car_color: a.car_color ?? a.carColor ?? '',
    car_plate: a.car_plate ?? a.carPlate ?? '',
    vehicle_type: a.vehicle_type ?? a.vehicleType ?? 'car',

    price: Number(a.price ?? 0),
    available_in_minutes: Number(a.available_in_minutes ?? a.availableInMinutes ?? 0),

    address: a.address ?? a.street ?? a.road ?? '',
    latitude: lat,
    longitude: lng,

    allow_phone_calls: !!(a.allow_phone_calls ?? a.allowPhoneCalls),
    phone: a.phone ?? null,

    created_date: a.created_date ?? a.created_at ?? a.createdAt ?? null
  };
}

export default function Home() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialMode = urlParams.get('mode');
  const [mode, setMode] = useState(initialMode || null); // null, 'search', 'create'

  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, alert: null });
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    maxPrice: 7,
    maxMinutes: 25,
    maxDistance: 1
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me()
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadCount', user?.email],
    queryFn: async () => {
      if (!user?.email) return 0;
      const messages = await base44.entities.ChatMessage.filter({ receiver_id: user?.email, read: false });
      return messages.length;
    },
    enabled: !!user?.email,
    refetchInterval: 5000
  });

  const { data: rawAlerts = [] } = useQuery({
    queryKey: ['parkingAlerts'],
    queryFn: () => base44.entities.ParkingAlert.filter({ status: 'active' }),
    refetchInterval: mode === 'search' ? 5000 : false,
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
  }, []);

  const filteredAlerts = useMemo(() => {
    const list = Array.isArray(rawAlerts) ? rawAlerts : [];
    const normalized = list.map(normalizeAlert).filter(Boolean);

    const [uLat, uLng] = Array.isArray(userLocation) ? userLocation : [null, null];

    return normalized.filter((a) => {
      const price = Number(a.price);
      if (Number.isFinite(price) && price > filters.maxPrice) return false;

      const mins = Number(a.available_in_minutes);
      if (Number.isFinite(mins) && mins > filters.maxMinutes) return false;

      if (uLat != null && uLng != null) {
        const km = calculateDistance(uLat, uLng, a.latitude, a.longitude);
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
        user_name: currentUser?.name || currentUser?.email || 'Usuario',
        user_photo: currentUser?.photo || null,
        created_date: new Date().toISOString()
      };
      return base44.entities.ParkingAlert.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkingAlerts'] });
      setMode('search');
    }
  });

  const buyAlertMutation = useMutation({
    mutationFn: async (alert) => {
      const currentUser = await base44.auth.me();
      if (!alert?.id) throw new Error('Alert inválida');

      await base44.entities.Transaction.create({
        alert_id: alert.id,
        buyer_id: currentUser?.email || currentUser?.id || '',
        seller_id: alert.user_email || '',
        amount: Number(alert.price) || 0,
        status: 'pending'
      });

      await base44.entities.ChatMessage.create({
        alert_id: alert.id,
        sender_id: currentUser?.email || currentUser?.id || '',
        receiver_id: alert.user_email || '',
        message: `Solicitud de reserva enviada (${Number(alert.price || 0).toFixed(2)}€).`,
        read: false
      });

      return true;
    },
    onSuccess: () => {
      setConfirmDialog({ open: false, alert: null });
    }
  });

  const handleBuyAlert = (alert) => {
    setConfirmDialog({ open: true, alert });
  };

  const handleChat = async (alert) => {
    const currentUser = await base44.auth.me();
    const email = currentUser?.email || currentUser?.id || '';
    if (!email || !alert?.user_email) return;
    window.location.href = createPageUrl('Chats') + `?alertId=${encodeURIComponent(alert.id)}`;
  };

  const handleCall = (alert) => {
    if (!alert?.phone) return;
    window.location.href = `tel:${alert.phone}`;
  };

  const showRoute = !!selectedAlert && Array.isArray(userLocation);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header title="WaitMe!" />

      <div className="flex-1 min-h-0">
        {/* HOME INICIAL */}
        {!mode && (
          <div className="h-full flex flex-col items-center justify-center px-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-black/50 border border-purple-500/40 flex items-center justify-center shadow-xl">
                <div className="text-purple-400 font-extrabold text-2xl">W</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black">WaitMe!</div>
                <div className="text-purple-300/90 font-semibold mt-1">Aparca donde te avisen!</div>
              </div>
            </div>

            <div className="w-full max-w-sm mt-8 flex flex-col gap-4">
              <Button
                className="w-full h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                onClick={() => setMode('search')}
              >
                <MapPin className="w-5 h-5 mr-2" />
                ¿Dónde quieres aparcar?
              </Button>

              <Button
                className="w-full h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold"
                onClick={() => setMode('create')}
              >
                <Car className="w-5 h-5 mr-2" />
                ¡Estoy aparcado aquí!
              </Button>
            </div>
          </div>
        )}

        {/* MODO BUSCAR */}
        {mode === 'search' && (
          <div className="h-full flex flex-col">
            <div className="px-4 pt-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="border-purple-500/40 text-white bg-black/50 hover:bg-black/70"
                  onClick={() => setShowFilters(true)}
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>

            {/* Mapa + card (sin romper al click) */}
            <div className="flex-1 min-h-0 px-4 pt-3 pb-3">
              <div className="h-full flex flex-col gap-3">
                <div className="rounded-2xl overflow-hidden border border-purple-500/30 bg-black/40 h-[45%] min-h-[220px]">
                  <ParkingMap
                    alerts={searchAlerts}
                    onAlertClick={(a) => {
                      const safe = normalizeAlert(a);
                      if (safe) setSelectedAlert(safe);
                    }}
                    userLocation={userLocation}
                    selectedAlert={selectedAlert}
                    showRoute={showRoute}
                    zoomControl={true}
                  />
                </div>

                <div className="flex-1 min-h-0 overflow-hidden">
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

            <AnimatePresence>
              {showFilters && (
                <MapFilters
                  filters={filters}
                  alertsCount={searchAlerts.length}
                  onFilterChange={(f) => setFilters(f)}
                  onClose={() => setShowFilters(false)}
                />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* MODO CREAR */}
        {mode === 'create' && (
          <div className="h-full flex flex-col px-4 pt-3 pb-3">
            <CreateAlertCard
              address={address}
              setAddress={setAddress}
              userLocation={userLocation}
              selectedPosition={selectedPosition}
              setSelectedPosition={setSelectedPosition}
              onCreate={(data) => createAlertMutation.mutate(data)}
              isLoading={createAlertMutation.isPending}
            />
          </div>
        )}
      </div>

      <BottomNav unreadCount={unreadCount} />
      <NotificationManager />

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, alert: confirmDialog.alert })}>
        <DialogContent className="bg-black text-white border border-purple-500/30">
          <DialogHeader>
            <DialogTitle>Confirmar reserva</DialogTitle>
            <DialogDescription className="text-gray-300">
              ¿Quieres reservar esta plaza por {Number(confirmDialog.alert?.price || 0).toFixed(2)}€?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-gray-700 text-white"
              onClick={() => setConfirmDialog({ open: false, alert: null })}
            >
              Cancelar
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => buyAlertMutation.mutate(confirmDialog.alert)}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}