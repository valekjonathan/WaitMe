import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, X, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState(null);
  const [demoState, setDemoState] = useState({}); // { [id]: { read, status } }
  const queryClient = useQueryClient();

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
      } catch (e) {}
    })();
  }, []);

  const demoNotifications = useMemo(() => {
    const avatar = (n) => `https://i.pravatar.cc/150?img=${n}`;
    const now = Date.now();
    return [
      {
        id: 'demo_notif_1',
        is_demo: true,
        type: 'reservation_request',
        sender_name: 'Laura',
        sender_photo: avatar(47),
        amount: 4,
        created_date: new Date(now - 2 * 60 * 1000).toISOString(),
        read: false,
        status: 'pending',
        meta: { available_in_minutes: 12, address: 'Calle Uría, 20' }
      },
      {
        id: 'demo_notif_2',
        is_demo: true,
        type: 'reservation_request',
        sender_name: 'Carlos',
        sender_photo: avatar(12),
        amount: 3,
        created_date: new Date(now - 12 * 60 * 1000).toISOString(),
        read: false,
        status: 'pending',
        meta: { available_in_minutes: 7, address: 'Plaza de la Escandalera' }
      },
      {
        id: 'demo_notif_3',
        is_demo: true,
        type: 'payment_completed',
        sender_name: 'Marta',
        sender_photo: avatar(32),
        amount: 5,
        created_date: new Date(now - 60 * 60 * 1000).toISOString(),
        read: true,
        status: 'completed'
      }
    ];
  }, []);

  const { data: realNotifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.email],
    enabled: !!user?.email,
    refetchInterval: 6000,
    queryFn: async () => {
      try {
        if (!base44?.entities?.Notification) return [];
        const notifs = await base44.entities.Notification.filter(
          { recipient_email: user?.email },
          '-created_date'
        );
        return Array.isArray(notifs) ? notifs : [];
      } catch (e) {
        return [];
      }
    }
  });

  const notifications = useMemo(() => {
    const hasReal = Array.isArray(realNotifications) && realNotifications.length > 0;
    const base = hasReal ? realNotifications : demoNotifications;

    // aplicar overrides demo (read/status)
    return base.map((n) => {
      if (!String(n.id || '').startsWith('demo_')) return n;
      const o = demoState[n.id] || {};
      return { ...n, read: o.read ?? n.read, status: o.status ?? n.status };
    });
  }, [realNotifications, demoNotifications, demoState]);

  const markAsRead = useMutation({
    mutationFn: async (notif) => {
      const id = notif.id;
      if (String(id).startsWith('demo_')) {
        setDemoState((s) => ({ ...s, [id]: { ...(s[id] || {}), read: true } }));
        return;
      }
      if (!base44?.entities?.Notification) return;
      await base44.entities.Notification.update(id, { read: true });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const accept = useMutation({
    mutationFn: async (notif) => {
      const id = notif.id;
      if (String(id).startsWith('demo_')) {
        setDemoState((s) => ({ ...s, [id]: { ...(s[id] || {}), read: true, status: 'accepted' } }));
        return;
      }
      // Real: marca aceptada (tu lógica real puede ser más compleja; esto no la rompe)
      await base44.entities.Notification.update(id, { read: true, status: 'accepted' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSelected(null);
    }
  });

  const reject = useMutation({
    mutationFn: async (notif) => {
      const id = notif.id;
      if (String(id).startsWith('demo_')) {
        setDemoState((s) => ({ ...s, [id]: { ...(s[id] || {}), read: true, status: 'rejected' } }));
        return;
      }
      await base44.entities.Notification.update(id, { read: true, status: 'rejected' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSelected(null);
    }
  });

  const formatTime = (iso) => {
    try {
      if (!iso) return '';
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    } catch {
      return '';
    }
  };

  const renderText = (n) => {
    if (n.type === 'reservation_request') return 'Quiere un WaitMe!';
    if (n.type === 'payment_completed') return `Pago completado. Has ganado ${(Number(n.amount || 0) * 0.8).toFixed(2)}€`;
    if (n.type === 'reservation_accepted') return 'Aceptó tu WaitMe!';
    if (n.type === 'reservation_rejected') return 'Rechazó tu WaitMe!';
    return 'Nueva notificación';
  };

  const canActions = (n) => n.type === 'reservation_request' && (n.status === 'pending' || !n.status);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Notificaciones" showBackButton={true} backTo="Home" />

      <main className="pt-16 pb-24 px-4">
        <h2 className="text-xl font-bold mb-4 text-center">Notificaciones:</h2>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Bell className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">Sin notificaciones</p>
            <p className="text-sm">Aquí verás solicitudes y pagos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className={`bg-gray-900 rounded-xl p-4 border ${n.read ? 'border-gray-800' : 'border-purple-500'}`}
                onClick={() => {
                  if (!n.read) markAsRead.mutate(n);
                  if (canActions(n)) setSelected(n);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 min-w-0">
                    {n.sender_photo ? (
                      <img
                        src={n.sender_photo}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover border-2 border-purple-500 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gray-800 border-2 border-purple-500 flex items-center justify-center">
                        <Bell className="w-6 h-6 text-gray-500" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="font-semibold text-white text-lg">{(n.sender_name || 'Usuario').split(' ')[0]}</p>
                      <p className="text-sm text-gray-300 mt-0.5">
                        {renderText(n)}
                      </p>

                      {n.type === 'reservation_request' && (
                        <div className="mt-2 text-xs text-purple-400 space-y-1">
                          {n.meta?.available_in_minutes != null && (
                            <p className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Debes esperar: <span className="font-semibold">{n.meta.available_in_minutes} min</span>
                            </p>
                          )}
                          {n.meta?.address && (
                            <p className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {n.meta.address}
                            </p>
                          )}
                          {n.status && n.status !== 'pending' && (
                            <p className="text-gray-400">Estado: <span className="text-white">{n.status}</span></p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 flex-shrink-0 ml-2">{formatTime(n.created_date)}</p>
                </div>

                {canActions(n) && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        accept.mutate(n);
                      }}
                      disabled={accept.isPending}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Aceptar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-red-600 hover:bg-red-700 h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        reject.mutate(n);
                      }}
                      disabled={reject.isPending}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Solicitud de reserva</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selected?.sender_name} quiere pagar <span className="text-purple-400 font-bold">{selected?.amount}€</span>
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
            <p className="text-sm text-gray-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Debes esperar al menos el tiempo indicado
            </p>
            <p className="text-sm text-gray-400 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              No te muevas hasta que llegue
            </p>
            <p className="text-sm text-green-400 font-medium">
              Ganarás: {((Number(selected?.amount || 0)) * 0.8).toFixed(2)}€
            </p>
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => reject.mutate(selected)}
              className="flex-1 border-gray-700"
              disabled={reject.isPending}
            >
              Rechazar
            </Button>
            <Button
              onClick={() => accept.mutate(selected)}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={accept.isPending}
            >
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}