import * as alertsService from '@/store/alertsService';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, MapPin, Clock, Euro, X } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ParkingMap from '@/components/map/ParkingMap';
import MapFilters from '@/components/map/MapFilters';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import UserAlertCard from '@/components/cards/UserAlertCard';
import NotificationManager from '@/components/NotificationManager';
import { isDemoMode, startDemoFlow, subscribeDemoFlow, getDemoAlerts } from '@/components/DemoFlowManager';
import appLogo from '@/assets/d2ae993d3_WaitMe.png';
import { getMockNearbyAlerts } from '@/lib/mockNearby';

// ======================
// Helpers
// ======================
const FALLBACK_LAT = 43.3623; // Oviedo
const FALLBACK_LNG = -5.8489; // Oviedo


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
  const [mode, setMode] = useState(null);
  // null | 'search' | 'create'

  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  const [pendingPublishPayload, setPendingPublishPayload] = useState(null);
  const [oneActiveAlertOpen, setOneActiveAlertOpen] = useState(false);
  const [demoTick, setDemoTick] = useState(0);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, alert: null });

  const [filters, setFilters] = useState({
    maxPrice: 10,
    maxMinutes: 30,
    maxDistance: 10
  });

  // BLINDADO: resetea SIEMPRE al logo (los 2 botones grandes), sin tocar la UI del logo.
  const resetToLogo = useCallback((opts = { invalidate: true }) => {
    setMode(null);
    setSelectedAlert(null);
    setShowFilters(false);
    setConfirmDialog({ open: false, alert: null });
    setSearchQuery('');
    if (opts?.invalidate) queryClient.invalidateQueries();
  }, [queryClient]);

  // Botón "Mapa": escucha el evento global y vuelve al logo SIEMPRE.
  useEffect(() => {
    const goLogo = () => resetToLogo({ invalidate: true });
    window.addEventListener('waitme:goLogo', goLogo);
    return () => window.removeEventListener('waitme:goLogo', goLogo);
  }, [resetToLogo]);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true
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
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  const { data: rawAlerts } = useQuery({
    queryKey: ['alerts', mode, userLocation],
    enabled: mode === 'search',
    queryFn: async () => {
      // 10 usuarios cerca (demo local)
      return getMockNearbyAlerts(userLocation);
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  // Una sola fuente de verdad (también alimenta la bolita del BottomNav)
  const { data: myAlerts = [] } = useQuery({
    queryKey: ['myAlerts'],
    enabled: true,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const uid = user?.id;
      const email = user?.email;
      if (!uid && !email) return [];

      if (uid) return (await base44.entities.ParkingAlert.filter({ user_id: uid })) || [];
      return (await base44.entities.ParkingAlert.filter({ user_email: email })) || [];
    }
  });

  const myActiveAlerts = useMemo(() => {
    return (myAlerts || []).filter((a) => {
      const st = String(a?.status || '').toLowerCase();
      return st === 'active' || st === 'reserved';
    });
  }, [myAlerts]);

  useEffect(() => {
    if (!user?.id && !user?.email) return;
    queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.email]);

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
      () => {
        // iOS PWA a veces deniega/retarda la geo: ponemos fallback para que SIEMPRE haya mapa + tarjetas.
        setUserLocation([FALLBACK_LAT, FALLBACK_LNG]);
        setSelectedPosition({ lat: FALLBACK_LAT, lng: FALLBACK_LNG });
        if (!address) setAddress('Oviedo');
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 10 * 60 * 1000 }
    );
  };

  useEffect(() => {
    getCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Defensa extra: si el logo falla al cargar (iOS/Safari a veces), reintenta 1 vez.

  useEffect(() => {
    if (!isDemoMode()) return;
    startDemoFlow();
    const unsub = subscribeDemoFlow(() => setDemoTick((t) => t + 1));
    return () => unsub?.();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('reset')) {
      resetToLogo({ invalidate: false });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location.search, resetToLogo]);

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

  const homeMapAlerts = useMemo(() => {
    // Solo mostramos usuarios/alertas en la pantalla "Dónde quieres aparcar"
    if (mode === 'search') return searchAlerts || [];
    return [];
  }, [mode, searchAlerts]);

  const createAlertMutation = useMutation({
  mutationFn: async (data) => {
    if (myActiveAlerts && myActiveAlerts.length > 0) {
      throw new Error('ALREADY_HAS_ALERT');
    }

    const uid = user?.id;
    const email = user?.email;

    if (uid || email) {
      const mine = uid
        ? await base44.entities.ParkingAlert.filter({ user_id: uid })
        : await base44.entities.ParkingAlert.filter({ user_email: email });

      const hasActive = (mine || []).some((a) => {
        const st = String(a?.status || '').toLowerCase();
        return st === 'active' || st === 'reserved';
      });

      if (hasActive) {
        throw new Error('ALREADY_HAS_ALERT');
      }
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
      created_from: 'parked_here',
      status: 'active'
    });
  },

  onMutate: async (data) => {
  const now = Date.now();
  const futureTime = new Date(now + data.available_in_minutes * 60 * 1000);

  const instantAlert = {
    id: `instant_${Date.now()}`,
    ...data,
    wait_until: futureTime.toISOString(),
    created_from: 'parked_here',
    status: 'active',
    created_date: new Date().toISOString()
  };

  queryClient.setQueryData(['myAlerts'], (old) => {
    const list = Array.isArray(old) ? old : (old?.data || []);
    return [instantAlert, ...list];
  });

  window.dispatchEvent(new Event('waitme:badgeRefresh'));
},

  onSuccess: (newAlert) => {
    queryClient.setQueryData(['alerts'], (old) => {
      const list = Array.isArray(old) ? old : (old?.data || []);
      return [newAlert, ...list.filter(a => !a.id?.startsWith('temp_'))];
    });

    queryClient.setQueryData(['myAlerts'], (old) => {
      const list = Array.isArray(old) ? old : (old?.data || []);
      return [newAlert, ...list.filter(a => !a.id?.startsWith('temp_'))];
    });

    try {
      window.dispatchEvent(new Event('waitme:badgeRefresh'));
    } catch {}
    setConfirmPublishOpen(false);
    setPendingPublishPayload(null);
    navigate(createPageUrl('History'));
  },

  onError: (error) => {
    if (error?.message === 'ALREADY_HAS_ALERT') {
      // CERRAMOS CUALQUIER DIALOG ABIERTO
      setConfirmPublishOpen(false);
      setPendingPublishPayload(null);

      // ABRIMOS SOLO EL MENSAJE MORADO
      setOneActiveAlertOpen(true);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['alerts'] });
    queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
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
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
      try { window.dispatchEvent(new Event('waitme:badgeRefresh')); } catch {}
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
    <div className="min-min-h-[100dvh] w-full bg-black text-white flex flex-col">
      <NotificationManager user={user} />

      <Header
        iconVariant="bottom"
        title="WaitMe!"
        unreadCount={unreadCount}
        showBackButton={!!mode}
        onBack={() => {
          resetToLogo({ invalidate: false });
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
                <img
                  loading="eager"
                  decoding="sync"
                  fetchPriority="high"
                  src={appLogo}
                  alt="WaitMe!"
                  className="w-[212px] h-[212px] mb-0 object-contain mt-[0px]"
                />

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
                  <MagnifierIconProfile color="#8b5cf6" size="w-14 h-14" />
                  ¿ Dónde quieres aparcar ?
                </Button>

                <Button
                  onClick={() => {
                    // Al entrar en "Estoy aparcado aquí" debe autoubicar y rellenar calle.
                    getCurrentLocation();
                    setMode('create');
                  }}
                  className="w-full h-20 bg-purple-600 hover:bg-purple-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-4 [&_svg]:!w-20 [&_svg]:!h-14"
                >
                  <CarIconProfile color="#000000" size="w-20 h-14" />
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
              <div className="relative px-3 pt-[14px] pb-2 flex-none"
                style={{ height: "280px" }}>
                <div
                  className="rounded-2xl border-2 border-purple-500 overflow-hidden h-full"
                  style={{
                    boxShadow:
                      '0 0 30px rgba(168, 85, 247, 0.5), inset 0 0 20px rgba(168, 85, 247, 0.2)',
                  }}
                >
                  <ParkingMap
                    alerts={searchAlerts}
                    onAlertClick={setSelectedAlert}
                    userLocation={userLocation}
                    selectedAlert={selectedAlert}
                    showRoute={!!selectedAlert}
                    zoomControl={true}
                    className="h-full"
                  />
                </div>
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

              <div className="px-7 pt-[2px] pb-[2px] flex-shrink-0">
                <div className="bg-gray-900/40 backdrop-blur-sm border-2 border-purple-500/50 rounded-xl px-3 py-[6px] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar dirección..."
                    className="bg-transparent border-0 text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-7 text-sm p-0"
                  />
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
              <div className="relative px-3 pt-[14px] pb-2 flex-none"
                style={{ height: "280px" }}>
                <div
                  className="rounded-2xl border-2 border-purple-500 overflow-hidden h-full"
                  style={{
                    boxShadow:
                      '0 0 30px rgba(168, 85, 247, 0.5), inset 0 0 20px rgba(168, 85, 247, 0.2)',
                  }}
                >
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
              </div>

              <div className="px-7 pt-[2px] pb-[2px] flex-shrink-0">
                <div className="bg-purple-600/20 border-2 border-purple-500/50 rounded-xl px-3 py-[2px]">
                  <h3 className="text-white font-semibold text-center text-sm">
                    ¿ Dónde estas aparcado ?
                  </h3>
                </div>
              </div>

              <div className="px-4 mt-[10px] flex-1 min-h-0 flex items-stretch">
                <div className="w-full h-full">
                  <CreateAlertCard
                    address={address}
                    onAddressChange={setAddress}
                    onUseCurrentLocation={getCurrentLocation}
                    useCurrentLocationLabel="Ubicación actual"
                    onCreateAlert={async (data) => {
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

                      // Mensaje SIEMPRE: no depende de que la query haya terminado
                      if (myActiveAlerts && myActiveAlerts.length > 0) {
                        setOneActiveAlertOpen(true);
                        return;
                      }
                      try {
                        const uid = user?.id;
                        const email = user?.email;
                        if (uid || email) {
                          const mine = uid
                            ? await base44.entities.ParkingAlert.filter({ user_id: uid })
                            : await base44.entities.ParkingAlert.filter({ user_email: email });
                          const hasActive = (mine || []).some((a) => {
                            const st = String(a?.status || '').toLowerCase();
                            return st === 'active' || st === 'reserved';
                          });
                          if (hasActive) {
                            setOneActiveAlertOpen(true);
                            return;
                          }
                        }
                      } catch {}

                      setPendingPublishPayload(payload);
                      setConfirmPublishOpen(true);
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

      {oneActiveAlertOpen && (
  <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center">
    <div className="relative bg-gray-900 border-t-2 border-b-2 border-purple-500 max-w-sm w-[90%] rounded-xl p-6">
      
      <button
        onClick={() => setOneActiveAlertOpen(false)}
        className="absolute top-3 right-3 w-7 h-7 rounded-md bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
        type="button"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col items-center text-center space-y-3">
  <span className="text-white font-semibold text-base">
    Ya tienes una alerta publicada.
  </span>

  <span className="text-gray-400 text-sm">
    No puedes tener 2 alertas activas.
  </span>
</div>
    </div>
  </div>
)}

      <Dialog open={confirmPublishOpen} onOpenChange={(open) => {
        setConfirmPublishOpen(open);
        if (!open) setPendingPublishPayload(null);
      }}>
        <DialogContent
          hideClose
          className="bg-gray-900 border border-gray-800 text-white max-w-sm border-t-2 border-b-2 border-purple-500"
        >
          {/* Caja morada centrada */}
          <div className="flex justify-center">
            <div className="px-4 py-2 rounded-lg bg-purple-700/60 border border-purple-500/60">
              <span className="text-white font-semibold text-sm">Vas a publicar una alerta:</span>
            </div>
          </div>

          {/* Tarjeta incrustada */}
          <div className="mt-4">
            <div className="bg-gray-900 rounded-xl p-4 border-2 border-purple-500/50">
              {/* Calle */}
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span className="text-white">En:</span>
                <span className="text-purple-400 font-semibold">
                  {pendingPublishPayload?.address || ''}
                </span>
              </div>

              {/* Te vas en */}
              <div className="flex items-center gap-2 text-sm mt-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-white">Te vas en:</span>
                <span className="text-purple-400 font-semibold text-base">
                  {pendingPublishPayload?.available_in_minutes ?? ''} minutos
                </span>
              </div>

              {/* Precio */}
              <div className="flex items-center gap-2 text-sm mt-2">
                <Euro className="w-4 h-4 text-purple-400" />
                <span className="text-white">Precio:</span>
                <span className="text-purple-400 font-semibold text-base">
                  {pendingPublishPayload?.price ?? ''} €
                </span>
              </div>

              {/* Debes esperar... centrado */}
              <div className="mt-3 text-center text-purple-400 font-bold text-base">
                {(() => {
                  const mins = Number(pendingPublishPayload?.available_in_minutes ?? 0);
                  if (!mins) return null;
                  const waitUntil = new Date(Date.now() + mins * 60 * 1000);
                  const hhmm = waitUntil.toLocaleTimeString('es-ES', {
                    timeZone: 'Europe/Madrid',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  });
                  return (
                    <>
                      <span className="text-purple-400">Debes esperar hasta las: </span>
<span className="text-white text-xl font-bold">{hhmm}</span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Botones: ancho solo del texto, Aceptar izquierda / Rechazar derecha */}
          <DialogFooter className="flex flex-row items-center justify-center gap-3 mt-4 w-full">
            <Button
              onClick={() => {
                if (!pendingPublishPayload) return;
                setConfirmPublishOpen(false);
                createAlertMutation.mutate(pendingPublishPayload);
                setPendingPublishPayload(null);
              }}
              className="w-auto px-6 min-w-[118px] bg-purple-600 hover:bg-purple-700"
            >
              Aceptar
            </Button>

            <Button
              onClick={() => {
                setConfirmPublishOpen(false);
                setPendingPublishPayload(null);
              }}
              className="w-auto px-6 min-w-[118px] bg-red-600 hover:bg-red-700 text-white"
            >
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              className="w-auto px-6 min-w-[118px] bg-purple-600 hover:bg-purple-700"
            >
              Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
