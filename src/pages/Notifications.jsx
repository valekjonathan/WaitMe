import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell, Check, X, Clock, MapPin, Settings, MessageCircle, Phone, Navigation, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import BottomNav from '@/components/BottomNav';
import UserCard from '@/components/cards/UserCard';

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Error:', error);
      }
    };
    fetchUser();
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      const notifs = await base44.entities.Notification.filter({ recipient_email: user?.email }, '-created_date');
      // Para las notificaciones aceptadas y solicitudes, obtener datos de la alerta
      const notifsWithAlerts = await Promise.all(
        notifs.map(async (notif) => {
          if (notif.type === 'reservation_accepted' || notif.type === 'reservation_request') {
            try {
              const alerts = await base44.entities.ParkingAlert.filter({ id: notif.alert_id });
              return { ...notif, alert: alerts[0] || null };
            } catch (error) {
              return { ...notif, alert: null };
            }
          }
          return notif;
        })
      );
      return notifsWithAlerts;
    },
    enabled: !!user?.email,
    refetchInterval: 5000
  });

  const acceptMutation = useMutation({
    mutationFn: async (notification) => {
      // Actualizar notificación
      await base44.entities.Notification.update(notification.id, {
        status: 'accepted',
        read: true
      });

      // Actualizar alerta a "reservada"
      const alert = await base44.entities.ParkingAlert.filter({ id: notification.alert_id });
      if (alert[0]) {
        await base44.entities.ParkingAlert.update(alert[0].id, {
          status: 'reserved',
          reserved_by_id: notification.sender_id,
          reserved_by_email: notification.sender_id,
          reserved_by_name: notification.sender_name
        });
      }

      // Crear transacción pendiente
      await base44.entities.Transaction.create({
        alert_id: notification.alert_id,
        seller_id: user?.id,
        seller_name: user?.display_name || user?.full_name?.split(' ')[0],
        buyer_id: notification.sender_id,
        buyer_name: notification.sender_name,
        amount: notification.amount,
        seller_earnings: notification.amount * 0.8,
        platform_fee: notification.amount * 0.2,
        status: 'pending'
      });

      // Notificar al comprador
      await base44.entities.Notification.create({
        type: 'reservation_accepted',
        recipient_id: notification.sender_id,
        recipient_email: notification.sender_id,
        sender_id: user?.id,
        sender_name: user?.display_name || user?.full_name?.split(' ')[0],
        sender_photo: user?.photo_url,
        alert_id: notification.alert_id,
        amount: notification.amount,
        status: 'completed'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSelectedNotification(null);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (notification) => {
      await base44.entities.Notification.update(notification.id, {
        status: 'rejected',
        read: true
      });

      // Notificar al comprador
      await base44.entities.Notification.create({
        type: 'reservation_rejected',
        recipient_id: notification.sender_id,
        recipient_email: notification.sender_id,
        sender_id: user?.id,
        sender_name: user?.display_name || user?.full_name?.split(' ')[0],
        alert_id: notification.alert_id,
        status: 'completed'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSelectedNotification(null);
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.Notification.update(notificationId, { read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const getNotificationText = (notif) => {
    switch (notif.type) {
      case 'reservation_request':
        return (
          <span>
            Quiere un <span className="text-white">Wait</span><span className="text-purple-500 font-semibold">Me!</span>
          </span>
        );
      case 'reservation_accepted':
        return null; // Se mostrará la tarjeta del usuario
      case 'reservation_rejected':
        return `Rechazó tu reserva.`;
      case 'buyer_nearby':
        return (
          <>
            Está cerca.
            <br />
            El pago se liberara cuando estes a 10 metros.
          </>
        );
      case 'payment_completed':
        return (
          <>
            Pago completado.
            <br />
            <span className="text-green-400">Has ganado {(notif.amount * 0.8).toFixed(2)}€</span>
          </>
        );
      default:
        return 'Nueva notificación';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="text-white">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-1 flex items-center gap-1">
              <span className="text-purple-400 font-bold text-sm">{(user?.credits || 0).toFixed(2)}€</span>
            </div>
            <h1 
              className="text-lg font-semibold cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.location.href = createPageUrl('Home')}
            >
              <span className="text-white">Wait</span><span className="text-purple-500">Me!</span>
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <Link to={createPageUrl('Settings')}>
              <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Link to={createPageUrl('Chats')}>
              <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20">
                <MessageCircle className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-16 pb-24">
        <div className="px-4 py-4">
          <h2 className="text-xl font-bold mb-4 text-center">Avisos:</h2>

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Cargando...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Bell className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg mb-2">Sin notificaciones</p>
              <p className="text-sm">Aquí verás las solicitudes de reserva</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`bg-gray-900 rounded-xl p-4 border ${notif.read ? 'border-gray-800' : 'border-purple-500'}`}
                  onClick={() => {
                    if (!notif.read) markAsReadMutation.mutate(notif.id);
                    if (notif.type === 'reservation_request' && notif.status === 'pending') {
                      setSelectedNotification(notif);
                    }
                  }}
                >
                  {notif.type === 'reservation_accepted' && notif.alert ? (
                    // Mostrar tarjeta del vendedor con sus datos
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <p className="font-semibold text-white text-lg">
                          {notif.sender_name.split(' ')[0]} aceptó tu <span className="text-white">Wait</span><span className="text-purple-500">Me!</span>
                        </p>
                        <p className="text-xs text-gray-500">{format(new Date(notif.created_date), 'HH:mm')}</p>
                      </div>

                      <div className="mb-1.5 h-[220px]">
                        <UserCard
                          userName={notif.sender_name}
                          userPhoto={notif.sender_photo}
                          carBrand={notif.alert.car_brand}
                          carModel={notif.alert.car_model}
                          carColor={notif.alert.car_color}
                          carPlate={notif.alert.car_plate}
                          vehicleType={notif.alert.vehicle_type || 'car'}
                          address={notif.alert.address}
                          availableInMinutes={notif.alert.available_in_minutes}
                          price={notif.alert.price}
                          showLocationInfo={false}
                          showContactButtons={true}
                          onChat={() => window.location.href = createPageUrl(`Chat?alertId=${notif.alert_id}&userId=${notif.sender_id}`)}
                          onCall={() => notif.alert.allow_phone_calls && notif.alert.phone && (window.location.href = `tel:${notif.alert.phone}`)}
                          allowPhoneCalls={notif.alert.allow_phone_calls}
                          latitude={notif.alert.latitude}
                          longitude={notif.alert.longitude}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mb-1.5 h-[220px]">
                      <UserCard
                        userName={notif.sender_name}
                        userPhoto={notif.sender_photo}
                        carBrand={notif.alert?.car_brand || 'Sin'}
                        carModel={notif.alert?.car_model || 'datos'}
                        carColor={notif.alert?.car_color || 'gris'}
                        carPlate={notif.alert?.car_plate || ''}
                        vehicleType={notif.alert?.vehicle_type || 'car'}
                        address={notif.alert?.address}
                        availableInMinutes={notif.alert?.available_in_minutes}
                        price={notif.alert?.price}
                        showLocationInfo={notif.type === 'reservation_request' && notif.status === 'pending'}
                        latitude={notif.alert?.latitude}
                        longitude={notif.alert?.longitude}
                        userLocation={null}
                        allowPhoneCalls={notif.alert?.allow_phone_calls}
                        muted={notif.type !== 'reservation_request' || notif.status !== 'pending'}
                        actionButtons={notif.type === 'reservation_request' && notif.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-8 w-[42px]"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = createPageUrl(`Chat?alertId=${notif.alert_id}&userId=${notif.sender_id}`);
                              }}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className={`border-gray-700 h-8 w-[42px] ${notif.alert?.allow_phone_calls ? 'hover:bg-gray-800' : 'opacity-40 cursor-not-allowed'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                notif.alert?.phone && notif.alert?.allow_phone_calls && (window.location.href = `tel:${notif.alert.phone}`);
                              }}
                              disabled={!notif.alert?.allow_phone_calls}
                            >
                              {notif.alert?.allow_phone_calls ? (
                                <Phone className="w-4 h-4 text-green-400" />
                              ) : (
                                <PhoneOff className="w-4 h-4 text-gray-600" />
                              )}
                            </Button>
                            <Button
                              className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg h-8 px-4 flex items-center justify-center gap-2 text-xs font-semibold flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNotification(notif);
                              }}
                            >
                              WaitMe!
                            </Button>
                          </div>
                        ) : null}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />

      {/* Dialog de confirmación */}
      <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Solicitud de reserva</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedNotification?.sender_name} quiere pagar <span className="text-purple-400 font-bold">{selectedNotification?.amount}€</span> por tu plaza
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
            <p className="text-sm text-gray-400">
              <Clock className="inline w-4 h-4 mr-1" />
              Debes esperar al menos el tiempo indicado en tu alerta
            </p>
            <p className="text-sm text-gray-400">
              <MapPin className="inline w-4 h-4 mr-1" />
              No te muevas de la ubicación hasta que llegue
            </p>
            <p className="text-sm text-green-400 font-medium">
              Ganarás: {((selectedNotification?.amount || 0) * 0.8).toFixed(2)}€
            </p>
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                rejectMutation.mutate(selectedNotification);
              }}
              className="flex-1 border-gray-700"
              disabled={rejectMutation.isPending}
            >
              Rechazar
            </Button>
            <Button
              onClick={() => {
                acceptMutation.mutate(selectedNotification);
              }}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending ? 'Aceptando...' : 'Aceptar y esperar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}