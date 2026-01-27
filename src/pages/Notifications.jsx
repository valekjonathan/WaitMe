import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell, Check, X, Clock, MapPin, Settings, MessageCircle, Phone, Navigation, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import UserCard from '@/components/cards/UserCard';
import { useAuth } from '@/lib/AuthContext';

export default function Notifications() {
  const { user } = useAuth();
  const [selectedNotification, setSelectedNotification] = useState(null);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      // Obtener notificaciones ordenadas por fecha descendente (últimas primero)
      const notifs = await base44.entities.Notification.filter({ recipient_email: user?.email }, '-created_date');
      // Para notificaciones de solicitud o aceptación, adjuntar datos de la alerta relacionada
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
    enabled: !!user?.email
    // Eliminamos refetchInterval para evitar SSE; NotificationManager cubrirá nuevos eventos
  });

  // Mutación para aceptar una solicitud de reserva
  const acceptMutation = useMutation({
    mutationFn: async (notification) => {
      // Actualizar la notificación como aceptada y leída
      await base44.entities.Notification.update(notification.id, {
        status: 'accepted',
        read: true
      });
      // Actualizar la alerta asociada a "reserved"
      const alert = await base44.entities.ParkingAlert.filter({ id: notification.alert_id });
      if (alert[0]) {
        await base44.entities.ParkingAlert.update(alert[0].id, {
          status: 'reserved',
          reserved_by_id: notification.sender_id,
          reserved_by_email: notification.sender_id,
          reserved_by_name: notification.sender_name
        });
      }
      // Crear transacción pendiente (pago) asociada a la reserva
      await base44.entities.Transaction.create({
        alert_id: notification.alert_id,
        seller_id: user?.id,
        seller_name: user?.display_name || user?.full_name?.split(' ')[0] || '',
        buyer_id: notification.sender_id,
        buyer_name: notification.sender_name,
        amount: notification.amount,
        seller_earnings: notification.amount * 0.8,
        platform_fee: notification.amount * 0.2,
        status: 'pending'
      });
      // Notificar al comprador que su reserva fue aceptada (crea notificación para el comprador)
      await base44.entities.Notification.create({
        type: 'reservation_accepted',
        recipient_id: notification.sender_id,
        recipient_email: notification.sender_id,
        sender_id: user?.id,
        sender_name: user?.display_name || user?.full_name?.split(' ')[0] || '',
        sender_photo: user?.photo_url,
        alert_id: notification.alert_id,
        amount: notification.amount,
        status: 'completed'
      });
    },
    onSuccess: () => {
      // Refrescar notificaciones y alertas activas tras aceptar
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['userActiveAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['myActiveAlerts'] });
      setSelectedNotification(null);
    }
  });

  // Mutación para rechazar una solicitud de reserva
  const rejectMutation = useMutation({
    mutationFn: async (notification) => {
      // Actualizar notificación como rechazada y leída
      await base44.entities.Notification.update(notification.id, {
        status: 'rejected',
        read: true
      });
      // Notificar al comprador que fue rechazada su solicitud (notificación para comprador)
      await base44.entities.Notification.create({
        type: 'reservation_rejected',
        recipient_id: notification.sender_id,
        recipient_email: notification.sender_id,
        sender_id: user?.id,
        sender_name: user?.display_name || user?.full_name?.split(' ')[0] || '',
        sender_photo: user?.photo_url,
        alert_id: notification.alert_id,
        amount: notification.amount,
        status: 'completed'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.email] });
      setSelectedNotification(null);
    }
  });

  // Render de la lista de notificaciones
  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Notificaciones" showBackButton={true} backTo="Home" />
      <main className="pt-[60px] pb-24">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Cargando notificaciones...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Bell className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">No hay notificaciones</p>
            <p className="text-sm">Aquí aparecerán las alertas de reserva, confirmaciones y otros avisos.</p>
          </div>
        ) : (
          <div className="px-4 space-y-3">
            {notifications.map((notif, index) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Tarjeta de notificación */}
                <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 border border-gray-700 ${notif.read ? 'opacity-70' : ''}`}>
                  <div className="flex items-start gap-3">
                    {/* Icono según tipo */}
                    <div className="mt-1">
                      {notif.type === 'reservation_request' && <MessageCircle className="w-6 h-6 text-purple-400" />}
                      {notif.type === 'reservation_accepted' && <Check className="w-6 h-6 text-green-400" />}
                      {notif.type === 'reservation_rejected' && <X className="w-6 h-6 text-red-400" />}
                      {notif.type === 'buyer_nearby' && <Navigation className="w-6 h-6 text-blue-400" />}
                      {notif.type === 'payment_completed' && <CreditCard className="w-6 h-6 text-yellow-400" />}
                    </div>
                    {/* Contenido de texto de la notificación */}
                    <div className="flex-1">
                      <p className="text-sm">
                        {notif.type === 'reservation_request' && (
                          <><span className="font-semibold">{notif.sender_name}</span> quiere reservar tu plaza por <span className="font-semibold">{notif.amount}€</span></>
                        )}
                        {notif.type === 'reservation_accepted' && (
                          <><span className="font-semibold">{notif.sender_name}</span> ha aceptado tu solicitud de reserva</>
                        )}
                        {notif.type === 'reservation_rejected' && (
                          <><span className="font-semibold">{notif.sender_name}</span> ha rechazado tu solicitud de reserva</>
                        )}
                        {notif.type === 'buyer_nearby' && (
                          <><span className="font-semibold">{notif.sender_name}</span> está llegando a tu ubicación ¡Prepárate!</>
                        )}
                        {notif.type === 'payment_completed' && (
                          <>Has recibido <span className="font-semibold">{notif.amount}€</span> en tu cuenta</>
                        )}
                        {!['reservation_request', 'reservation_accepted', 'reservation_rejected', 'buyer_nearby', 'payment_completed'].includes(notif.type) && (
                          <>{notif.message}</>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(notif.created_date || notif.created_at), 'PPPpp', { locale: es })}
                      </p>
                    </div>
                    {/* Botones de acción para solicitudes */}
                    {notif.type === 'reservation_request' && notif.status !== 'completed' && (
                      <div className="flex flex-col gap-1 ml-2">
                        <Button size="icon" onClick={() => { setSelectedNotification(notif); /* abrir diálogo confirmar aceptar */ }} className="bg-green-600 hover:bg-green-700 text-white">
                          <Check className="w-5 h-5" />
                        </Button>
                        <Button size="icon" onClick={() => rejectMutation.mutate(notif)} className="bg-red-600 hover:bg-red-700 text-white">
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />

      {/* Dialogo de confirmación para aceptar solicitud */}
      <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Aceptar reserva</DialogTitle>
            <DialogDescription className="text-gray-400">
              Estás a punto de aceptar la solicitud de <span className="text-purple-400 font-bold">{selectedNotification?.sender_name}</span> por <span className="text-purple-400 font-bold">{selectedNotification?.amount}€</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={() => setSelectedNotification(null)} className="flex-1 border-gray-700">
              Cancelar
            </Button>
            <Button
              onClick={() => selectedNotification && acceptMutation.mutate(selectedNotification)}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={acceptMutation.isLoading}
            >
              {acceptMutation.isLoading ? 'Procesando...' : 'Aceptar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}