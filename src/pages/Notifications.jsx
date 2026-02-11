import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Check, 
  X, 
  Clock, 
  MessageCircle, 
  Navigation,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  MapPin,
  TrendingUp,
  Car
} from 'lucide-react';

import {
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

  // 🔥 FORZAMOS DEMO SIEMPRE ACTIVA
  const [tick, setTick] = useState(0);

  useEffect(() => {
    startDemoFlow();
    const unsub = subscribeDemoFlow(() => setTick((t) => t + 1));
    return () => unsub?.();
  }, []);

  const notifications = useMemo(() => {
    return getDemoNotifications() || [];
  }, [tick]);

  const openChat = (conversationId, otherName, otherPhoto, alertId) => {
    const name = encodeURIComponent(otherName || '');
    const photo = encodeURIComponent(otherPhoto || '');
    const a = alertId ? `&alertId=${encodeURIComponent(alertId)}` : '';
    navigate(createPageUrl(`Chat?demo=true&conversationId=${encodeURIComponent(conversationId)}${a}&otherName=${name}&otherPhoto=${photo}`));
  };

  const onAction = ({ notification, action }) => {
    const conv = ensureConversationForAlert(notification?.alertId, notification);
    ensureInitialWaitMeMessage(conv?.id);

    applyDemoAction({
      conversationId: conv?.id,
      alertId: notification?.alertId,
      action
    });

    if (notification?.id) markDemoNotificationRead(notification.id);

    openChat(conv?.id, conv?.other_name, conv?.other_photo, notification?.alertId);
  };

  const goToNavigate = (alertId) => {
    navigate(createPageUrl(`Navigate?alertId=${alertId}`));
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'incoming_waitme': return <Car className="w-5 h-5" />;
      case 'reservation_accepted': return <CheckCircle className="w-5 h-5" />;
      case 'reservation_rejected': return <XCircle className="w-5 h-5" />;
      case 'status_update': return <Clock className="w-5 h-5" />;
      case 'buyer_nearby': return <MapPin className="w-5 h-5" />;
      case 'prorroga_request': return <Timer className="w-5 h-5" />;
      case 'payment_completed': return <TrendingUp className="w-5 h-5" />;
      case 'time_expired': return <AlertCircle className="w-5 h-5" />;
      case 'cancellation': return <XCircle className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'incoming_waitme': return 'text-purple-400';
      case 'reservation_accepted': return 'text-green-400';
      case 'reservation_rejected': return 'text-red-400';
      case 'status_update': return 'text-yellow-400';
      case 'buyer_nearby': return 'text-blue-400';
      case 'prorroga_request': return 'text-orange-400';
      case 'payment_completed': return 'text-green-400';
      case 'time_expired': return 'text-red-400';
      case 'cancellation': return 'text-gray-400';
      default: return 'text-purple-400';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Notificaciones" showBackButton={true} backTo="Home" />

      <main className="pt-[60px] pb-24">

        <div className="px-4 pt-3 pb-2 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-400" />
              <p className="text-sm text-gray-300">
                {notifications.filter(n => !n.read).length} sin leer
              </p>
            </div>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-purple-400 hover:text-purple-300"
                onClick={() => {
                  notifications.forEach(n => {
                    if (n?.id) markDemoNotificationRead(n.id);
                  });
                }}
              >
                Marcar todas como leídas
              </Button>
            )}
          </div>
        </div>

        <div className="px-4 space-y-3 pt-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">No hay notificaciones</p>
            </div>
          ) : (
            notifications.map((n) => {
              const isUnread = !n?.read;
              const type = n?.type || 'status_update';

              return (
                <div
                  key={n.id}
                  className={`rounded-xl border-2 p-4 transition-all ${
                    isUnread 
                      ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-purple-400/70 shadow-lg' 
                      : 'bg-gradient-to-br from-gray-900/50 to-gray-900/50 border-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${isUnread ? 'bg-purple-500/20' : 'bg-gray-800'}`}>
                      <div className={getNotificationColor(type)}>
                        {getNotificationIcon(type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/50 font-bold text-xs">
                          {n.title || 'NOTIFICACIÓN'}
                        </Badge>
                        {isUnread && (
                          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                        )}
                      </div>

                      <p className="text-sm text-white font-medium break-words">
                        {n.text || '—'}
                      </p>

                      {n.fromName && (
                        <p className="text-xs text-gray-400 mt-1">
                          De: <span className="text-purple-300 font-semibold">{n.fromName}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-gray-600"
                      onClick={() => {
                        if (n?.id) markDemoNotificationRead(n.id);
                        if (n?.conversationId) {
                          openChat(n.conversationId, n.otherName, n.otherPhoto, n.alertId);
                        }
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Ver chat
                    </Button>
                  </div>
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