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

export default function Home() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialMode = urlParams.get('mode');
  
  const [mode, setMode] = useState(initialMode || null); // null, 'search', 'create'
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, alert: null });
  const [user, setUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxPrice: 10,
    maxMinutes: 60,
    maxDistance: 5
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

  // Obtener alertas activas
  const { data: rawAlerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ['parkingAlerts'],
    queryFn: () => base44.entities.ParkingAlert.filter({ status: 'active' }),
    refetchInterval: 5000 // Actualizar cada 5 segundos
  });

  // Filtrar alertas según criterios
  const alerts = rawAlerts.filter(alert => {
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
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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

  // Comprar alerta
  const buyAlertMutation = useMutation({
    mutationFn: async (alert) => {
      // Crear transacción
      await base44.entities.Transaction.create({
        alert_id: alert.id,
        seller_id: alert.user_id,
        seller_name: alert.user_name,
        buyer_id: user?.id,
        buyer_name: user?.full_name,
        amount: alert.price,
        seller_earnings: alert.price * 0.8,
        platform_fee: alert.price * 0.2,
        status: 'completed',
        address: alert.address
      });

      // Actualizar alerta
      await base44.entities.ParkingAlert.update(alert.id, {
        status: 'reserved',
        reserved_by_id: user?.id,
        reserved_by_email: user?.email,
        reserved_by_name: user?.display_name || user?.full_name?.split(' ')[0],
        reserved_by_car: `${user?.car_brand} ${user?.car_model} ${user?.car_color}`,
        reserved_by_plate: user?.car_plate,
        reserved_by_vehicle_type: user?.vehicle_type
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
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then(res => res.json())
            .then(data => {
              if (data.display_name) {
                setAddress(data.display_name.split(',').slice(0, 3).join(', '));
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
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          {mode ? (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setMode(null);
                setSelectedAlert(null);
              }}
              className="text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
          ) : (
            <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-1 flex items-center gap-1 ml-2">
              <span className="text-purple-400 font-bold text-sm">{(user?.credits || 0).toFixed(2)}€</span>
            </div>
          )}
          
          <span className="text-white font-bold text-xl tracking-tight absolute left-1/2 -translate-x-1/2">
            <span className="text-white">Wait</span><span className="text-purple-500">Me!</span>
          </span>
          
          <div className="flex items-center gap-1 mr-7">
            <Link to={createPageUrl('Settings')}>
              <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 w-16 h-16 rounded-xl">
                <Settings className="w-12 h-12" strokeWidth={3} />
              </Button>
            </Link>
            <Link to={createPageUrl('Chats')} className="relative">
              <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 w-16 h-16 rounded-xl">
                <MessageCircle className="w-12 h-12" strokeWidth={3} />
              </Button>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 pb-24">
        <AnimatePresence mode="wait">
          {!mode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-[calc(100vh-140px)] px-6 mt-0"
            >
              <div className="text-center mb-8 w-full flex flex-col items-center">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png" 
                  alt="WaitMe!" 
                  className="w-48 h-48 mb-6 object-contain"
                />
                <h1 className="text-xl font-bold whitespace-nowrap">
                  Aparca donde te <span className="text-purple-500">avisen<span className="text-purple-500">!</span></span>
                </h1>
              </div>

              <div className="w-full max-w-sm mx-auto space-y-4">
                <Button
                  onClick={() => setMode('search')}
                  className="w-full h-20 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-4"
                >
                  <MapPin className="w-12 h-12 text-purple-500" strokeWidth={2.5} />
                  ¿Dónde quieres aparcar?
                </Button>

                <Button
                  onClick={() => setMode('create')}
                  className="w-full h-20 bg-purple-600 hover:bg-purple-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-4"
                >
                  <Car className="w-12 h-12" strokeWidth={2.5} />
                  ¡Estoy aparcado aquí!
                </Button>
              </div>
            </motion.div>
          )}

          {mode === 'search' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[calc(100vh-8rem)]"
            >
              <div className="h-1/2 relative">
                <ParkingMap
                  alerts={alerts}
                  onAlertClick={setSelectedAlert}
                  userLocation={userLocation}
                  selectedAlert={selectedAlert}
                  showRoute={!!selectedAlert}
                  className="h-full"
                />

                {/* Botón de filtros */}
                {!showFilters && (
                  <Button
                    onClick={() => setShowFilters(true)}
                    className="absolute top-4 left-4 z-[1000] bg-black/90 backdrop-blur-sm border border-purple-500/30 text-white hover:bg-purple-600"
                    size="icon"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </Button>
                )}

                {/* Panel de filtros */}
                <AnimatePresence>
                  {showFilters && (
                    <MapFilters
                      filters={filters}
                      onFilterChange={setFilters}
                      onClose={() => setShowFilters(false)}
                      alertsCount={alerts.length}
                    />
                  )}
                </AnimatePresence>
              </div>
              <div className="h-1/2 p-4 overflow-y-auto">
                <UserAlertCard
                  alert={selectedAlert}
                  isEmpty={!selectedAlert}
                  onBuyAlert={handleBuyAlert}
                  onChat={handleChat}
                  onCall={handleCall}
                  isLoading={buyAlertMutation.isPending}
                />
              </div>
            </motion.div>
          )}

          {mode === 'create' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[calc(100vh-8rem)]"
            >
              <div className="h-1/2">
                <ParkingMap
                  isSelecting={true}
                  selectedPosition={selectedPosition}
                  setSelectedPosition={(pos) => {
                    setSelectedPosition(pos);
                    // Obtener dirección
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`)
                      .then(res => res.json())
                      .then(data => {
                        if (data.display_name) {
                          setAddress(data.display_name.split(',').slice(0, 3).join(', '));
                        }
                      });
                  }}
                  userLocation={userLocation}
                  className="h-full"
                />
              </div>
              <div className="h-1/2 p-4 overflow-y-auto">
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t-2 border-gray-700 px-4 py-3 safe-area-pb">
      <div className="flex items-center justify-around max-w-md mx-auto gap-2">
      <Link to={createPageUrl('History')} className="flex-1 flex justify-center">
        <Button variant="ghost" className="flex flex-col items-center gap-1 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 h-auto py-2 px-3 rounded-lg">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] font-bold">Historial</span>
        </Button>
      </Link>

      <div className="flex-1 flex justify-center">
        <Button 
          onClick={() => setMode('search')}
          variant="ghost"
          className="flex flex-col items-center gap-1 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 h-auto py-2 px-3 rounded-lg"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span className="text-[10px] font-bold">Mapa</span>
        </Button>
      </div>

      <Link to={createPageUrl('Profile')} className="flex-1 flex justify-center">
        <Button variant="ghost" className="flex flex-col items-center gap-1 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 h-auto py-2 px-3 rounded-lg">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px] font-bold">Perfil</span>
        </Button>
      </Link>
      </div>
      </nav>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, alert: confirmDialog.alert })}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirmar reserva</DialogTitle>
            <DialogDescription className="text-gray-400">
              Vas a pagar <span className="text-purple-400 font-bold">{confirmDialog.alert?.price}€</span> para que{' '}
              <span className="text-white font-medium">{confirmDialog.alert?.user_name}</span> te espere.
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
              {buyAlertMutation.isPending ? 'Procesando...' : '¡Confirmar!'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}