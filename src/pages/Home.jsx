import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, SlidersHorizontal, Car } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ParkingMap from '@/components/map/ParkingMap';
import MapFilters from '@/components/map/MapFilters';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import UserAlertCard from '@/components/cards/UserAlertCard';
import NotificationManager from '@/components/NotificationManager';

const MADRID_CENTER = [40.4168, -3.7038]; // centro inicial SIEMPRE (Madrid)

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
  const baseLat = lat ?? MADRID_CENTER[0];
  const baseLng = lng ?? MADRID_CENTER[1];

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
      address: 'Gran Vía, Madrid',
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
      address: 'Sol, Madrid',
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
      address: 'Plaza Mayor, Madrid',
      phone: '+34634567890',
      allow_phone_calls: true
    }
  ];
};

// fetch con timeout para iOS (evita cuelgues silenciosos)
const fetchWithTimeout = async (url, options = {}, timeoutMs = 7000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
};

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState(null); // null | 'search' | 'create'
  const [selectedAlert, setSelectedAlert] = useState(null);

  // ✅ iPhone rápido: SIEMPRE centro inicial Madrid, y luego si llega geo se actualiza
  const [userLocation, setUserLocation] = useState(MADRID_CENTER);
  const [selectedPosition, setSelectedPosition] = useState({ lat: MADRID_CENTER[0], lng: MADRID_CENTER[1] });

  const [address, setAddress] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, alert: null });

  // ✅ evita crash iOS: mapa se monta tras el primer frame real
  const [mapReady, setMapReady] = useState(false);

  const [filters, setFilters] = useState({
    maxPrice: 10,
    maxMinutes: 30,
    maxDistance: 10
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
    cacheTime: 300000
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['unreadCount', user?.id],
    enabled: !!user?.id,
    staleTime: 30000,
    cacheTime: 300000,
    queryFn: async () => {
      const notifications = await base44.entities.Notification.filter({
        recipient_id: user.id,
        read: false
      });
      return notifications?.length || 0;
    }
  });

  // ✅ “tiempo real” para coches cercanos en el mapa de fondo:
  // cargamos alertas siempre (modo null también) y refrescamos cada 15s
  const { data: rawAlertsAll = [] } = useQuery({
    queryKey: ['alertsAll'],
    staleTime: 15000,
    cacheTime: 300000,
    refetchInterval: 15000,
    queryFn: async () => {
      const alerts = await base44.entities.ParkingAlert.list();
      const list = Array.isArray(alerts) ? alerts : (alerts?.data || []);
      return list.filter(a => (a?.status || 'active') === 'active' || (a?.status || '') === 'reserved');
    }
  });

  const { data: myActiveAlerts = [] } = useQuery({
    queryKey: ['myActiveAlerts', user?.id],
    enabled: !!user?.id && mode === 'create',
    staleTime: 30000,
    cacheTime: 300000,
    queryFn: async () => {
      const alerts = await base44.entities.ParkingAlert.list();
      const list = Array.isArray(alerts) ? alerts : (alerts?.data || []);
      return list.filter(a => {
        const isMine = a.user_id === user?.id || a.created_by === user?.id;
        const isActive = a.status === 'active' || a.status === 'reserved';
        return isMine && isActive;
      });
    }
  });

  const handleSearchInputChange = async (e) => {
    const val = e.target.value;
    setSearchInput(val);

    if (!val || val.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetchWithTimeout(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&addressdetails=1&limit=5`,
        {
          headers: {
            'Accept': 'application/json',
            'Accept-Language': 'es'
          }
        },
        7000
      );
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
    setSelectedPosition({ lat, lng });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        setUserLocation([latitude, longitude]);
        setSelectedPosition({ lat: latitude, lng: longitude });

        fetchWithTimeout(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          { headers: { 'Accept': 'application/json', 'Accept-Language': 'es' } },
          7000
        )
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
        // si el usuario deniega, seguimos con Madrid y sin romper nada
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  // ✅ Arranque iPhone ultra rápido:
  // 1) Pintar UI al instante
  // 2) Montar mapa en el siguiente frame
  // 3) Pedir geoloc DESPUÉS (no bloquea)
  useEffect(() => {
    let cancelled = false;

    requestAnimationFrame(() => {
      if (!cancelled) setMapReady(true);
    });

    const t = setTimeout(() => {
      if (!cancelled) getCurrentLocation();
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAlerts = useMemo(() => {
    const list = Array.isArray(rawAlertsAll) ? rawAlertsAll : [];
    const [uLat, uLng] = Array.isArray(userLocation) ? userLocation : [MADRID_CENTER[0], MADRID_CENTER[1]];

    return list.filter((a) => {
      if (!a) return false;

      const price = Number(a.price);
      if (Number.isFinite(price) && price > filters.maxPrice) return false;

      const mins = Number(a.available_in_minutes ?? a.availableInMinutes);
      if (Number.isFinite(mins) && mins > filters.maxMinutes) return false;

      const lat = a.latitude ?? a.lat;
      const lng = a.longitude ?? a.lng;

      // solo cerca
      if (lat != null && lng != null) {
        const km = calculateDistance(uLat, uLng, lat, lng);
        if (Number.isFinite(km) && km > filters.maxDistance) return false;
      }
      return true;
    });
  }, [rawAlertsAll, filters, userLocation]);

  // ✅ coches “alrededor” en el mapa de fondo detrás del logo
  const homeMapAlerts = useMemo(() => {
    const [lat, lng] = Array.isArray(userLocation) ? userLocation : MADRID_CENTER;
    const real = Array.isArray(filteredAlerts) ? filteredAlerts : [];
    if (real.length > 0) return real;
    return buildDemoAlerts(lat, lng);
  }, [userLocation, filteredAlerts]);

  const searchAlerts = useMemo(() => {
    if (mode !== 'search') return [];
    const real = Array.isArray(filteredAlerts) ? filteredAlerts : [];
    if (real.length > 0) return real;

    const [lat, lng] = Array.isArray(userLocation) ? userLocation : MADRID_CENTER;
    return buildDemoAlerts(lat, lng);
  }, [mode, filteredAlerts, userLocation]);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertsAll'] });
      queryClient.invalidateQueries({ queryKey: ['myActiveAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
      navigate(createPageUrl('History'));
    },
    onError: (error) => {
      if (error.message === 'ALREADY_HAS_ALERT') {
        alert('Solo puedes tener 1 alerta activa');
      }
    }
  });

  const buyAlertMutation = useMutation({
    mutationFn: async (alert) => {
      if (alert?.is_demo) {
        await new Promise(resolve => setTimeout(resolve, 500));
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
          message: `Solicitud de reserva enviada (${Number(alert.price || 0).toFixed(2)}€).`,
          read: false
        })
      ]);
    },
    onSuccess: (data, alert) => {
      setConfirmDialog({ open: false, alert: null });

      if (alert?.is_demo) {
        const demoConvId = `demo_conv_${alert.id}`;
        navigate(createPageUrl(`Chat?conversationId=${demoConvId}&demo=true&userName=...`));
      } else {
        queryClient.invalidateQueries({ queryKey: ['alertsAll'] });
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
    if (alert?.is_demo) {
      const demoConvId = `demo_conv_${alert.id}`;
      navigate(createPageUrl(`Chat?conversationId=${demoConvId}&demo=true&userName=...`));
      return;
    }

    const otherUserId = alert.user_id || alert.user_email || alert.created_by;

    const conversations = await base44.entities.Conversation.filter({ participant1_id: user?.id });
    const existingConv = conversations.find(c => c.participant2_id === otherUserId) ||
      (await base44.entities.Conversation.filter({ participant2_id: user?.id })).find(c => c.participant1_id === otherUserId);

    if (existingConv) {
      navigate(createPageUrl(`Chat?conversationId=${existingConv.id}`));
      return;
    }

    const newConv = await base44.entities.Conversation.create({
      participant1_id: user.id,
      participant1_name: user.display_name || user.full_name?.split(' ')[0] || 'Tú',
      participant1_photo: user.photo_url,
      participant2_id: otherUserId,
      participant2_name: alert.user_name,
      participant2_photo: alert.user_photo,
      alert_id: alert.id,
      last_message_text: '',
      last_message_at: new Date().toISOString(),
      unread_count_p1: 0,
      unread_count_p2: 0
    });

    navigate(createPageUrl(`Chat?conversationId=${newConv.id}`));
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
          {/* HOME PRINCIPAL */}
          {!mode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 bottom-0 opacity-20 pointer-events-none">
                {/* ✅ mapa seguro iPhone: monta tras primer frame */}
                {mapReady ? (
                  <ParkingMap
                    alerts={homeMapAlerts}
                    userLocation={userLocation}
                    className="absolute inset-0 w-full h-full"
                    zoomControl={false}
                  />
                ) : (
                  <div className="absolute inset-0 bg-black" />
                )}
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

          {/* DÓNDE QUIERES APARCAR */}
          {mode === 'search' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[60px] bottom-[76px] flex flex-col"
              style={{ overflow: 'hidden', height: 'calc(100vh - 136px)' }}
            >
              <div className="h-[44%] relative px-3 pt-1 flex-shrink-0">
                {mapReady ? (
                  <ParkingMap
                    alerts={searchAlerts}
                    onAlertClick={setSelectedAlert}
                    userLocation={userLocation}
                    selectedAlert={selectedAlert}
                    showRoute={!!selectedAlert}
                    zoomControl={true}
                    className="h-full"
                  />
                ) : (
                  <div className="h-full w-full rounded-xl bg-black" />
                )}

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

              <div className="px-4 py-1 flex-shrink-0 z-50 relative">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="text"
                    placeholder="Buscar dirección..."
                    value={searchInput}
                    onChange={handleSearchInputChange}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full bg-gray-900 border border-gray-700 text-white pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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

          {/* ESTOY APARCADO AQUÍ */}
          {mode === 'create' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[60px] bottom-[88px] flex flex-col"
              style={{ overflow: 'hidden', height: 'calc(100vh - 148px)' }}
            >
              <div className="h-[45%] relative px-3 pt-2 flex-shrink-0">
                {mapReady ? (
                  <ParkingMap
                    isSelecting={true}
                    selectedPosition={selectedPosition}
                    setSelectedPosition={(pos) => {
                      setSelectedPosition(pos);
                      fetchWithTimeout(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`,
                        { headers: { 'Accept': 'application/json', 'Accept-Language': 'es' } },
                        7000
                      )
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
                ) : (
                  <div className="h-full w-full rounded-xl bg-black" />
                )}
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