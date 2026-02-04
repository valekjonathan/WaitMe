import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import MarcoCard from '@/components/cards/MarcoCard';

export default function Chats() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  /* ================= USER ================= */
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => setUserLocation([p.coords.latitude, p.coords.longitude]),
        () => {}
      );
    }
  }, []);

  /* ================= CONVERSATIONS ================= */
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => base44.entities.Conversation.list('-last_message_at', 50),
    staleTime: 60000,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  /* ================= ALERTS ================= */
  const { data: alerts = [] } = useQuery({
    queryKey: ['alertsForChats'],
    queryFn: () => base44.entities.ParkingAlert.list('-created_date', 100),
    enabled: !!user?.id,
    staleTime: 60000,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  const alertsMap = useMemo(() => {
    const map = new Map();
    alerts.forEach(a => map.set(a.id, a));
    return map;
  }, [alerts]);

  /* ================= UNREAD ================= */
  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, c) => {
      const isP1 = c.participant1_id === user?.id;
      return sum + (isP1 ? c.unread_count_p1 : c.unread_count_p2 || 0);
    }, 0);
  }, [conversations, user?.id]);

  /* ================= FILTRO + FALLBACK ================= */
  const filtered = useMemo(() => {
    return conversations.filter(c => {
      const otherName =
        c.participant1_id === user?.id
          ? c.participant2_name
          : c.participant1_name;

      if (!searchQuery) return true;

      const text = `${otherName} ${c.last_message_text || ''}`.toLowerCase();
      return text.includes(searchQuery.toLowerCase());
    });
  }, [conversations, searchQuery, user?.id]);

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Chats" showBackButton backTo="Home" unreadCount={totalUnread} />

      {/* BUSCADOR — bien colocado */}
      <div className="pt-[72px] px-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <Input
            placeholder="Buscar conversación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-gray-900 border-gray-700 text-white focus:ring-purple-500"
          />
        </div>
      </div>

      <main className="pb-24 px-4 space-y-3">
        {filtered.map((conv, index) => {
          const isP1 = conv.participant1_id === user?.id;
          const alert = alertsMap.get(conv.alert_id);

          const otherName = isP1 ? conv.participant2_name : conv.participant1_name;
          const unread = isP1 ? conv.unread_count_p1 : conv.unread_count_p2;

          /* FALLBACK si no hay alerta */
          const safeAlert = alert || {
            user_photo: isP1 ? conv.participant2_photo : conv.participant1_photo,
            car_brand: '',
            car_model: '',
            car_plate: '',
            car_color: 'gris',
            address: '',
            available_in_minutes: 0,
            price: 0,
            allow_phone_calls: false
          };

          return (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-2.5 border-2 border-purple-500/50">

                <div className="flex justify-between items-center mb-2">
                  <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/50 text-xs h-7 w-[95px] flex items-center justify-center">
                    Info usuario
                  </Badge>

                  {alert && (
                    <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg px-3 py-0.5 h-7 flex items-center">
                      <span className="text-purple-300 font-bold text-xs">
                        {Math.round(alert.price)}€
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-700/80 pt-2">
                  <MarcoCard
                    photoUrl={safeAlert.user_photo}
                    name={otherName}
                    carLabel={`${safeAlert.car_brand} ${safeAlert.car_model}`}
                    plate={safeAlert.car_plate}
                    carColor={safeAlert.car_color}
                    address={safeAlert.address}
                    timeLine={
                      safeAlert.available_in_minutes
                        ? <>Se va en {safeAlert.available_in_minutes} min</>
                        : <>Conversación activa</>
                    }
                    onChat={() =>
                      navigate(createPageUrl(`Chat?conversationId=${conv.id}`))
                    }
                    phoneEnabled={safeAlert.allow_phone_calls}
                  />
                </div>

                <div
                  className="border-t border-gray-700/80 mt-2 pt-2 cursor-pointer"
                  onClick={() =>
                    navigate(createPageUrl(`Chat?conversationId=${conv.id}`))
                  }
                >
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-purple-400">
                      Últimos mensajes:
                    </p>
                    {unread > 0 && (
                      <div className="w-6 h-6 bg-red-500/20 border-2 border-red-500/30 rounded-full flex items-center justify-center">
                        <span className="text-red-400 text-xs font-bold">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-300 mt-1">
                    {conv.last_message_text || 'Sin mensajes'}
                  </p>
                </div>

              </div>
            </motion.div>
          );
        })}
      </main>

      <BottomNav />
    </div>
  );
}