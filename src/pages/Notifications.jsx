import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, XCircle, MapPin, Timer, TrendingUp, AlertCircle, MessageCircle, Navigation } from 'lucide-react';
import MarcoCard from '@/components/cards/MarcoCard';
import {
  startDemoFlow,
  subscribeDemoFlow,
  getDemoNotifications,
  getDemoAlert,
  ensureConversationForAlert,
  ensureInitialWaitMeMessage,
  markDemoNotificationRead,
  applyDemoAction
} from '@/components/DemoFlowManager';

const iconMap = {
  incoming_waitme: <Bell className="w-5 h-5 text-purple-400" />,
  reservation_accepted: <CheckCircle className="w-5 h-5 text-green-400" />,
  reservation_rejected: <XCircle className="w-5 h-5 text-red-400" />,
  buyer_nearby: <MapPin className="w-5 h-5 text-blue-400" />,
  prorroga_request: <Timer className="w-5 h-5 text-orange-400" />,
  payment_completed: <TrendingUp className="w-5 h-5 text-green-400" />,
  time_expired: <AlertCircle className="w-5 h-5 text-red-400" />,
  cancellation: <XCircle className="w-5 h-5 text-gray-400" />,
  status_update: <Bell className="w-5 h-5 text-purple-400" />
};

function normalize(s) {
  return String(s || '').trim().toLowerCase();
}

export default function Notifications() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    startDemoFlow();
    const unsub = subscribeDemoFlow(() => setTick((t) => t + 1));
    return () => unsub?.();
  }, []);

  const notifications = useMemo(() => {
    return getDemoNotifications() || [];
  }, [tick]);

  const openChat = (conversationId, alertId) => {
    if (!conversationId) return;
    navigate(createPageUrl(`Chat?demo=true&conversationId=${encodeURIComponent(conversationId)}&alertId=${encodeURIComponent(alertId || '')}`));
  };

  const openNavigate = (alertId) => {
    if (!alertId) return;
    navigate(createPageUrl(`Navigate?alertId=${encodeURIComponent(alertId)}`));
  };

  const runAction = (n, action) => {
    if (!n) return;

    const alertId = n.alertId || null;
    const conv = ensureConversationForAlert(alertId, { fromName: n.fromName });
    ensureInitialWaitMeMessage(conv?.id);

    applyDemoAction({ conversationId: conv?.id, alertId, action });

    if (n?.id) markDemoNotificationRead(n.id);

    // casi siempre acabas en chat
    openChat(conv?.id, alertId);
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
                onClick={() => notifications.forEach(n => n?.id && markDemoNotificationRead(n.id))}
              >
                Marcar todas como leídas
              </Button>
            )}
          </div>
        </div>

        <div className="px-4 space-y-5 pt-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">No hay notificaciones</p>
            </div>
          ) : (
            notifications.map((n) => {
              const type = n?.type || 'status_update';
              const isUnread = !n?.read;
              const alert = n?.alertId ? getDemoAlert(n.alertId) : null;

              const otherName = alert?.user_name || n?.fromName || 'Usuario';
              const otherPhoto = alert?.user_photo || null;

              const carLabel = `${alert?.car_brand || ''} ${alert?.car_model || ''}`.trim();
              const plate = alert?.car_plate || '';
              const carColor = alert?.car_color || 'gris';
              const address = alert?.address || '';
              const phoneEnabled = !!alert?.allow_phone_calls;
              const phone = alert?.phone || null;

              const statusText = n?.title || 'ACTIVA';
              const hasLatLon = typeof alert?.latitude === 'number' && typeof alert?.longitude === 'number';

              // Botones por tipo (sin inventar UI nueva fuera de lo necesario)
              const t = normalize(type);

              return (
                <div
                  key={n.id}
                  className={`rounded-xl border-2 p-4 transition-all ${
                    isUnread
                      ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-purple-400/70 shadow-lg'
                      : 'bg-gradient-to-br from-gray-900/50 to-gray-900/50 border-gray-700'
                  }`}
                >
                  {/* header de la notificación */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`p-2 rounded-full ${isUnread ? 'bg-purple-500/20' : 'bg-gray-800'}`}>
                      {iconMap[type] || iconMap.status_update}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/50 font-bold text-xs">
                          {n?.title || 'NOTIFICACIÓN'}
                        </Badge>
                        {isUnread && <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />}
                      </div>

                      <p className="text-sm text-white font-medium break-words">
                        {n?.text || '—'}
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        De: <span className="text-purple-300 font-semibold">{otherName}</span>
                      </p>
                    </div>
                  </div>

                  {/* tarjeta EXACTA de Chats */}
                  <MarcoCard
                    photoUrl={otherPhoto}
                    name={otherName}
                    carLabel={carLabel}
                    plate={plate}
                    carColor={carColor}
                    address={address}
                    timeLine={<span className="text-gray-400">Operación en curso</span>}
                    onChat={() => openChat(n?.conversationId || ensureConversationForAlert(n?.alertId)?.id, n?.alertId)}
                    statusText={statusText}
                    phoneEnabled={phoneEnabled}
                    onCall={() => phoneEnabled && phone && (window.location.href = `tel:${phone}`)}
                    dimmed={!isUnread}
                    role="buyer"
                  />

                  {/* botón IR como en Chats (solo si hay coords) */}
                  {hasLatLon && (
                    <div className="mt-2">
                      <Button
                        className="w-full border-2 bg-blue-600 hover:bg-blue-700 border-blue-400/70"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openNavigate(n?.alertId);
                        }}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        IR
                      </Button>
                    </div>
                  )}

                  {/* acciones específicas por tipo */}
                  {t === 'incoming_waitme' && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <Button className="w-full" onClick={() => runAction(n, 'reserved')}>
                        Aceptar
                      </Button>
                      <Button variant="outline" className="w-full border-gray-600" onClick={() => runAction(n, 'thinking')}>
                        Me lo pienso
                      </Button>
                      <Button variant="destructive" className="w-full" onClick={() => runAction(n, 'rejected')}>
                        Rechazar
                      </Button>
                    </div>
                  )}

                  {t === 'prorroga_request' && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button className="w-full" onClick={() => runAction(n, 'extended')}>
                        Aceptar +1€
                      </Button>
                      <Button variant="destructive" className="w-full" onClick={() => runAction(n, 'rejected')}>
                        Rechazar
                      </Button>
                    </div>
                  )}

                  {t === 'reservation_accepted' && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button className="w-full" onClick={() => openChat(n?.conversationId, n?.alertId)}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Ver chat
                      </Button>
                      <Button className="w-full border-2 bg-blue-600 hover:bg-blue-700 border-blue-400/70" onClick={() => openNavigate(n?.alertId)}>
                        <Navigation className="w-4 h-4 mr-2" />
                        IR
                      </Button>
                    </div>
                  )}

                  {t === 'payment_completed' && (
                    <div className="mt-3">
                      <Button className="w-full" onClick={() => openChat(n?.conversationId, n?.alertId)}>
                        Ver detalles en chat
                      </Button>
                    </div>
                  )}

                  {(t === 'reservation_rejected' || t === 'time_expired' || t === 'cancellation') && (
                    <div className="mt-3">
                      <Button variant="outline" className="w-full border-gray-600" onClick={() => openChat(n?.conversationId, n?.alertId)}>
                        Ver qué pasó (chat)
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
