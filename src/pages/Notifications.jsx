import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell, Check, X, Clock, MapPin, Settings, MessageCircle, Phone, Navigation, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import UserCard from '@/components/cards/UserCard';
import { useAuth } from '@/lib/AuthContext';

export default function Notifications() {

  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ instantáneo sin auth.me()
  const [selectedNotification, setSelectedNotification] = useState(null);
  const queryClient = useQueryClient();

  // ---------------- DEMO ----------------

  const demoNotifications = useMemo(() => [
    {
      id: 'demo_notif_1',
      type: 'reservation_request',
      sender_id: 'demo_user_sofia',
      sender_name: 'Sofía',
      sender_photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
      recipient_id: user?.id,
      alert_id: 'demo_alert_req_1',
      amount: 5.0,
      status: 'pending',
      read: false,
      created_date: new Date().toISOString(),
      alert: {
        id: 'demo_alert_req_1',
        car_brand: 'Seat',
        car_model: 'Ibiza',
        car_color: 'azul',
        car_plate: '1234ABC',
        available_in_minutes: 8,
        allow_phone_calls: true,
        phone: '+34612345678',
        address: 'Calle Uría'
      }
    }
  ], [user?.id]);

  // ---------------- QUERY REAL ----------------

  const { data: realNotifications = [] } = useQuery({

    queryKey: ['notifications', user?.id],

    queryFn: async () => {

      const notifs = await base44.entities.Notification.filter(
        { recipient_id: user?.id },
        '-created_date'
      );

      const alertIds = [...new Set(notifs.map(n => n.alert_id).filter(Boolean))];

      const alerts = alertIds.length
        ? await base44.entities.ParkingAlert.filter({ id: { $in: alertIds } })
        : [];

      const alertsMap = new Map(alerts.map(a => [a.id, a]));

      return notifs.map(n => ({
        ...n,
        alert: alertsMap.get(n.alert_id) || null
      }));

    },

    enabled: !!user?.id,

    // 🔥 CLAVE → muestra datos instantáneo
    placeholderData: (prev) => prev ?? [],

    staleTime: 30000,
    cacheTime: 300000
  });

  const notifications = realNotifications.length
    ? realNotifications
    : demoNotifications;

  // ---------------- MUTATIONS ----------------

  const acceptMutation = useMutation({

    mutationFn: async (notification) => {

      return Promise.all([

        base44.entities.Notification.update(notification.id, {
          status: 'accepted',
          read: true
        }),

        base44.entities.ParkingAlert.update(notification.alert_id, {
          status: 'reserved',
          reserved_by_id: notification.sender_id,
          reserved_by_name: notification.sender_name
        }),

        base44.entities.Transaction.create({
          alert_id: notification.alert_id,
          seller_id: user?.id,
          seller_name: user?.display_name,
          buyer_id: notification.sender_id,
          buyer_name: notification.sender_name,
          amount: notification.amount,
          seller_earnings: notification.amount * 0.67,
          platform_fee: notification.amount * 0.33,
          status: 'pending'
        })
      ]);

    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSelectedNotification(null);
    }

  });

  const rejectMutation = useMutation({

    mutationFn: async (notification) => {

      return base44.entities.Notification.update(notification.id, {
        status: 'rejected',
        read: true
      });

    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSelectedNotification(null);
    }

  });

  // ---------------- UI ----------------

  return (

    <div className="min-h-screen bg-black text-white">

      <Header title="Notificaciones" showBackButton backTo="Home" />

      <main className="pt-16 pb-24 px-4">

        <h2 className="text-xl font-bold text-center mb-4">
          Notificaciones
        </h2>

        {notifications.length === 0 ? (

          <div className="text-center text-gray-500 py-20">
            <Bell className="w-16 h-16 mx-auto mb-3 opacity-30"/>
            Sin notificaciones
          </div>

        ) : (

          <div className="space-y-3">

            {notifications.map((notif) => (

              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-900 p-4 rounded-xl border border-purple-500"
                onClick={() => {
                  if (notif.type === 'reservation_request') {
                    setSelectedNotification(notif);
                  }
                }}
              >

                <div className="flex items-center gap-3">

                  {notif.sender_photo
                    ? <img src={notif.sender_photo} className="w-12 h-12 rounded-full"/>
                    : <User/>}

                  <div className="flex-1">
                    <p className="font-semibold">
                      {notif.sender_name}
                    </p>

                    <p className="text-sm text-gray-300">
                      Quiere tu plaza
                    </p>
                  </div>

                </div>

              </motion.div>

            ))}

          </div>

        )}

      </main>

      <BottomNav/>

      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>

        <DialogContent className="bg-gray-900 text-white">

          <DialogHeader>
            <DialogTitle>Confirmar reserva</DialogTitle>
          </DialogHeader>

          <DialogFooter className="flex gap-3">

            <Button
              variant="outline"
              onClick={() => rejectMutation.mutate(selectedNotification)}
            >
              Rechazar
            </Button>

            <Button
              className="bg-green-600"
              onClick={() => acceptMutation.mutate(selectedNotification)}
            >
              Aceptar
            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>

  );
}