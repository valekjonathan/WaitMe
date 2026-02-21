import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getWaitMeRequests, setWaitMeRequestStatus } from '@/lib/waitmeRequests';
import {
  Bell,
  CheckCircle,
  XCircle,
  MapPin,
  Timer,
  TrendingUp,
  AlertCircle,
  Navigation
} from 'lucide-react';
import MarcoCard from '@/components/cards/MarcoCard';

import {
  startDemoFlow,
  subscribeDemoFlow,
  getDemoAlertById,
  getDemoNotifications,
  ensureConversationForAlert,
  ensureInitialWaitMeMessage,
  markDemoNotificationRead,
  markAllDemoRead,
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
  const queryClient = useQueryClient();
  const [tick, setTick] = useState(0);

  // Solicitudes reales (localStorage) tipo “Usuario quiere tu WaitMe!”
  const [requestsTick, setRequestsTick] = useState(0);
  const [requests, setRequests] = useState([]);
  const [alertsById, setAlertsById] = useState({});

  useEffect(() => {
    startDemoFlow();
    const unsub = subscribeDemoFlow(() => setTick((t) => t + 1));
    return () => unsub?.();
  }, []);

  useEffect(() => {
    const load = () => {
      const list = getWaitMeRequests() || [];
      setRequests(Array.isArray(list) ? list : []);
      setRequestsTick((t) => t + 1);
    };

    load();
    const onChange = () => load();
    window.addEventListener('waitme:requestsChanged', onChange);
    return () => window.removeEventListener('waitme:requestsChanged', onChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const ids = (requests || [])
        .map((r) => r?.alertId)
        .filter(Boolean)
        .filter((id) => !alertsById?.[id]);

      if (!ids.length) return;

      try {
        const pairs = await Promise.all(
          ids.map(async (id) => {
            try {
              const a = await base44.entities.ParkingAlert.get(id);
              return [id, a];
            } catch {
              return [id, null];
            }
          })
        );

        if (cancelled) return;
        setAlertsById((prev) => {
          const next = { ...(prev || {}) };
          pairs.forEach(([id, a]) => {
            if (a) next[id] = a;
          });
          return next;
        });
      } catch {
        // noop
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestsTick]);

  const acceptRequest = async (req) => {
    try {
      const alertId = req?.alertId;
      if (!alertId) return;

      const buyer = req?.buyer || {};

      await base44.entities.ParkingAlert.update(alertId, {
        status: 'reserved',
        reserved_by_id: buyer?.id || 'buyer',
        reserved_by_email: null,
        reserved_by_name: buyer?.name || 'Usuario',
        reserved_by_photo: buyer?.photo || null,
        reserved_by_car: String(buyer?.car_model || '').trim(),
        reserved_by_car_color: buyer?.car_color || 'gris',
        reserved_by_plate: buyer?.plate || '',
        reserved_by_vehicle_type: buyer?.vehicle_type || 'car'
      });

      setWaitMeRequestStatus(req?.id, 'accepted');

      await queryClient.invalidateQueries({ queryKey: ['alerts'] });
      await queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
      try { window.dispatchEvent(new Event('waitme:badgeRefresh')); } catch {}
      navigate(createPageUrl('History'));
    } catch {
      // noop
    }
  };

  const rejectRequest = (req) => {
    try {
      setWaitMeRequestStatus(req?.id, 'rejected');
    } catch {
      // noop
    }
  };

  const notifications = useMemo(() => {
    const list = getDemoNotifications?.() || [];
    // Más nuevas arriba
    return [...list].sort((a, b) => (b?.t || 0) - (a?.t || 0));
  }, [tick]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n?.read).length,
    [notifications]
  );

  const openChat = (conversationId, alertId) => {
    if (!conversationId) return;
    navigate(
      createPageUrl(
        `Chat?demo=true&conversationId=${encodeURIComponent(
          conversationId
        )}&alertId=${encodeURIComponent(alertId || '')}`
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
    <div className="min-h-[100dvh] bg-black text-white flex flex-col">
      <Header
        title="Notificaciones"
        showBackButton
        backTo="Home"
        titleClassName="text-[20px] leading-[20px]"
      />

      <main className="pt-20 pb-24">
        {/* Solicitudes entrantes (reales) */}
        {requests.filter((r) => r?.type === 'incoming_waitme_request').length > 0 && (
          <div className="px-4 pt-4 space-y-4">
            {requests
              .filter((r) => r?.type === 'incoming_waitme_request')
              .map((r) => {
                const buyer = r?.buyer || {};
                const alert = r?.alertId ? alertsById?.[r.alertId] : null;

                const status = String(r?.status || 'pending');
                const statusText =
                  status === 'rejected' ? 'RECHAZADA' : status === 'accepted' ? 'ACEPTADA' : 'PENDIENTE';

                const carLabel = String(buyer?.car_model || 'Sin datos').trim();
                const plate = buyer?.plate || '';
                const carColor = buyer?.car_color || 'gris';

                const address = alert?.address || '';
                const mins = alert?.available_in_minutes;
                const price = alert?.price;

                return (
                  <div
                    key={r?.id}
                    className="rounded-xl border-2 border-gray-700 bg-gray-900/60 p-4"
                  >
                    {/* Título grande */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="text-white text-[16px] font-semibold">
                        Usuario quiere tu Wait<span className="text-purple-500">Me!</span>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/50 font-bold text-xs">
                        {statusText}
                      </Badge>
                    </div>

                    {/* Operación incrustada */}
                    <MarcoCard
                      photoUrl={buyer?.photo || null}
                      name={buyer?.name || 'Usuario'}
                      carLabel={carLabel}
                      plate={plate}
                      carColor={carColor}
                      onChat={() => {}}
                      address={address}
                      timeLine={
                        <span className="text-gray-400">
                          {typeof mins === 'number' ? `Te vas en ${mins} min` : 'Operación en curso'}
                          {price != null ? ` · ${Number(price) || price}€` : ''}
                        </span>
                      }
                      statusText={statusText}
                      dimmed={status !== 'pending'}
                      role="buyer"
                    />

                    {status === 'pending' && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={() => acceptRequest(r)}
                        >
                          Aceptar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => rejectRequest(r)}
                        >
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="min-h-[calc(100vh-80px-96px)] flex items-center justify-center px-4">
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
                  <p className="text-sm text-gray-300">{unreadCount} sin leer</p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-purple-400 hover:text-purple-300"
                  onClick={() => markAllDemoRead?.()}
                >
                  Marcar todas como leídas
                </Button>
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
                const hasLatLon =
                  typeof alert?.latitude === 'number' &&
                  typeof alert?.longitude === 'number';

                const t = normalize(type);

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      // abrir chat al tocar la notificación
                      const convId =
                        n?.conversationId || ensureConversationForAlert(n?.alertId)?.id;
                      if (n?.id) markDemoNotificationRead(n.id);
                      if (convId) openChat(convId, n?.alertId);
                    }}
                    className={`rounded-xl border-2 p-4 transition-all cursor-pointer ${
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

                        <p className="text-sm text-white font-medium break-words">
                          {n?.text || '—'}
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          De: <span className="text-purple-300 font-semibold">{otherName}</span>
                        </p>
                      </div>
                    </div>

                    <MarcoCard
                      photoUrl={otherPhoto}
                      name={otherName}
                      carLabel={carLabel}
                      plate={plate}
                      carColor={carColor}
                      address={address}
                      timeLine={<span className="text-gray-400">Operación en curso</span>}
                      onChat={() => {
                        const convId =
                          n?.conversationId || ensureConversationForAlert(n?.alertId)?.id;
                        if (n?.id) markDemoNotificationRead(n.id);
                        openChat(convId, n?.alertId);
                      }}
                      statusText={statusText}
                      phoneEnabled={phoneEnabled}
                      onCall={() => phoneEnabled && phone && (window.location.href = `tel:${phone}`)}
                      dimmed={!isUnread}
                      role="buyer"
                    />

                    {hasLatLon && (
                      <div className="mt-2">
                        <Button
                          className="w-full border-2 bg-blue-600 hover:bg-blue-700 border-blue-400/70"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (n?.id) markDemoNotificationRead(n.id);
                            openNavigate(n?.alertId);
                          }}
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          IR
                        </Button>
                      </div>
                    )}

                    {t === 'incoming_waitme' && (
                      <div
                        className="mt-3 grid grid-cols-3 gap-2"
                        onClick={(e) => {
                          // evita que el contenedor abra chat si estás pulsando botones
                          e.stopPropagation();
                        }}
                      >
                        <Button onClick={() => runAction(n, 'reserved')}>Aceptar</Button>
                        <Button
                          variant="outline"
                          className="border-gray-600"
                          onClick={() => runAction(n, 'thinking')}
                        >
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