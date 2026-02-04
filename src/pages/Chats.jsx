import React, { useEffect, useMemo, useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, X, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import MarcoCard from '@/components/cards/MarcoCard';
import { useAuth } from '@/lib/AuthContext';

export default function Chats() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Ubicación solo para distancia (si falla, seguimos sin ella)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation([position.coords.latitude, position.coords.longitude]),
        () => setUserLocation(null)
      );
    }
  }, []);

  const conversationsKey = useMemo(() => ['conversations', user?.id], [user?.id]);

  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
    queryKey: conversationsKey,
    enabled: !!user?.id,
    // Render inmediato desde caché si existe (al entrar desde el menú inferior)
    placeholderData: () => queryClient.getQueryData(conversationsKey) || [],
    queryFn: async () => {
      const [asP1, asP2] = await Promise.all([
        base44.entities.Conversation.filter({ participant1_id: user.id }),
        base44.entities.Conversation.filter({ participant2_id: user.id })
      ]);

      const map = new Map();
      [...(asP1 || []), ...(asP2 || [])].forEach((c) => {
        if (c?.id) map.set(c.id, c);
      });

      const merged = Array.from(map.values());
      merged.sort((a, b) => {
        const ta = new Date(a.last_message_at || a.updated_date || a.created_date || 0).getTime();
        const tb = new Date(b.last_message_at || b.updated_date || b.created_date || 0).getTime();
        return tb - ta;
      });

      return merged;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false
  });

  // Alertas: una sola carga (lista) y mapeo por id
  const alertsKey = useMemo(() => ['alertsForChatsList', user?.id], [user?.id]);
  const { data: alerts = [] } = useQuery({
    queryKey: alertsKey,
    enabled: !!user?.id,
    placeholderData: () => queryClient.getQueryData(alertsKey) || [],
    queryFn: async () => base44.entities.ParkingAlert.list('-created_date', 200),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false
  });

  const alertsMap = useMemo(() => {
    const map = new Map();
    (alerts || []).forEach((a) => a?.id && map.set(a.id, a));
    return map;
  }, [alerts]);

  const totalUnread = useMemo(() => {
    return (conversations || []).reduce((sum, conv) => {
      const isP1 = conv.participant1_id === user?.id;
      const unread = isP1 ? conv.unread_count_p1 : conv.unread_count_p2;
      return sum + (unread || 0);
    }, 0);
  }, [conversations, user?.id]);

  const filteredConversations = useMemo(() => {
    let filtered = conversations || [];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((conv) => {
        const isP1 = conv.participant1_id === user?.id;
        const otherName = (isP1 ? conv.participant2_name : conv.participant1_name) || '';
        const lastMsg = conv.last_message_text || '';
        return otherName.toLowerCase().includes(q) || lastMsg.toLowerCase().includes(q);
      });
    }

    return [...filtered].sort((a, b) => {
      const aUnread = (a.participant1_id === user?.id ? a.unread_count_p1 : a.unread_count_p2) || 0;
      const bUnread = (b.participant1_id === user?.id ? b.unread_count_p1 : b.unread_count_p2) || 0;
      if (bUnread !== aUnread) return bUnread - aUnread;
      const ta = new Date(a.last_message_at || a.updated_date || a.created_date || 0).getTime();
      const tb = new Date(b.last_message_at || b.updated_date || b.created_date || 0).getTime();
      return tb - ta;
    });
  }, [conversations, searchQuery, user?.id]);

  const formatCardDate = (ts) => {
    if (!ts) return '--';
    const date = new Date(ts);
    const day = date.toLocaleString('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit' });
    const month = date.toLocaleString('es-ES', { timeZone: 'Europe/Madrid', month: 'short' }).replace('.', '');
    const time = date.toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${day} ${month} - ${time}`;
  };

  const calculateDistanceText = (alert) => {
    if (!alert?.latitude || !alert?.longitude) return null;

    if (!userLocation) {
      const demoDistances = ['150m', '320m', '480m', '650m', '800m'];
      return demoDistances[(alert.id || '').charCodeAt(0) % demoDistances.length];
    }

    const R = 6371;
    const dLat = (alert.latitude - userLocation[0]) * Math.PI / 180;
    const dLon = (alert.longitude - userLocation[1]) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation[0] * Math.PI / 180) *
        Math.cos(alert.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const km = R * c;
    const meters = Math.round(km * 1000);
    return `${Math.min(meters, 999)}m`;
  };

  // Botón superior: ancho exacto de foto (95px) y texto 1 línea
  const getReserveLabel = (alert) => {
    if (!alert?.reserved_by_id) return 'Info';
    if (alert.reserved_by_id === user?.id) return 'Reservaste a:';      // yo reservé
    if (alert.user_id === user?.id) return 'Te reservó:';              // me reservaron mi alerta
    return 'Res.';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Chats" showBackButton={true} backTo="Home" unreadCount={totalUnread} />

      <main className="pt-[60px] pb-24">
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-white pl-10 pr-10 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="px-4 space-y-3 pt-1">
          {(filteredConversations || []).map((conv, index) => {
            const alert = alertsMap.get(conv.alert_id);
            if (!alert) return null;

            const isP1 = conv.participant1_id === user?.id;
            const otherUserName = (isP1 ? conv.participant2_name : conv.participant1_name) || 'Usuario';
            const otherUserPhoto = isP1 ? conv.participant2_photo : conv.participant1_photo;
            const unreadCount = isP1 ? conv.unread_count_p1 : conv.unread_count_p2;
            const hasUnread = (unreadCount || 0) > 0;

            const cardDate = formatCardDate(conv.last_message_at || conv.created_date);
            const distanceText = calculateDistanceText(alert);
            const reserveLabel = getReserveLabel(alert);

            return (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  className={`bg-gradient-to-br ${
                    hasUnread ? 'from-gray-800 to-gray-900' : 'from-gray-900/50 to-gray-900/50'
                  } rounded-xl p-2.5 transition-all border-2 ${
                    hasUnread ? 'border-purple-500/50' : 'border-gray-700/80'
                  }`}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-shrink-0">
                        <Badge
                          className={`${
                            hasUnread
                              ? 'bg-purple-500/20 text-purple-300 border-purple-400/50'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          } border font-bold text-xs h-7 w-[95px] flex items-center justify-center cursor-default select-none pointer-events-none whitespace-nowrap overflow-hidden text-ellipsis`}
                        >
                          {reserveLabel}
                        </Badge>
                      </div>

                      <div
                        className={`flex-1 text-center text-xs ${
                          hasUnread ? 'text-white font-semibold' : 'text-gray-600'
                        } truncate`}
                      >
                        {cardDate}
                      </div>

                      <button
                        onClick={() =>
                          window.open(`https://www.google.com/maps?q=${alert?.latitude},${alert?.longitude}`, '_blank')
                        }
                        className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7 transition-all"
                      >
                        <Navigation className="w-3 h-3 text-purple-400" />
                        <span className="text-white font-bold text-xs">{distanceText}</span>
                      </button>

                      <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg px-3 py-0.5 flex items-center gap-1 h-7">
                        <span className="text-purple-300 font-bold text-xs">{Math.floor(alert?.price)}€</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-700/80 mb-1.5 pt-2">
                      <MarcoCard
                        photoUrl={otherUserPhoto}
                        name={otherUserName}
                        carLabel={`${alert.car_brand || ''} ${alert.car_model || ''}`.trim()}
                        plate={alert.car_plate}
                        carColor={alert.car_color || 'gris'}
                        address={alert.address}
                        timeLine={
                          <>
                            <span className={hasUnread ? 'text-white' : 'text-gray-400'}>
                              Se va en {alert.available_in_minutes} min ·
                            </span>{' '}
                            Te espera hasta las{' '}
                            {new Date(Date.now() + alert.available_in_minutes * 60000).toLocaleString('es-ES', {
                              timeZone: 'Europe/Madrid',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })}
                          </>
                        }
                        onChat={() => (window.location.href = createPageUrl(`Chat?conversationId=${conv.id}`))}
                        statusText={new Date(Date.now() + alert.available_in_minutes * 60000).toLocaleString('es-ES', {
                          timeZone: 'Europe/Madrid',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                        phoneEnabled={alert.allow_phone_calls}
                        onCall={() =>
                          alert.allow_phone_calls && alert?.phone && (window.location.href = `tel:${alert.phone}`)
                        }
                        dimmed={!hasUnread}
                      />
                    </div>

                    <div
                      className="border-t border-gray-700/80 mt-2 pt-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => (window.location.href = createPageUrl(`Chat?conversationId=${conv.id}`))}
                    >
                      <div className="flex justify-between items-center">
                        <p className={`text-xs font-bold ${hasUnread ? 'text-purple-400' : 'text-gray-500'}`}>
                          Ultimos mensajes:
                        </p>
                        {unreadCount > 0 && (
                          <div className="w-6 h-6 bg-red-500/20 border-2 border-red-500/30 rounded-full flex items-center justify-center relative top-[10px]">
                            <span className="text-red-400 text-xs font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                          </div>
                        )}
                      </div>
                      <p className={`text-xs ${hasUnread ? 'text-gray-300' : 'text-gray-500'} mt-1`}>
                        {conv.last_message_text || 'Sin mensajes'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {isLoadingConversations && (filteredConversations || []).length === 0 ? null : null}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}