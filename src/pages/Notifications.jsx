import React, { useEffect, useMemo, useState } from 'react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, MessageCircle, X } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  applyDemoAction,
  getDemoState,
  isDemoMode,
  markDemoNotificationRead,
  subscribeToDemoFlow,
  getDemoAlertById
} from '@/components/DemoFlowManager';

const pad2 = (n) => String(n).padStart(2, '0');
const formatHHMM = (ts) => {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

export default function Notifications() {
  const navigate = useNavigate();
  const demo = isDemoMode();

  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!demo) return;
    const unsub = subscribeToDemoFlow(() => setTick((t) => t + 1));
    return () => unsub?.();
  }, [demo]);

  const demoState = useMemo(() => (demo ? getDemoState() : null), [demo, tick]);

  const { data: realNotifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        return await base44.entities.Notification.list('-created_date', 50);
      } catch {
        return [];
      }
    },
    enabled: !demo,
    staleTime: 1000 * 30
  });

  const notifications = demo ? (demoState?.notifications || []) : realNotifications;

  const unreadCount = useMemo(() => {
    if (!demo) return 0;
    return (notifications || []).filter((n) => !n.read).length;
  }, [notifications, demo]);

  const openChatFromNotification = (n) => {
    const convId = n.conversationId || n.conversation_id;
    const alertId = n.alertId || n.alert_id;

    // En demo, sacamos el "otro" desde la alerta para evitar el bug de nombres cruzados
    let otherName = '';
    let otherPhoto = '';
    if (demo && alertId) {
      const a = getDemoAlertById(alertId);
      if (a) {
        const isBuyer = a.reserved_by_id === 'me';
        otherName = isBuyer ? (a.user_name || '') : (a.reserved_by_name || '');
        otherPhoto = isBuyer ? (a.user_photo || '') : (a.reserved_by_photo || '');
      }
    }

    const params = new URLSearchParams();
    if (demo) params.set('demo', 'true');
    if (convId) params.set('conversationId', convId);
    if (alertId) params.set('alertId', alertId);
    if (otherName) params.set('otherName', otherName);
    if (otherPhoto) params.set('otherPhoto', otherPhoto);

    navigate(createPageUrl(`Chat?${params.toString()}`));
  };

  const onDemoSetStatus = (n, status) => {
    const convId = n.conversationId;
    const alertId = n.alertId;
    applyDemoAction({ conversationId: convId, alertId, action: status });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Notificaciones" showBackButton={true} backTo="Home" unreadCount={unreadCount} />

      <main className="pt-[60px] pb-24">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 text-purple-400">
            <Bell className="w-5 h-5" />
            <p className="font-bold text-sm">Actividad</p>
          </div>
        </div>

        <div className="px-4 space-y-3">
          {(notifications || []).length === 0 ? (
            <div className="bg-gray-900/60 border border-purple-500/30 rounded-xl p-4 text-sm text-gray-300">
              No hay notificaciones.
            </div>
          ) : (
            notifications.map((n) => {
              const id = n.id;
              const title = n.title || n.type || 'Notificación';
              const text = n.text || n.message || '';
              const ts = n.createdAt || n.created_date || Date.now();
              const isRead = !!n.read || !!n.is_read;

              return (
                <div
                  key={id}
                  className={`rounded-xl p-3 border-2 ${
                    isRead ? 'border-purple-500/30 bg-gray-900/40' : 'border-purple-400/70 bg-gray-900/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-purple-400 truncate">{String(title).toUpperCase()}</p>
                      <p className="text-sm text-gray-200 mt-1">{text}</p>
                      <p className="text-xs text-gray-400 mt-2">{formatHHMM(ts)}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="border-purple-500/30 bg-black/40"
                        onClick={() => openChatFromNotification(n)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat
                      </Button>

                      {demo && !isRead && (
                        <Button
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={() => markDemoNotificationRead(id)}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Leído
                        </Button>
                      )}
                    </div>
                  </div>

                  {demo && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Button
                        className="bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30"
                        onClick={() => onDemoSetStatus(n, 'thinking')}
                      >
                        ME LO PIENSO
                      </Button>
                      <Button
                        className="bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30"
                        onClick={() => onDemoSetStatus(n, 'extended')}
                      >
                        PRÓRROGA
                      </Button>
                      <Button
                        className="bg-red-500/20 border border-red-500/30 hover:bg-red-500/30"
                        onClick={() => onDemoSetStatus(n, 'cancelled')}
                      >
                        CANCELAR
                      </Button>
                      <Button
                        className="bg-green-500/20 border border-green-500/30 hover:bg-green-500/30"
                        onClick={() => onDemoSetStatus(n, 'completed')}
                      >
                        COMPLETAR
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
