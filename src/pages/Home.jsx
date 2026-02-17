import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
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

const MagnifierIconProfile = ({ color = "#8b5cf6", size = "w-16 h-16" }) => (
  <svg viewBox="0 0 24 24" className={size} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2.2" />
    <path d="M20 20L17 17" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const CarIconProfile = ({ color = "#ffffff", size = "w-16 h-16" }) => (
  <svg viewBox="0 0 64 40" className={size} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 28L14 14C15 10 18 8 22 8H42C46 8 49 10 50 14L54 28"
      stroke={color}
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 28H56C58.2 28 60 29.8 60 32V36H52V34C52 32.9 51.1 32 50 32H14C12.9 32 12 32.9 12 34V36H4V32C4 29.8 5.8 28 8 28Z"
      stroke={color}
      strokeWidth="2.8"
      strokeLinejoin="round"
    />
    <circle cx="18" cy="34" r="4" stroke={color} strokeWidth="2.8" />
    <circle cx="46" cy="34" r="4" stroke={color} strokeWidth="2.8" />
  </svg>
);

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState('landing'); // 'landing' | 'search' | 'create'
  const [userLocation, setUserLocation] = useState(null);

  // Search mode states
  const [filters, setFilters] = useState({ maxPrice: 20, maxMinutes: 20, maxKm: 5 });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Create mode states
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [address, setAddress] = useState('');

  // Dialog
  const [showBuyConfirm, setShowBuyConfirm] = useState(false);
  const [pendingBuyAlert, setPendingBuyAlert] = useState(null);

  // Demo flow start/subscribe
  useEffect(() => {
    if (isDemoMode()) {
      startDemoFlow();
      const unsub = subscribeDemoFlow(() => {
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
      });
      return () => unsub?.();
    }
  }, [queryClient]);

  // User query
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const res = await base44.auth.getUser();
        return res?.user || null;
      } catch {
        return null;
      }
    },
  });

  // Alerts query (demo or backend)
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      try {
        if (isDemoMode()) return getDemoAlerts();
        const res = await base44.from('alerts').select('*').order('created_at', { ascending: false });
        return res?.data || [];
      } catch {
        return [];
      }
    },
  });

  // Derive search alerts with filters
  const searchAlerts = useMemo(() => {
    const all = alerts || [];
    const filtered = all.filter((a) => {
      const priceOk = (a?.price ?? 0) <= (filters?.maxPrice ?? 999);
      const minutesOk = (a?.available_in_minutes ?? 0) <= (filters?.maxMinutes ?? 999);
      let kmOk = true;
      if (userLocation && a?.latitude && a?.longitude) {
        const km = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
        kmOk = km <= (filters?.maxKm ?? 999);
      }
      return priceOk && minutesOk && kmOk;
    });
    return filtered;
  }, [alerts, filters, userLocation]);

  // Geolocation
  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        if (mode === 'create') setSelectedPosition(loc);
      },
      () => {}
    );
  };

  useEffect(() => {
    getCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Suggestions search
  const handleSearchInputChange = async (e) => {
    const value = e.target.value;
    setSearchInput(value);
    if (!value || value.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/functions/searchGooglePlaces?query=${encodeURIComponent(value)}`);
      const data = await res.json();
      setSuggestions(data?.results || []);
    } catch {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = async (suggestion) => {
    setSearchInput(suggestion.display_name || '');
    setShowSuggestions(false);
    setSuggestions([]);

    // Center map to suggestion
    if (suggestion?.lat && suggestion?.lon) {
      const loc = { lat: Number(suggestion.lat), lng: Number(suggestion.lon) };
      setUserLocation(loc);
    }
  };

  // Actions
  const handleBuyAlert = (alert) => {
    setPendingBuyAlert(alert);
    setShowBuyConfirm(true);
  };

  const handleChat = (alert) => {
    navigate(createPageUrl('Chat'), { state: { alertId: alert?.id } });
  };

  const handleCall = (alert) => {
    if (alert?.phone) window.location.href = `tel:${alert.phone}`;
  };

  const buyAlertMutation = useMutation({
    mutationFn: async (alert) => {
      // demo: no backend
      if (isDemoMode()) return true;

      // example backend update
      const res = await base44.from('alerts').update({ status: 'reserved' }).eq('id', alert.id);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setShowBuyConfirm(false);
      setPendingBuyAlert(null);
    },
    onError: () => {
      setShowBuyConfirm(false);
      setPendingBuyAlert(null);
    },
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <div className="pt-[60px] pb-[88px]">
        <AnimatePresence mode="wait">
          {/* LANDING */}
          {mode === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-6 pt-8"
            >
              <div className="flex flex-col items-center">
                <img
                  src={appLogo}
                  alt="WaitMe"
                  className="w-[120px] h-[120px] rounded-[24px] object-cover"
                />
                <div className="mt-3 text-center">
                  <div className="text-3xl font-extrabold tracking-tight">WaitMe!</div>
                  <div className="text-white/70 text-base mt-1">Aparca donde te avisen</div>
                </div>
              </div>

              <div className="mt-10 space-y-6">
                <Button
                  onClick={() => setMode('search')}
                  className="w-full h-20 bg-white text-black hover:bg-white/90 text-lg font-medium rounded-2xl flex items-center justify-center gap-4 [&_svg]:!w-10 [&_svg]:!h-10"
                >
                  <MagnifierIconProfile color="#8b5cf6" size="w-14 h-14" />
                  ¿ Dónde quieres aparcar ?
                </Button>

                <Button
                  onClick={() => setMode('create')}
                  className="w-full h-20 bg-purple-600 hover:bg-purple-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-4 [&_svg]:!w-20 [&_svg]:!h-14"
                >
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
              {/* Mapa: MISMO TAMAÑO que “Estoy aparcado aquí” */}
              <div className="relative px-3 pt-[14px] pb-2 flex-none" style={{ height: '280px' }}>
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

              {/* Buscar calle: MISMO FORMATO que el título (“¿Dónde…?”) */}
              <div className="px-7 pt-[2px] pb-[2px] flex-shrink-0 z-50 relative">
                <div className="bg-purple-600/20 border-2 border-purple-500/50 rounded-xl px-3 py-[6px] relative">
                  <input
                    type="text"
                    placeholder="Buscar dirección..."
                    value={searchInput}
                    onChange={handleSearchInputChange}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full bg-transparent text-white text-center font-semibold text-sm focus:outline-none border-none placeholder:text-white/70"
                  />

                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
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

              {/* Tarjeta: ocupa TODO el resto hasta el menú de abajo */}
              <div className="px-4 mt-[10px] flex-1 min-h-0 flex items-stretch">
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
              <div className="relative px-3 pt-[14px] pb-2 flex-none" style={{ height: "280px" }}>
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
                        created_by: currentUser?.id || null,
                        status: 'active',
                      };

                      // demo: no backend create
                      if (isDemoMode()) {
                        alert('Demo: alerta creada');
                        setMode('landing');
                        return;
                      }

                      base44.from('alerts').insert(payload).then(() => {
                        queryClient.invalidateQueries({ queryKey: ['alerts'] });
                        setMode('landing');
                      });
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />

      {/* Confirmación compra */}
      <Dialog open={showBuyConfirm} onOpenChange={setShowBuyConfirm}>
        <DialogContent className="bg-gray-900 text-white border border-gray-700">
          <DialogHeader>
            <DialogTitle>Confirmar reserva</DialogTitle>
            <DialogDescription className="text-white/70">
              ¿Quieres reservar esta alerta?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowBuyConfirm(false)}
              className="text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => pendingBuyAlert && buyAlertMutation.mutate(pendingBuyAlert)}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={buyAlertMutation.isPending}
            >
              Reservar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NotificationManager />
    </div>
  );
}
