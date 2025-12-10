import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell, Check, X, Clock, MapPin, Settings, MessageCircle } from 'lucide-react';
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
      // Para las notificaciones aceptadas, obtener datos de la alerta
      const notifsWithAlerts = await Promise.all(
        notifs.map(async (notif) => {
          if (notif.type === 'reservation_accepted') {
            const alerts = await base44.entities.ParkingAlert.filter({ id: notif.alert_id });
            return { ...notif, alert: alerts[0] };
          }
          return notif;
        })
      );
      return notifsWithAlerts;
    },
    enabled: !!user?.email,
    refetchInterval: 3000
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
        return `Quiere reservar tu alerta!`;
      case 'reservation_accepted':
        return null; // Se mostrará la tarjeta del usuario
      case 'reservation_rejected':
        return `Rechazó tu reserva`;
      case 'buyer_nearby':
        return `Está cerca. El pago se liberará pronto`;
      case 'payment_completed':
        return `Pago completado. Has ganado ${(notif.amount * 0.8).toFixed(2)}€`;
      default:
        return 'Nueva notificación';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="text-white">
                <ArrowLeft className="w-6 h-6" />
              </Button>
            </Link>
            <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-1 flex items-center gap-1">
              <span className="text-purple-400 font-bold text-sm">{(user?.credits || 0).toFixed(2)}€</span>
            </div>
          </div>
          <h1 
            className="text-lg font-semibold cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => window.location.href = createPageUrl('Home')}
          >
            <span className="text-white">Wait</span><span className="text-purple-500">Me!</span>
          </h1>
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
          <h2 className="text-xl font-bold mb-4 text-center">Notificaciones:</h2>

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
                    // Mostrar tarjeta completa del usuario que aceptó
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <p className="font-semibold text-white text-lg">{notif.sender_name.split(' ')[0]} aceptó tu reserva</p>
                        <p className="text-xs text-gray-500">{format(new Date(notif.created_date), 'HH:mm')}</p>
                      </div>
                      <UserCard
                        user={{
                          name: notif.sender_name,
                          photo: notif.sender_photo,
                          car_brand: notif.alert.car_brand,
                          car_model: notif.alert.car_model,
                          car_color: notif.alert.car_color,
                          car_plate: notif.alert.car_plate,
                          vehicle_type: notif.alert.vehicle_type,
                          phone: notif.alert.phone
                        }}
                        location={{
                          address: notif.alert.address,
                          distance: null,
                          eta: notif.alert.available_in_minutes
                        }}
                        price={notif.amount}
                        onChat={() => window.location.href = createPageUrl(`Chat?alertId=${notif.alert_id}&userId=${notif.sender_id}`)}
                        onCall={notif.alert.allow_phone_calls && notif.alert.phone ? () => window.location.href = `tel:${notif.alert.phone}` : null}
                        showActionButtons={true}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex gap-3 flex-1 min-w-0">
                          {notif.sender_photo ? (
                            <img src={notif.sender_photo} className="w-24 h-28 rounded-xl object-cover flex-shrink-0 border-2 border-purple-500" alt="" />
                          ) : (
                            <div className="w-24 h-28 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0 border-2 border-purple-500">
                              <Bell className="w-8 h-8 text-gray-500" />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-lg">{notif.sender_name.split(' ')[0]}</p>
                            <p className="text-sm text-gray-300 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">{getNotificationText(notif)}</p>
                            
                            {notif.type === 'reservation_request' && notif.status === 'pending' && (
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 border-2 border-green-500"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedNotification(notif);
                                  }}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Aceptar
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700 border-2 border-red-500"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    rejectMutation.mutate(notif);
                                  }}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Rechazar
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {format(new Date(notif.created_date), 'HH:mm')}
                        </p>
                      </div>
                    </>
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