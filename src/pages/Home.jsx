import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, MessageCircle, MapPin, Car, X, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/Logo';
import ParkingMap from '@/components/map/ParkingMap';
import UserAlertCard from '@/components/cards/UserAlertCard';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import MapFilters from '@/components/map/MapFilters';
import BottomNav from '@/components/BottomNav';
import NotificationManager from '@/components/NotificationManager';

export default function Home() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialMode = urlParams.get('mode');

  const [mode, setMode] = useState(initialMode || null); // null, 'search', 'create'

  // Resetear mode cuando se navega a Home sin parámetros
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

  // Obtener mensajes no leídos
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadMessages', user?.email],
    queryFn: async () => {
      const messages = await base44.entities.ChatMessage.filter({ receiver_id: user?.email, read: false });
      return messages.length;
    },
    enabled: !!user?.email,
    refetchInterval: 5000
  });

  // Obtener alertas activas solo cuando estamos en modo search
  const { data: rawAlerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ['parkingAlerts'],
    queryFn: () => base44.entities.ParkingAlert.filter({ status: 'active' }),
    refetchInterval: mode === 'search' ? 5000 : false,
    enabled: mode === 'search'
  });

  // Filtrar alertas según criterios
  const alerts = rawAlerts.filter((alert) => {
    // Filtro de precio
    if (alert.price > filters.maxPrice) return false;

    // Filtro de disponibilidad
    if (alert.available_in_minutes > filters.maxMinutes) return false;

    // Filtro de distancia
    if (userLocation) {
      const distance = calculateDistance(
        userLocation[0], userLocation[1],
        alert.latitude, alert.longitude
      );
      if (distance > filters.maxDistance) return false;
    }

    return true;
  });

  // Calcular distancia en km
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

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
      queryClient.invalidateQueries({ queryKey: ['parkingAlerts'] });
      setMode(null);
      setSelectedPosition(null);
      setAddress('');
    }
  });

  // Comprar alerta - ahora crea notificación
  const buyAlertMutation = useMutation({
    mutationFn: async (alert) => {
      // Crear notificación para el vendedor
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

  // Obtener ubicación actual
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setSelectedPosition({ lat: latitude, lng: longitude });
          // Obtener dirección aproximada
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`).
          then((res) => res.json()).
          then((data) => {
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
      // Dar tiempo para que el mapa se renderice
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
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-700">
        <div className="relative flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {mode &&
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setMode(null);
                setSelectedAlert(null);
              }}
              className="text-white">
                <ArrowLeft className="w-6 h-6" />
              </Button>
            }
            <Link to={createPageUrl('Settings')}>
              <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-1.5 flex items-center gap-1 hover:bg-purple-600/30 transition-colors cursor-pointer">
                <span className="text-purple-400 font-bold text-sm">{(user?.credits || 0).toFixed(2)}€</span>
              </div>
            </Link>
          </div>

          <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-semibold">
            <span className="text-white">Wait</span><span className="text-purple-500">Me!</span>
          </h1>

          <div className="flex items-center gap-1 ml-auto">
            <Link to={createPageUrl('Settings')}>
              <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Link to={createPageUrl('Chats')} className="relative">
              <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20">
                <MessageCircle className="w-5 h-5" />
                {unreadCount > 0 &&
                <span className="absolute -top-1 right-[-32px] bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                }
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="fixed inset-0 top-[60px] bottom-[88px]">
        <AnimatePresence mode="wait">
          {!mode &&
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }} className="absolute inset-0 w-full h-full z-0">



              {/* Mapa de fondo apagado */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <ParkingMap
                alerts={alerts}
                userLocation={userLocation}
                className="h-full"
                zoomControl={false} />
              </div>

              {/* Overlay morado apagado */}
              <div className="absolute inset-0 bg-purple-900/40 pointer-events-none"></div>

              <div className="text-center mb-4 w-full flex flex-col items-center relative z-10">
                <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png"
                alt="WaitMe!"
                className="w-48 h-48 mb-0 object-contain" />

                <h1 className="text-xl font-bold whitespace-nowrap -mt-3">
                  Aparca donde te <span className="text-purple-500">avisen<span className="text-purple-500">!</span></span>
                </h1>
              </div>

              <div className="w-full max-w-sm mx-auto space-y-4 relative z-10">
                <Button
                onClick={() => setMode('search')}
                className="w-full h-20 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-4">

                  <svg className="w-28 h-28 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  ¿ Dónde quieres aparcar ?
                </Button>

                <Button
                onClick={() => setMode('create')}
                className="w-full h-20 bg-purple-600 hover:bg-purple-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-4">

                  <Car className="w-14 h-14" strokeWidth={2.5} />
                  ¡ Estoy aparcado aquí !
                </Button>
              </div>
              </motion.div>
          }

          {mode === 'search' &&
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-[60px] bottom-[88px] flex flex-col"
            style={{ overflow: 'hidden', height: 'calc(100vh - 148px)' }}>

              <div className="h-[42%] relative px-3 pt-1 flex-shrink-0">
                <ParkingMap
                alerts={alerts}
                onAlertClick={setSelectedAlert}
                userLocation={userLocation}
                selectedAlert={selectedAlert}
                showRoute={!!selectedAlert}
                zoomControl={true}
                className="h-full" />


                {/* Botón de filtros */}
                {!showFilters &&
              <Button
                onClick={() => setShowFilters(true)}
                className="absolute top-5 right-7 z-[1000] bg-black/60 backdrop-blur-sm border border-purple-500/30 text-white hover:bg-purple-600"
                size="icon">

                    <SlidersHorizontal className="w-5 h-5" />
                  </Button>
              }

                {/* Panel de filtros */}
                <AnimatePresence>
                  {showFilters &&
                <MapFilters
                  filters={filters}
                  onFilterChange={setFilters}
                  onClose={() => setShowFilters(false)}
                  alertsCount={alerts.length} />

                }
                </AnimatePresence>
              </div>
              
              {/* Buscador de direcciones */}
              <div className="px-4 py-2">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                  type="text"
                  placeholder="Buscar dirección..."
                  className="w-full bg-gray-900 border border-gray-700 text-white pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />

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
                userLocation={userLocation} />

              </div>
            </motion.div>
          }

          {mode === 'create' &&
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen pt-4">

                <div className="h-[35%] relative px-3">
                  <ParkingMap
                isSelecting={true}
                selectedPosition={selectedPosition}
                setSelectedPosition={(pos) => {
                  setSelectedPosition(pos);
                  // Obtener dirección
                  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`).
                  then((res) => res.json()).
                  then((data) => {
                    if (data.address) {
                      const road = data.address.road || data.address.street || '';
                      const number = data.address.house_number || '';
                      setAddress(number ? `${road}, ${number}` : road);
                    }
                  });
                }}
                userLocation={userLocation}
                zoomControl={true}
                className="h-full" />

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
                isLoading={createAlertMutation.isPending} />

                </div>
              </motion.div>
          }
        </AnimatePresence>
      </main>

      <BottomNav />

      {/* Confirm Dialog */}
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
              className="flex-1 border-gray-700">

              Cancelar
            </Button>
            <Button
              onClick={() => buyAlertMutation.mutate(confirmDialog.alert)}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={buyAlertMutation.isPending}>

              {buyAlertMutation.isPending ? 'Enviando...' : 'Enviar solicitud'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);

}