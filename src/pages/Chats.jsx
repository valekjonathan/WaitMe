import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Navigation, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import MarcoCard from '@/components/cards/MarcoCard';

const toDateMs = (v) => {
  if (!v) return 0;
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v > 1e12 ? v : v * 1000;
  const t = new Date(String(v)).getTime();
  return Number.isNaN(t) ? 0 : t;
};

const DEMO_ITEMS = [
  {
    conversationId: 'demo_1',
    other: {
      id: 'demo_user_1',
      name: 'Sofía',
      photo: 'https://randomuser.me/api/portraits/women/44.jpg',
      allowCalls: true,
      phone: '600123123'
    },
    alert: {
      id: 'demo_alert_1',
      car_brand: 'SEAT',
      car_model: 'Ibiza',
      car_color: 'blanco',
      car_plate: '1234 KLM',
      price: 3,
      available_in_minutes: 6,
      address: 'Calle Uría, Oviedo',
      latitude: 43.3629,
      longitude: -5.8488,
      allow_phone_calls: true,
      phone: '600123123'
    },
    last_message_text: 'Estoy ya esperando en la esquina 🙂',
    last_message_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    unread: 1
  },
  {
    conversationId: 'demo_2',
    other: {
      id: 'demo_user_2',
      name: 'Marco',
      photo: 'https://randomuser.me/api/portraits/men/32.jpg',
      allowCalls: true,
      phone: '600456789'
    },
    alert: {
      id: 'demo_alert_2',
      car_brand: 'Volkswagen',
      car_model: 'Golf',
      car_color: 'negro',
      car_plate: '5678 HJP',
      price: 5,
      available_in_minutes: 10,
      address: 'Calle Fray Ceferino, Oviedo',
      latitude: 43.3612,
      longitude: -5.8502,
      allow_phone_calls: true,
      phone: '600456789'
    },
    last_message_text: 'Perfecto, aguanto 10 min.',
    last_message_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    unread: 0
  },
  {
    conversationId: 'demo_3',
    other: {
      id: 'demo_user_3',
      name: 'Nerea',
      photo: 'https://randomuser.me/api/portraits/women/68.jpg',
      allowCalls: false,
      phone: null
    },
    alert: {
      id: 'demo_alert_3',
      car_brand: 'Toyota',
      car_model: 'RAV4',
      car_color: 'azul',
      car_plate: '9012 LSR',
      price: 7,
      available_in_minutes: 14,
      address: 'Calle Campoamor, Oviedo',
      latitude: 43.363,
      longitude: -5.8489,
      allow_phone_calls: false,
      phone: null
    },
    last_message_text: 'Ojo: no puedo llamadas, solo chat.',
    last_message_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    unread: 2
  }
];

export default function Chats() {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Usuario autenticado (cacheado)
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false
  });

  // Ubicación (no bloquea)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: false, timeout: 2500, maximumAge: 60 * 1000 }
    );
  }, []);

  // Conversaciones del usuario (ligero)
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['conversationsForUser', user?.id],
    enabled: !!user?.id,
    staleTime: 10 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const [asP1, asP2] = await Promise.all([
        base44.entities.Conversation.filter({ participant1_id: user.id }, '-last_message_at', 50),
        base44.entities.Conversation.filter({ participant2_id: user.id }, '-last_message_at', 50)
      ]);

      const a1 = Array.isArray(asP1) ? asP1 : asP1?.data || [];
      const a2 = Array.isArray(asP2) ? asP2 : asP2?.data || [];

      const byId = new Map();
      [...a1, ...a2].forEach((c) => c?.id && byId.set(c.id, c));

      const list = Array.from(byId.values());
      list.sort((x, y) => {
        const tx = toDateMs(x.last_message_at || x.updated_date || x.created_date);
        const ty = toDateMs(y.last_message_at || y.updated_date || y.created_date);
        return ty - tx;
      });

      return list;
    }
  });

  // Si no hay conversaciones reales → mostrar DEMO (sin “Sin chats”)
  const showDemo = !loadingConversations && (conversations?.length || 0) === 0;

  // IDs usados (solo reales)
  const ids = useMemo(() => {
    const alertIds = new Set();
    const otherUserIds = new Set();

    (conversations || []).forEach((c) => {
      if (c?.alert_id) alertIds.add(c.alert_id);
      const isP1 = c.participant1_id === user?.id;
      const otherId = isP1 ? c.participant2_id : c.participant1_id;
      if (otherId) otherUserIds.add(otherId);
    });

    return { alertIds: Array.from(alertIds), otherUserIds: Array.from(otherUserIds) };
  }, [conversations, user?.id]);

  // Alertas por IDs usados
  const { data: alerts = [] } = useQuery({
    queryKey: ['alertsForChats', ids.alertIds.join('|')],
    enabled: ids.alertIds.length > 0,
    staleTime: 30 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      try {
        const res = await base44.entities.ParkingAlert.filter({ id: { $in: ids.alertIds } });
        return Array.isArray(res) ? res : res?.data || [];
      } catch {
        const all = await base44.entities.ParkingAlert.list('-created_date', 200);
        const list = Array.isArray(all) ? all : all?.data || [];
        return list.filter((a) => ids.alertIds.includes(a.id));
      }
    }
  });

  // Usuarios por IDs usados
  const { data: otherUsers = [] } = useQuery({
    queryKey: ['usersForChats', ids.otherUserIds.join('|')],
    enabled: ids.otherUserIds.length > 0,
    staleTime: 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      try {
        const res = await base44.entities.User.filter({ id: { $in: ids.otherUserIds } });
        return Array.isArray(res) ? res : res?.data || [];
      } catch {
        const all = await base44.entities.User.list();
        const list = Array.isArray(all) ? all : all?.data || [];
        return list.filter((u) => ids.otherUserIds.includes(u.id));
      }
    }
  });

  const usersMap = useMemo(() => new Map(otherUsers.map((u) => [u.id, u])), [otherUsers]);
  const alertsMap = useMemo(() => new Map(alerts.map((a) => [a.id, a])), [alerts]);

  const totalUnread = useMemo(() => {
    return (conversations || []).reduce((sum, conv) => {
      const isP1 = conv.participant1_id === user?.id;
      const unread = isP1 ? conv.unread_count_p1 : conv.unread_count_p2;
      return sum + (unread || 0);
    }, 0);
  }, [conversations, user?.id]);

  const calculateDistanceText = (alert) => {
    if (!alert?.latitude || !alert?.longitude || !userLocation) return null;
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
    const meters = Math.round(R * c * 1000);
    return meters > 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`;
  };

  const filteredReal = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations || [];
    return (conversations || []).filter((conv) => {
      const isP1 = conv.participant1_id === user?.id;
      const otherId = isP1 ? conv.participant2_id : conv.participant1_id;
      const other = usersMap.get(otherId);
      const otherName =
        other?.display_name ||
        other?.full_name ||
        (isP1 ? conv.participant2_name : conv.participant1_name) ||
        '';
      const lastMessage = String(conv.last_message_text || '').toLowerCase();
      return otherName.toLowerCase().includes(q) || lastMessage.includes(q);
    });
  }, [conversations, searchQuery, user?.id, usersMap]);

  const filteredDemo = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return DEMO_ITEMS;
    return DEMO_ITEMS.filter((d) => {
      const otherName = (d.other?.name || '').toLowerCase();
      const last = (d.last_message_text || '').toLowerCase();
      return otherName.includes(q) || last.includes(q);
    });
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Chats" showBackButton={true} backTo="Home" unreadCount={showDemo ? filteredDemo.reduce((s, d) => s + (d.unread || 0), 0) : totalUnread} />

      <main className="pt-[60px] pb-24">
        <div className="px-4 pt-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o mensaje"
              className="pl-9 bg-gray-900 border-gray-800 text-white"
            />
          </div>
        </div>

        <div className="px-4 pt-3 space-y-3">
          {loadingConversations ? (
            <div className="text-center py-12 text-gray-500">Cargando...</div>
          ) : showDemo ? (
            filteredDemo.map((item, index) => {
              const alert = item.alert;
              const otherName = item.other?.name || 'Usuario';
              const otherPhoto = item.other?.photo || null;
              const unreadCount = item.unread || 0;
              const hasUnread = unreadCount > 0;
              const distanceText = calculateDistanceText(alert);

              return (
                <motion.div
                  key={item.conversationId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <div
                    className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-2.5 transition-all border-2 ${
                      hasUnread ? 'border-purple-500' : 'border-purple-500/40'
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold text-xs h-7 w-[95px] flex items-center justify-center text-center cursor-default select-none pointer-events-none">
                          Info usuario
                        </Badge>

                        <div className="flex items-center gap-1">
                          {distanceText && (
                            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
                              <Navigation className="w-3 h-3 text-purple-400" />
                              <span className="text-white font-bold text-xs">{distanceText}</span>
                            </div>
                          )}
                          <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg px-3 py-0.5 flex items-center gap-1 h-7">
                            <span className="text-purple-300 font-bold text-xs">{Math.round(alert.price || 0)}€</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-700/80 mb-1.5 pt-2">
                        <MarcoCard
                          photoUrl={otherPhoto}
                          name={otherName}
                          carLabel={`${alert.car_brand || ''} ${alert.car_model || ''}`.trim()}
                          plate={alert.car_plate}
                          carColor={alert.car_color || 'gris'}
                          address={alert.address}
                          timeLine={
                            <>
                              <span className="text-white">Se va en {alert.available_in_minutes} min ·</span> Te espera hasta las{' '}
                              {new Date(Date.now() + (Number(alert.available_in_minutes) || 0) * 60000).toLocaleString('es-ES', {
                                timeZone: 'Europe/Madrid',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </>
                          }
                          onChat={() => navigate(createPageUrl(`Chat?conversationId=${item.conversationId}`))}
                          statusText={new Date(Date.now() + (Number(alert.available_in_minutes) || 0) * 60000).toLocaleString('es-ES', {
                            timeZone: 'Europe/Madrid',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}
                          phoneEnabled={!!alert.allow_phone_calls}
                          onCall={() => alert.allow_phone_calls && alert?.phone && (window.location.href = `tel:${alert.phone}`)}
                        />
                      </div>

                      <div
                        className="border-t border-gray-700/80 mt-2 pt-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate(createPageUrl(`Chat?conversationId=${item.conversationId}`))}
                      >
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-purple-400">Último mensaje:</p>
                          {hasUnread && (
                            <div className="w-5 h-5 bg-red-500/20 border-2 border-red-500/30 rounded-full flex items-center justify-center ml-auto">
                              <span className="text-red-400 text-[10px] font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-300 mt-1">{item.last_message_text || 'Sin mensajes'}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : filteredReal.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg mb-2">Sin chats</p>
              <p className="text-sm">Cuando reserves o te reserven, aparecerán aquí</p>
            </div>
          ) : (
            filteredReal.map((conv, index) => {
              const isP1 = conv.participant1_id === user?.id;
              const otherId = isP1 ? conv.participant2_id : conv.participant1_id;
              const unreadCount = (isP1 ? conv.unread_count_p1 : conv.unread_count_p2) || 0;
              const hasUnread = unreadCount > 0;

              const other = usersMap.get(otherId);
              const otherName =
                other?.display_name ||
                (other?.full_name ? other.full_name.split(' ')[0] : null) ||
                (isP1 ? conv.participant2_name : conv.participant1_name) ||
                'Usuario';
              const otherPhoto = other?.photo_url || (isP1 ? conv.participant2_photo : conv.participant1_photo) || null;

              const alert = alertsMap.get(conv.alert_id);
              if (!alert) return null;

              const distanceText = calculateDistanceText(alert);

              return (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <div
                    className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-2.5 transition-all border-2 ${
                      hasUnread ? 'border-purple-500' : 'border-purple-500/40'
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold text-xs h-7 w-[95px] flex items-center justify-center text-center cursor-default select-none pointer-events-none">
                          Info usuario
                        </Badge>

                        <div className="flex items-center gap-1">
                          {distanceText && (
                            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
                              <Navigation className="w-3 h-3 text-purple-400" />
                              <span className="text-white font-bold text-xs">{distanceText}</span>
                            </div>
                          )}
                          <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg px-3 py-0.5 flex items-center gap-1 h-7">
                            <span className="text-purple-300 font-bold text-xs">{Math.round(alert.price || 0)}€</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-700/80 mb-1.5 pt-2">
                        <MarcoCard
                          photoUrl={otherPhoto}
                          name={otherName}
                          carLabel={`${alert.car_brand || ''} ${alert.car_model || ''}`.trim()}
                          plate={alert.car_plate}
                          carColor={alert.car_color || 'gris'}
                          address={alert.address}
                          timeLine={
                            <>
                              <span className="text-white">Se va en {alert.available_in_minutes} min ·</span> Te espera hasta las{' '}
                              {new Date(Date.now() + (Number(alert.available_in_minutes) || 0) * 60000).toLocaleString('es-ES', {
                                timeZone: 'Europe/Madrid',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </>
                          }
                          onChat={() => navigate(createPageUrl(`Chat?conversationId=${conv.id}`))}
                          statusText={new Date(Date.now() + (Number(alert.available_in_minutes) || 0) * 60000).toLocaleString('es-ES', {
                            timeZone: 'Europe/Madrid',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}
                          phoneEnabled={!!alert.allow_phone_calls}
                          onCall={() => alert.allow_phone_calls && alert?.phone && (window.location.href = `tel:${alert.phone}`)}
                        />
                      </div>

                      <div
                        className="border-t border-gray-700/80 mt-2 pt-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate(createPageUrl(`Chat?conversationId=${conv.id}`))}
                      >
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-purple-400">Último mensaje:</p>
                          {hasUnread && (
                            <div className="w-5 h-5 bg-red-500/20 border-2 border-red-500/30 rounded-full flex items-center justify-center ml-auto">
                              <span className="text-red-400 text-[10px] font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-300 mt-1">{conv.last_message_text || 'Sin mensajes'}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}