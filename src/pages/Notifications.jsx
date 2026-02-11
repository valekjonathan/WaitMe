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
        {/* Header info */}
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

        {/* Lista de notificaciones */}
        <div className="px-4 space-y-3 pt-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">No hay notificaciones</p>
              <p className="text-gray-500 text-xs mt-1">
                Aquí verás las actualizaciones de tus reservas
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const isUnread = !n?.read;
              const type = n?.type || 'status_update';
              
              // Tipos especiales de notificación
              const isIncoming = type === 'incoming_waitme';
              const isAccepted = type === 'reservation_accepted';
              const isRejected = type === 'reservation_rejected';
              const isBuyerNearby = type === 'buyer_nearby';
              const isProrrogaRequest = type === 'prorroga_request';
              const isPaymentCompleted = type === 'payment_completed';
              const isTimeExpired = type === 'time_expired';
              const isCancellation = type === 'cancellation';

              return (
                <div
                  key={n.id}
                  className={`rounded-xl border-2 p-4 transition-all ${
                    isUnread 
                      ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-purple-400/70 shadow-lg' 
                      : 'bg-gradient-to-br from-gray-900/50 to-gray-900/50 border-gray-700'
                  }`}
                >
                  {/* Header con icono y badge */}
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${isUnread ? 'bg-purple-500/20' : 'bg-gray-800'}`}>
                      <div className={getNotificationColor(type)}>
                        {getNotificationIcon(type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${
                          isUnread 
                            ? 'bg-purple-500/20 text-purple-300 border-purple-400/50' 
                            : 'bg-gray-700/30 text-gray-400 border-gray-600/30'
                        } font-bold text-xs`}>
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

                      {n.amount && (
                        <p className="text-xs text-green-400 font-bold mt-1">
                          +{n.amount}€
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botones de acción según tipo */}
                  <div className="mt-4 space-y-2">
                    
                    {/* WAITME ENTRANTE: Aceptar / Me lo pienso / Rechazar */}
                    {isIncoming && (
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 border-green-400/50"
                          onClick={() => onAction({ notification: n, action: 'reserved' })}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Aceptar
                        </Button>
                        <Button
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 border-yellow-400/50"
                          onClick={() => onAction({ notification: n, action: 'thinking' })}
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          Pensar
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 border-red-400/50"
                          onClick={() => onAction({ notification: n, action: 'cancelled' })}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    )}

                    {/* RESERVA ACEPTADA: Ver chat / Ir */}
                    {isAccepted && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            if (n?.id) markDemoNotificationRead(n.id);
                            if (n?.alertId) goToNavigate(n.alertId);
                          }}
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Ir al lugar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600"
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
                    )}

                    {/* COMPRADOR CERCA: Ver ubicación / Chat */}
                    {isBuyerNearby && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            if (n?.id) markDemoNotificationRead(n.id);
                            if (n?.alertId) goToNavigate(n.alertId);
                          }}
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Ver ubicación
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600"
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
                    )}

                    {/* PRÓRROGA: Aceptar (1€) / Rechazar */}
                    {isProrrogaRequest && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => onAction({ notification: n, action: 'extended' })}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Aceptar (+1€)
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => onAction({ notification: n, action: 'cancelled' })}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Rechazar
                        </Button>
                      </div>
                    )}

                    {/* PAGO COMPLETADO: Ver detalles */}
                    {isPaymentCompleted && (
                      <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          if (n?.id) markDemoNotificationRead(n.id);
                          navigate(createPageUrl('History'));
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Ver detalles del pago
                      </Button>
                    )}

                    {/* RECHAZADA / CANCELADA / EXPIRADA: Ver alternativas / Chat */}
                    {(isRejected || isCancellation || isTimeExpired) && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600"
                          onClick={() => {
                            if (n?.id) markDemoNotificationRead(n.id);
                            navigate(createPageUrl('Home'));
                          }}
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Ver alternativas
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600"
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
                    )}

                    {/* OTROS: Chat / Marcar leída */}
                    {!isIncoming && !isAccepted && !isRejected && !isBuyerNearby && 
                     !isProrrogaRequest && !isPaymentCompleted && !isTimeExpired && !isCancellation && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-gray-600"
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
                        {isUnread && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-purple-400"
                            onClick={() => {
                              if (n?.id) markDemoNotificationRead(n.id);
                            }}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
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