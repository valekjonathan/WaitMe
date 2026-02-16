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
import appLogo from '@/assets/d2ae993d3_WaitMe.png';

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
  return [];
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

const MagnifierIconProfile = ({ color = "#8b5cf6", size = "w-14 h-14" }) => (
  <svg viewBox="0 0 48 48" className={size} fill="none">
    {/* Lente */}
    <circle cx="20" cy="20" r="12" fill={color} stroke="white" strokeWidth="1.5" />
    {/* Brillo */}
    <path d="M15 16 C16 13, 18 12, 21 12" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" />
    {/* Mango */}
    <path d="M28 28 L38 38" stroke="white" strokeWidth="4" strokeLinecap="round" />
    {/* Tope mango */}
    <path d="M36.8 36.8 L40.8 40.8" stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
  </svg>
);


export default function Home() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState(null); // null | 'search' | 'create'
  const [demoTick, setDemoTick] = useState(0);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, alert: null });

  const [filters, setFilters] = useState({
    maxPrice: 10,
    maxMinutes: 30,
    maxDistance: 10
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['unreadCount', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const notifications = await base44.entities.Notification.filter({
        user_id: user.id,
        read: false
      });
      return notifications?.length || 0;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30000
  });

  const { data: rawAlerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      return [];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 60000
  });

  const { data: myActiveAlerts = [] } = useQuery({
    queryKey: ['myActiveAlerts', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      return [];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const handleSearchInputChange = async (e) => {
    const val = e.target.value;
    setSearchInput(val);

    if (!val || val.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&addressdetails=1&limit=5`);
      const data = await res.json();
      setSuggestions(data || []);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setSearchInput(suggestion.display_name);
    setShowSuggestions(false);

    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    setUserLocation([lat, lng]);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
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

  useEffect(() => {
    if (!isDemoMode()) return;
    startDemoFlow();
    const unsub = subscribeDemoFlow(() => setDemoTick((t) => t + 1));
    return () => unsub?.();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('reset')) {
      setMode(null);
      setSelectedAlert(null);
      setShowFilters(false);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location.search]);

  const homeMapAlerts = useMemo(() => {
    return [];
  }, []);

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
    return filteredAlerts || [];
  }, [mode, filteredAlerts]);

  const createAlertMutation = useMutation({
    mutationFn: async (data) => {
      if (myActiveAlerts && myActiveAlerts.length > 0) {
        throw new Error('ALREADY_HAS_ALERT');
      }

      const now = Date.now();
      const futureTime = new Date(now + data.available_in_minutes * 60 * 1000);

      return base44.entities.ParkingAlert.create({
        user_id: user?.id,
        user_email: user?.email,
        user_name: data.user_name,
        user_photo: data.user_photo,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        price: data.price,
        available_in_minutes: data.available_in_minutes,
        car_brand: data.car_brand || '',
        car_model: data.car_model || '',
        car_color: data.car_color || '',
        car_plate: data.car_plate || '',
        phone: data.phone,
        allow_phone_calls: data.allow_phone_calls,
        wait_until: futureTime.toISOString(),
        status: 'active'
      });
    },
    onMutate: async (data) => {
      navigate(createPageUrl('History'), { replace: true });

      await queryClient.cancelQueries({ queryKey: ['alerts'] });
      await queryClient.cancelQueries({ queryKey: ['myActiveAlerts', user?.id] });

      const now = Date.now();
      const futureTime = new Date(now + data.available_in_minutes * 60 * 1000);

      const optimisticAlert = {
        id: `temp_${Date.now()}`,
        ...data,
        wait_until: futureTime.toISOString(),
        status: 'active',
        created_date: new Date().toISOString()
      };

      queryClient.setQueryData(['alerts'], (old) => {
        const list = Array.isArray(old) ? old : (old?.data || []);
        return [optimisticAlert, ...list];
      });

      queryClient.setQueryData(['myActiveAlerts', user?.id], (old) => {
        const list = Array.isArray(old) ? old : (old?.data || []);
        return [optimisticAlert, ...list];
      });
    },
    onSuccess: (newAlert) => {
      queryClient.setQueryData(['alerts'], (old) => {
        const list = Array.isArray(old) ? old : (old?.data || []);
        return [newAlert, ...list.filter(a => !a.id?.startsWith('temp_'))];
      });

      queryClient.setQueryData(['myActiveAlerts', user?.id], (old) => {
        const list = Array.isArray(old) ? old : (old?.data || []);
        return [newAlert, ...list.filter(a => !a.id?.startsWith('temp_'))];
      });
    },
    onError: (error) => {
      if (error.message === 'ALREADY_HAS_ALERT') {
        alert('Solo puedes tener 1 alerta activa');
      }
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['myActiveAlerts'] });
    }
  });

  const buyAlertMutation = useMutation({
    mutationFn: async (alert) => {
      if (alert?.is_demo) {
        return { demo: true };
      }

      const buyerName = user?.full_name || user?.display_name || 'Usuario';
      const buyerCarBrand = user?.car_brand || '';
      const buyerCarModel = user?.car_model || '';
      const buyerCarColor = user?.car_color || 'gris';
      const buyerPlate = user?.car_plate || '';
      const buyerVehicleType = user?.vehicle_type || 'car';

      return Promise.all([
        base44.entities.ParkingAlert.update(alert.id, {
          status: 'reserved',
          reserved_by_id: user?.id,
          reserved_by_email: user?.email,
          reserved_by_name: buyerName,
          reserved_by_car: `${buyerCarBrand} ${buyerCarModel}`.trim(),
          reserved_by_car_color: buyerCarColor,
          reserved_by_plate: buyerPlate,
          reserved_by_vehicle_type: buyerVehicleType
        }),
        base44.entities.Transaction.create({
          alert_id: alert.id,
          buyer_id: user?.id,
          seller_id: alert.user_id || alert.created_by,
          amount: Number(alert.price) || 0,
          status: 'pending'
        }),
        base44.entities.ChatMessage.create({
          conversation_id: `conv_${alert.id}_${user?.id}`,
          alert_id: alert.id,
          sender_id: user?.id,
          receiver_id: alert.user_id || alert.created_by,
          message: `Ey! Te he enviado un WaitMe!`,
          read: false
        })
      ]);
    },
    onMutate: async (alert) => {
      setConfirmDialog({ open: false, alert: null });
      navigate(createPageUrl('History'));

      await queryClient.cancelQueries({ queryKey: ['alerts'] });

      const previousAlerts = queryClient.getQueryData(['alerts']);

      queryClient.setQueryData(['alerts'], (old) => {
        const list = Array.isArray(old) ? old : (old?.data || []);
        return list.map(a => a.id === alert.id ? { ...a, status: 'reserved', reserved_by_id: user?.id } : a);
      });

      return { previousAlerts };
    },
    onError: (err, alert, context) => {
      if (context?.previousAlerts) {
        queryClient.setQueryData(['alerts'], context.previousAlerts);
      }
      setSelectedAlert(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['myActiveAlerts'] });
    }
  });

  const handleBuyAlert = (alert) => {
    setConfirmDialog({ open: true, alert });
  };

  const handleChat = async () => {
    navigate(createPageUrl('History'));
  };

  const handleCall = async () => {
    navigate(createPageUrl('History'));
  };

  return (
    <div className="min-h-screen w-full bg-black text-white">
      <NotificationManager user={user} />

      <Header
        iconVariant="bottom"
        title="WaitMe!"
        unreadCount={unreadCount}
        showBackButton={!!mode}
        onBack={() => {
          setMode(null);
          setSelectedAlert(null);
        }}
      />

      <main className="fixed inset-0 top-0 bottom-0">
        <AnimatePresence mode="wait">
          {/* HOME PRINCIPAL */}
          {!mode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
            >
              <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                <div className="w-full h-full">
                  <ParkingMap
                    alerts={homeMapAlerts}
                    userLocation={userLocation}
                    userLocationOffsetY={120}
                    zoomControl={false}
                  />
                </div>
              </div>

              <div className="absolute inset-0 bg-purple-900/40 pointer-events-none"></div>

              <div className="text-center mb-4 w-full flex flex-col items-center relative top-[-20px] z-10 px-6">
                {/* Logo */}
                {/* Logo */}
<img
  src={appLogo}
  alt="WaitMe!"
  className="w-[212px] h-[212px] mb-0 object-contain mt-[0px]"
/>

                {/* SUBIDO “AL RAS” */}
                <h1 className="text-4xl font-bold leading-none whitespace-nowrap relative top-[-65px]">
                  Wait<span className="text-purple-500">Me!</span>
                </h1>

                <p className="text-xl font-bold mt-[3px] whitespace-nowrap relative top-[-65px]">
                  Aparca donde te <span className="text-purple-500">avisen!</span>
                </p>
              </div>

              {/* BOTONES */}
              <div className="w-full max-w-sm mx-auto space-y-4 relative top-[-20px] z-10 px-6">
                <Button
                  onClick={() => setMode('search')}
                  className="w-full h-20 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-4 [&_svg]:!w-10 [&_svg]:!h-10"
                >
                  {/* ICONO UBICACIÓN 3x (size pisa el 24x24 de lucide) */}
                  <MagnifierIconProfile color="#8b5cf6" size="w-14 h-14" />
                  ¿ Dónde quieres aparcar ?
                </Button>

                <Button
                  onClick={() => setMode('create')}
                  className="w-full h-20 bg-purple-600 hover:bg-purple-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-4 [&_svg]:!w-20 [&_svg]:!h-14"
                >
                  {/* ICONO COCHE = PERFIL */}
                  <CarIconProfile size="w-20 h-14" />
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
              className="fixed inset-0 top-[60px] flex flex-col"
              style={{ overflow: 'hidden', height: 'calc(100dvh - 60px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}
            >
              <div className="h-[44%] relative px-3 pt-[14px] pb-2 flex-shrink-0">
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
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowFilters(false)}
                        className="absolute inset-0 z-[999]"
                      />
                      <MapFilters
                        filters={filters}
                        onFilterChange={setFilters}
                        onClose={() => setShowFilters(false)}
                        alertsCount={searchAlerts.length}
                      />
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div className="px-7 py-3 flex-shrink-0 z-50 relative">
                <div className="bg-purple-600/20 border-2 border-purple-500/50 rounded-xl px-3 py-[11px]">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <input
                      type="text"
                      placeholder="Buscar dirección..."
                      value={searchInput}
                      onChange={handleSearchInputChange}
                      onFocus={() => setShowSuggestions(true)}
                      className="w-full bg-transparent text-white pl-10 pr-4 py-1 text-sm focus:outline-none border-none"
                    />
                  </div>
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-[310px] overflow-y-auto z-50">
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white text-sm border-b border-gray-700 last:border-b-0 transition-colors"
                        >
                          {suggestion.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 px-4 pt-2 pb-3 min-h-0 overflow-hidden flex items-start">
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
              className="fixed inset-0 top-[60px] flex flex-col"
              style={{ overflow: 'hidden', height: 'calc(100dvh - 60px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}
            >
              <div className="relative px-3 pt-[14px] pb-2 flex-none" style={{ height: "calc(40% + 30px)" }}>
                <ParkingMap
                  useCenterPin={true}
                  userLocation={userLocation}
                  zoomControl={true}
                  className="h-full"
                  onMapMove={(center) => {
                    setSelectedPosition({ lat: center[0], lng: center[1] });
                  }}
                  onMapMoveEnd={(center) => {
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${center[0]}&lon=${center[1]}`)
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
                />
              </div>

              <div className="px-7 py-2 flex-shrink-0">
                <div className="bg-purple-600/20 border-2 border-purple-500/50 rounded-xl px-3 py-[11px]">
                  <h3 className="text-white font-semibold text-center text-sm">
                    ¿ Dónde estas aparcado ?
                  </h3>
                </div>
              </div>

              <div className="px-4 pt-1 flex-1 min-h-0 flex items-stretch">
                <div className="w-full h-full">
                  <CreateAlertCard
                    address={address}
                    onAddressChange={setAddress}
                    onUseCurrentLocation={getCurrentLocation}
                    useCurrentLocationLabel="Ubicación actual"
                    onCreateAlert={(data) => {
                      if (!selectedPosition || !address) {
                        alert('Por favor, selecciona una ubicación en el mapa');
                        return;
                      }

                      const currentUser = user;
                      const payload = {
                        latitude: selectedPosition.lat,
                        longitude: selectedPosition.lng,
                        address: address,
                        price: data.price,
                        available_in_minutes: data.minutes,
                        user_name: currentUser?.full_name?.split(' ')[0] || currentUser?.display_name || 'Usuario',
                        user_photo: currentUser?.photo_url || null,
                        car_brand: currentUser?.car_brand || 'Sin marca',
                        car_model: currentUser?.car_model || 'Sin modelo',
                        car_color: currentUser?.car_color || 'gris',
                        car_plate: currentUser?.car_plate || '0000XXX',
                        phone: currentUser?.phone || null,
                        allow_phone_calls: currentUser?.allow_phone_calls || false
                      };

                      createAlertMutation.mutate(payload);
                    }}
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
            >
              Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}