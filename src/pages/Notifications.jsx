import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, X, Clock, MessageCircle } from 'lucide-react';

import {
  isDemoMode,
  startDemoFlow,
  subscribeDemoFlow,
  getDemoNotifications,
  markDemoNotificationRead,
  applyDemoAction,
  ensureConversationForAlert,
  ensureInitialWaitMeMessage
} from '@/components/DemoFlowManager';

export default function Notifications() {
  const navigate = useNavigate();

  const demoEnabled = isDemoMode();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!demoEnabled) return;
    startDemoFlow();
    const unsub = subscribeDemoFlow(() => setTick((t) => t + 1));
    return () => unsub?.();
  }, [demoEnabled]);

  const notifications = useMemo(() => {
    if (!demoEnabled) return [];
    return getDemoNotifications() || [];
  }, [demoEnabled, tick]);

  const openChat = (conversationId, otherName, otherPhoto, alertId) => {
    const name = encodeURIComponent(otherName || '');
    const photo = encodeURIComponent(otherPhoto || '');
    const a = alertId ? `&alertId=${encodeURIComponent(alertId)}` : '';
    navigate(createPageUrl(`Chat?demo=true&conversationId=${encodeURIComponent(conversationId)}${a}&otherName=${name}&otherPhoto=${photo}`));
  };

  const onAction = ({ notification, action }) => {
    // 1) asegurar conversación
    const conv = ensureConversationForAlert(notification?.alertId, notification);

    // 2) si viene de "incoming_waitme", aseguramos mensaje inicial
    ensureInitialWaitMeMessage(conv?.id);

    // 3) aplicar acción sincronizada
    applyDemoAction({
      conversationId: conv?.id,
      alertId: notification?.alertId,
      action
    });

    // 4) marcar leída
    if (notification?.id) markDemoNotificationRead(notification.id);

    // 5) abrir chat directo para ver el flujo
    openChat(conv?.id, conv?.other_name, conv?.other_photo, notification?.alertId);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Notificaciones" showBackButton={true} backTo="Home" />

      <main className="pt-[60px] pb-24">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-400" />
              <p className="text-sm text-gray-300">Modo demo: todo se sincroniza con Chats y Chat</p>
            </div>
          </div>
        </div>

        <div className="px-4 space-y-3 pt-1">
          {notifications.length === 0 ? (
            <div className="text-gray-400 text-sm bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              No hay notificaciones.
            </div>
          ) : (
            notifications.map((n) => {
              const isIncoming = n?.type === 'incoming_waitme';
              const isUnread = !n?.read;
              const badgeCls = isUnread
                ? 'bg-purple-500/20 text-purple-300 border-purple-400/50'
                : 'bg-gray-700/30 text-gray-300 border-gray-600/30';

              return (
                <div
                  key={n.id}
                  className={`rounded-xl border-2 p-3 bg-gradient-to-br ${
                    isUnread ? 'from-gray-800 to-gray-900 border-purple-400/70' : 'from-gray-900/50 to-gray-900/50 border-purple-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className={badgeCls}>{n.title || 'NOTIFICACIÓN'}</Badge>
                        {isIncoming && <span className="text-xs text-purple-300 font-bold">WAITME</span>}
                      </div>
                      <p className="text-sm text-gray-200 font-semibold mt-2 break-words">{n.text || '—'}</p>
                      {n.fromName && (
                        <p className="text-xs text-gray-400 mt-1">
                          De: <span className="text-gray-300 font-semibold">{n.fromName}</span>
                        </p>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      className="border-gray-700"
                      onClick={() => {
                        if (n?.id) markDemoNotificationRead(n.id);
                        if (n?.conversationId) {
                          openChat(n.conversationId, n.otherName, n.otherPhoto, n.alertId);
                        }
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </Button>
                  </div>

                  {isIncoming ? (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => onAction({ notification: n, action: 'reserved' })}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Aceptar
                      </Button>
                      <Button
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => onAction({ notification: n, action: 'thinking' })}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Me lo pienso
                      </Button>
                      <Button
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => onAction({ notification: n, action: 'cancelled' })}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Rechazar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end mt-3">
                      <Button
                        variant="outline"
                        className="border-gray-700"
                        onClick={() => {
                          if (n?.id) markDemoNotificationRead(n.id);
                        }}
                      >
                        Marcar como leída
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
