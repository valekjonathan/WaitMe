import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, MessageCircle, MapPin, Car, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/Logo';
import ParkingMap from '@/components/map/ParkingMap';
import UserAlertCard from '@/components/cards/UserAlertCard';
import CreateAlertCard from '@/components/cards/CreateAlertCard';

export default function Home() {
  const [mode, setMode] = useState(null); // null, 'search', 'create'
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, alert: null });
  const [user, setUser] = useState(null);
  
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

  // Obtener alertas activas
  const { data: alerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ['parkingAlerts'],
    queryFn: () => base44.entities.ParkingAlert.filter({ status: 'active' }),
  });

  // Crear alerta
  const createAlertMutation = useMutation({
    mutationFn: async (alertData) => {
      const newAlert = await base44.entities.ParkingAlert.create({
        user_id: user?.id,
        user_name: user?.full_name || 'Usuario',
        user_photo: user?.photo_url,
        car_brand: user?.car_brand || 'Sin especificar',
        car_model: user?.car_model || '',
        car_color: user?.car_color || 'gris',
        car_plate: user?.car_plate || '',
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
        reserved_by_name: user?.full_name,
        reserved_by_car: `${user?.car_brand} ${user?.car_model} ${user?.car_color}`,
        reserved_by_plate: user?.car_plate
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
    window.location.href = createPageUrl(`Chat?alertId=${alert.id}&userId=${alert.user_id}`);
  };

  const handleCall = (alert) => {
    if (alert.phone) {
      window.location.href = `tel:${alert.phone}`;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
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
            <div className="w-10" />
          )}
          
          <Logo size="sm" />
          
          <div className="flex items-center gap-2">
            <Link to={createPageUrl('Chats')}>
              <Button variant="ghost" size="icon" className="text-white hover:text-purple-400">
                <MessageCircle className="w-6 h-6" />
              </Button>
            </Link>
            <Link to={createPageUrl('Settings')}>
              <Button variant="ghost" size="icon" className="text-white hover:text-purple-400">
                <Settings className="w-6 h-6" />
              </Button>
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
              className="flex flex-col items-center justify-center min-h-[80vh] px-6 gap-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">
                  Cobra por <span className="text-purple-500">avisar</span>
                </h1>
                <p className="text-gray-400">de que te vas</p>
              </div>

              <Button
                onClick={() => setMode('search')}
                className="w-full max-w-sm h-16 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-3"
              >
                <MapPin className="w-6 h-6 text-purple-500" />
                ¿Dónde quieres aparcar?
              </Button>

              <Button
                onClick={() => setMode('create')}
                className="w-full max-w-sm h-16 bg-purple-600 hover:bg-purple-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-3"
              >
                <Car className="w-6 h-6" />
                ¡Estoy aparcado aquí!
              </Button>
            </motion.div>
          )}

          {mode === 'search' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[calc(100vh-8rem)]"
            >
              <div className="h-1/2">
                <ParkingMap
                  alerts={alerts}
                  onAlertClick={setSelectedAlert}
                  userLocation={userLocation}
                  className="h-full"
                />
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
      <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-gray-800 px-4 py-3">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <Link to={createPageUrl('History')}>
            <Button variant="ghost" className="flex flex-col items-center gap-1 text-gray-400 hover:text-white h-auto py-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs">Historial</span>
            </Button>
          </Link>

          <Button 
            onClick={() => setMode(null)}
            className="w-16 h-16 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/30 -mt-8"
          >
            <MapPin className="w-8 h-8" />
          </Button>

          <Link to={createPageUrl('Profile')}>
            <Button variant="ghost" className="flex flex-col items-center gap-1 text-gray-400 hover:text-white h-auto py-2">
              {user?.photo_url ? (
                <img src={user.photo_url} className="w-6 h-6 rounded-md object-cover" alt="" />
              ) : (
                <div className="w-6 h-6 rounded-md bg-gray-700 flex items-center justify-center">
                  <span className="text-xs">👤</span>
                </div>
              )}
              <span className="text-xs">Perfil</span>
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