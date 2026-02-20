import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, XCircle, MapPin, Timer, TrendingUp, AlertCircle, Navigation } from 'lucide-react';
import MarcoCard from '@/components/cards/MarcoCard';

import {
  startDemoFlow,
  subscribeDemoFlow,
  getDemoAlertById,
  getDemoNotifications,
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
    return getDemoNotifications();
  }, [tick]);

  const openChat = (conversationId, alertId) => {
    if (!conversationId) return;
    navigate(
      createPageUrl(
        `Chat?demo=true&conversationId=${encodeURIComponent(conversationId)}&alertId=${encodeURIComponent(alertId || '')}`
      )
    );
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

    applyDemoAction({
      conversationId: conv?.id,
      alertId,
      action
    });

    if (n?.id) markDemoNotificationRead(n.id);

    openChat(conv?.id, alertId);
  };

  return (
    <div className="min-min-h-[100dvh] bg-black text-white flex flex-col">
      {/* ⬇️ MÁS PEQUEÑO SOLO AQUÍ para que no choque con el botón del dinero */}
      <Header
        title="Notificaciones"
        showBackButton
        backTo="Home"
        titleClassName="text-[20px] leading-[20px]"
      />

      <main className="pt-[60px] pb-24">
        {notifications.length === 0 ? (
          <div className="min-h-[calc(100vh-60px-96px)] flex items-center justify-center px-4">
            <div className="text-center">
              <Bell className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">No hay notificaciones.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 pt-3 pb-2 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-400" />
                  <p className="text-sm text-gray-300">{notifications.filter((n) => !n.read).length} sin leer</p>
                </div>

                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-400 hover:text-purple-300"
                    onClick={() => notifications.forEach((n) => n?.id && markDemoNotificationRead(n.id))}
                  >
                    Marcar todas como leídas
                  </Button>
                )}
              </div>
            </div>

            <div className="px-4 space-y-5 pt-4">
              {notifications.map((n) => {
                const type = n?.type || 'status_update';
                const isUnread = !n?.read;
                const alert = n?.alertId ? getDemoAlertById(n.alertId) : null;

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

                        <p className="text-sm text-white font-medium break-words">{n?.text || '—'}</p>

                        <p className="text-xs text-gray-400 mt-1">
                          De: <span className="text-purple-300 font-semibold">{otherName}</span>
                        </p>
                      </div>
                    </div>

                    {t === 'incoming_waitme' ? (
                      <div className="rounded-xl border-2 border-purple-500/60 bg-gray-900/60 p-3">
                        <div className="mb-2 text-white font-extrabold text-xs tracking-wider">QUIERE UN WAITME</div>
                        <MarcoCard
                      photoUrl={otherPhoto}
                      name={otherName}
                      carLabel={carLabel}
                      plate={plate}
                      carColor={carColor}
                      address={address}
                      timeLine={<span className="text-gray-400">Operación en curso</span>}
                      onChat={() =>
                        openChat(n?.conversationId || ensureConversationForAlert(n?.alertId)?.id, n?.alertId)
                      }
                      statusText={statusText}
                      phoneEnabled={phoneEnabled}
                      onCall={() => phoneEnabled && phone && (window.location.href = `tel:${phone}`)}
                      dimmed={!isUnread}
                      role="buyer"
                    />
                      </div>
                    ) : (
                      <MarcoCard
                      photoUrl={otherPhoto}
                      name={otherName}
                      carLabel={carLabel}
                      plate={plate}
                      carColor={carColor}
                      address={address}
                      timeLine={<span className="text-gray-400">Operación en curso</span>}
                      onChat={() =>
                        openChat(n?.conversationId || ensureConversationForAlert(n?.alertId)?.id, n?.alertId)
                      }
                      statusText={statusText}
                      phoneEnabled={phoneEnabled}
                      onCall={() => phoneEnabled && phone && (window.location.href = `tel:${phone}`)}
                      dimmed={!isUnread}
                      role="buyer"
                    />
                    )}

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

                    {t === 'incoming_waitme' && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <Button onClick={() => runAction(n, 'reserved')}>Aceptar</Button>
                        <Button variant="outline" className="border-gray-600" onClick={() => runAction(n, 'thinking')}>
                          Me lo pienso
                        </Button>
                        <Button variant="destructive" onClick={() => runAction(n, 'rejected')}>
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
