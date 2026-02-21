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
  Navigation,
  Clock,
  MessageCircle,
  Phone,
  PhoneOff
} from 'lucide-react';
import UserAlertCard from '@/components/cards/UserAlertCard';

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

                // Construir un objeto "alert" compatible con UserAlertCard
                const fakeAlert = {
                  user_name: buyer?.name || 'Usuario',
                  user_photo: buyer?.photo || null,
                  car_brand: '',
                  car_model: carLabel,
                  car_color: carColor,
                  car_plate: plate,
                  address: address,
                  available_in_minutes: typeof mins === 'number' ? mins : null,
                  price: price,
                  phone: buyer?.phone || null,
                  allow_phone_calls: false,
                  latitude: null,
                  longitude: null
                };

                return (
                  <div key={r?.id} className="rounded-xl border-2 border-purple-500/50 bg-gray-900 p-0 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 px-3 pt-3 pb-2">
                      <div className="text-white text-[15px] font-semibold">
                        Usuario quiere tu Wait<span className="text-purple-500">Me!</span>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/50 font-bold text-xs">
                        {statusText}
                      </Badge>
                    </div>

                    {/* Tarjeta completa estilo "Dónde quieres aparcar" */}
                    <div className="px-2 pb-2">
                      <UserAlertCard
                        alert={fakeAlert}
                        isEmpty={false}
                        onBuyAlert={status === 'pending' ? () => acceptRequest(r) : undefined}
                        onChat={() => {}}
                        onCall={() => buyer?.phone && (window.location.href = `tel:${buyer.phone}`)}
                        isLoading={false}
                        userLocation={null}
                        buyLabel="Aceptar"
                        hideBuy={status !== 'pending'}
                      />
                      {status === 'pending' && (
                        <div className="mt-2">
                          <Button variant="destructive" className="w-full" onClick={() => rejectRequest(r)}>
                            Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
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

                const handleChatClick = (e) => {
                    e?.stopPropagation();
                    const convId = n?.conversationId || ensureConversationForAlert(n?.alertId)?.id;
                    if (n?.id) markDemoNotificationRead(n.id);
                    openChat(convId, n?.alertId);
                  };

                  const carColors = { blanco: '#FFFFFF', negro: '#1a1a1a', rojo: '#ef4444', azul: '#3b82f6', amarillo: '#facc15', gris: '#6b7280' };
                  const carFill = carColors[carColor] || '#6b7280';
                  const formatPlate = (p) => { const c = String(p || '').replace(/\s+/g, '').toUpperCase(); if (!c) return '0000 XXX'; return `${c.slice(0,4)} ${c.slice(4)}`.trim(); };
                  const photoSrc = otherPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherName)}&background=7c3aed&color=fff&size=128`;

                  return (
                  <div
                    key={n.id}
                    onClick={() => {
                      const convId = n?.conversationId || ensureConversationForAlert(n?.alertId)?.id;
                      if (n?.id) markDemoNotificationRead(n.id);
                      if (convId) openChat(convId, n?.alertId);
                    }}
                    className={`rounded-xl border-2 p-2 transition-all cursor-pointer ${
                      isUnread
                        ? 'bg-gray-900 border-purple-500/50 shadow-lg'
                        : 'bg-gray-900 border-gray-700'
                    }`}
                  >
                    {/* Header row: badge + título + sin leer */}
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold text-xs h-7 px-3 flex items-center justify-center cursor-default select-none pointer-events-none">
                        {n?.title || 'NOTIFICACIÓN'}
                      </Badge>
                      <div className="flex-1 text-center text-xs text-white truncate">{n?.text || '—'}</div>
                      {isUnread && <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse flex-shrink-0" />}
                    </div>

                    <div className="border-t border-gray-700/80 mb-1" />

                    {/* Foto + info usuario */}
                    <div className="flex gap-2.5">
                      <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500/40 bg-gray-900 flex-shrink-0">
                        <img src={photoSrc} alt={otherName} className={`w-full h-full object-cover ${!isUnread ? 'opacity-40 grayscale' : ''}`} />
                      </div>

                      <div className="flex-1 h-[85px] flex flex-col">
                        <p className={`font-bold text-xl leading-none min-h-[22px] ${isUnread ? 'text-white' : 'text-gray-400'}`}>
                          {(otherName || '').split(' ')[0] || 'Usuario'}
                        </p>
                        <p className={`text-sm font-medium leading-none flex-1 flex items-center truncate relative top-[6px] ${isUnread ? 'text-gray-200' : 'text-gray-500'}`}>
                          {carLabel || 'Sin datos'}
                        </p>

                        <div className="flex items-end gap-2 mt-1 min-h-[28px]">
                          <div className={`flex-shrink-0 ${!isUnread ? 'opacity-45' : ''}`}>
                            <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
                              <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
                                <span className="text-white text-[8px] font-bold">E</span>
                              </div>
                              <span className="px-2 text-black font-mono font-bold text-sm tracking-wider">{formatPlate(plate)}</span>
                            </div>
                          </div>
                          <div className="flex-1 flex justify-center">
                            <div className={`flex-shrink-0 relative -top-[1px] ${!isUnread ? 'opacity-45' : ''}`}>
                              <svg viewBox="0 0 48 24" className="w-16 h-10" fill="none" style={{ transform: 'translateY(3px)' }}>
                                <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill={carFill} stroke="white" strokeWidth="1.5" />
                                <path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="0.5" />
                                <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
                                <circle cx="14" cy="18" r="2" fill="#666" />
                                <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
                                <circle cx="36" cy="18" r="2" fill="#666" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dirección y tiempo */}
                    <div className="pt-1.5 border-t border-gray-700/80 mt-1">
                      <div className={`space-y-1.5 ${!isUnread ? 'opacity-80' : ''}`}>
                        {address ? (
                          <div className="flex items-start gap-1.5 text-xs">
                            <MapPin className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isUnread ? 'text-purple-400' : 'text-gray-500'}`} />
                            <span className={`leading-5 line-clamp-1 ${isUnread ? 'text-gray-200' : 'text-gray-400'}`}>{address}</span>
                          </div>
                        ) : null}
                        <div className="flex items-start gap-1.5 text-xs">
                          <Clock className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isUnread ? 'text-purple-400' : 'text-gray-500'}`} />
                          <span className={`leading-5 ${isUnread ? 'text-gray-200' : 'text-gray-400'}`}>Operación en curso</span>
                        </div>
                      </div>
                    </div>

                    {/* Botones: mismo layout que UserAlertCard */}
                    <div className="mt-2">
                      <div className="flex gap-2">
                        <Button size="icon" className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-8 w-[42px]" onClick={handleChatClick}>
                          <MessageCircle className="w-4 h-4" />
                        </Button>

                        {phoneEnabled ? (
                          <Button size="icon" className="bg-white hover:bg-gray-200 text-black rounded-lg h-8 w-[42px]"
                            onClick={(e) => { e.stopPropagation(); phone && (window.location.href = `tel:${phone}`); }}>
                            <Phone className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button variant="outline" size="icon" className="border-white/30 bg-white/10 text-white rounded-lg h-8 w-[42px] opacity-70 cursor-not-allowed" disabled>
                            <PhoneOff className="w-4 h-4 text-white" />
                          </Button>
                        )}

                        {hasLatLon && (
                          <Button size="icon" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-8 w-[42px]"
                            onClick={(e) => { e.stopPropagation(); if (n?.id) markDemoNotificationRead(n.id); openNavigate(n?.alertId); }}>
                            <Navigation className="w-4 h-4" />
                          </Button>
                        )}

                        {t === 'incoming_waitme' ? (
                          <div className="flex-1 grid grid-cols-3 gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button className="h-8 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs px-1" onClick={() => runAction(n, 'reserved')}>Aceptar</Button>
                            <Button variant="outline" className="h-8 rounded-lg border-gray-600 text-white text-xs px-1" onClick={() => runAction(n, 'thinking')}>Pienso</Button>
                            <Button variant="destructive" className="h-8 rounded-lg text-xs px-1" onClick={() => runAction(n, 'rejected')}>Rechazar</Button>
                          </div>
                        ) : (
                          <div className="flex-1">
                            <div className="w-full h-8 rounded-lg border-2 border-purple-500/30 bg-purple-600/10 flex items-center justify-center px-3">
                              <span className="text-sm font-mono font-extrabold text-purple-300">{statusText}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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