import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell, Check, X, Clock, MapPin, Settings, MessageCircle, Phone, Navigation } from 'lucide-react';
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
        return 'Está cerca. El pago se liberará pronto.';
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

                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 border-2 border-purple-500">
                        <div className="flex gap-3 px-2">
                          {/* Foto a la izquierda */}
                          <div className="w-24 h-28 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0 border-2 border-purple-500">
                            {notif.sender_photo ? (
                              <img src={notif.sender_photo} className="w-full h-full object-cover" alt={notif.sender_name} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl text-gray-500">👤</div>
                            )}
                          </div>

                          {/* Info a la derecha */}
                          <div className="flex-1 flex flex-col justify-between pr-2">
                            {/* Nombre */}
                            <p className="font-bold text-lg text-white">{notif.sender_name.split(' ')[0]}</p>
                            
                            {/* Marca y Modelo con icono */}
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-white">{notif.alert.car_brand} {notif.alert.car_model}</p>
                              {(() => {
                                const carColors = {
                                  'blanco': '#FFFFFF',
                                  'negro': '#1a1a1a',
                                  'rojo': '#ef4444',
                                  'azul': '#3b82f6',
                                  'amarillo': '#facc15',
                                  'gris': '#6b7280'
                                };
                                const color = carColors[notif.alert.car_color] || '#6b7280';
                                return (
                                  <svg viewBox="0 0 48 24" className="w-8 h-5" fill="none">
                                    <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill={color} stroke="white" strokeWidth="1.5" />
                                    <circle cx="14" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
                                    <circle cx="36" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
                                  </svg>
                                );
                              })()}
                            </div>
                            
                            {/* Matrícula */}
                            <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
                              <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
                                <span className="text-[8px] font-bold text-white">E</span>
                              </div>
                              <span className="flex-1 text-center font-mono font-bold text-sm tracking-wider text-black">
                                {(() => {
                                  const plate = notif.alert.car_plate?.replace(/\s/g, '').toUpperCase() || '';
                                  return plate.length >= 4 ? `${plate.slice(0, 4)} ${plate.slice(4)}` : plate;
                                })()}
                              </span>
                            </div>

                            {/* Texto informativo */}
                            <div className="text-xs text-gray-400 leading-tight">
                              <p>Está cerca</p>
                              <p>El pago se liberara pronto</p>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                className="bg-purple-600 hover:bg-purple-700 text-white h-10 flex-1 rounded-xl flex items-center justify-center p-0 border-2 border-purple-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = createPageUrl(`Chat?alertId=${notif.alert_id}&userId=${notif.sender_id}`);
                                }}
                              >
                                <MessageCircle className="w-5 h-5" />
                              </Button>
                              <Button
                                className="bg-green-600 hover:bg-green-700 text-white h-10 flex-1 rounded-xl flex items-center justify-center p-0 border-2 border-green-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (notif.alert.allow_phone_calls && notif.alert.phone) {
                                    window.location.href = `tel:${notif.alert.phone}`;
                                  }
                                }}
                                disabled={!notif.alert.allow_phone_calls || !notif.alert.phone}
                              >
                                <Phone className="w-5 h-5" />
                              </Button>
                            </div>
                            
                            {/* Botón IR debajo */}
                            <Button
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 rounded-xl font-semibold flex items-center justify-center gap-1 mt-2 border-2 border-blue-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (notif.alert.latitude && notif.alert.longitude) {
                                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${notif.alert.latitude},${notif.alert.longitude}`, '_blank');
                                }
                              }}
                            >
                              IR <Navigation className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex gap-3 flex-1 min-w-0">
                          <div className="flex flex-col gap-2">
                            {notif.sender_photo ? (
                              <img src={notif.sender_photo} className="w-24 h-28 rounded-xl object-cover flex-shrink-0 border-2 border-purple-500" alt="" />
                            ) : (
                              <div className="w-24 h-28 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0 border-2 border-purple-500">
                                <Bell className="w-8 h-8 text-gray-500" />
                              </div>
                            )}

                            {notif.type === 'reservation_request' && notif.status === 'pending' && (
                              <div className="flex items-center gap-2">
                                <Button
                                  className="bg-green-600 hover:bg-green-700 text-white h-10 w-10 rounded-xl flex items-center justify-center p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (notif.alert?.allow_phone_calls && notif.alert?.phone) {
                                      window.location.href = `tel:${notif.alert.phone}`;
                                    }
                                  }}
                                  disabled={!notif.alert?.allow_phone_calls || !notif.alert?.phone}
                                >
                                  <Phone className="w-5 h-5" />
                                </Button>
                                <Button
                                  className="bg-white hover:bg-gray-100 text-black h-10 w-10 rounded-xl flex items-center justify-center p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = createPageUrl(`Chat?alertId=${notif.alert_id}&userId=${notif.sender_id}`);
                                  }}
                                >
                                  <MessageCircle className="w-5 h-5" />
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-lg">{notif.sender_name.split(' ')[0]}</p>
                            <p className="text-sm text-gray-300 mt-1">{getNotificationText(notif)}</p>

                            {notif.type === 'reservation_request' && notif.status === 'pending' && (
                              <>
                                {notif.alert && (
                                  <p className="text-xs text-purple-500 mt-2 mb-1 whitespace-nowrap">
                                    Debes esperar hasta las: <span className="font-semibold">{format(new Date(new Date(notif.created_date).getTime() + (notif.alert.available_in_minutes || 0) * 60000), 'HH:mm')}</span>
                                  </p>
                                )}
                                <div className="flex gap-1.5 mt-2">
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 border-2 border-green-500 h-7 px-2 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedNotification(notif);
                                    }}
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Aceptar
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 border-2 border-red-500 h-7 px-2 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      rejectMutation.mutate(notif);
                                    }}
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    Rechazar
                                  </Button>
                                </div>
                              </>
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