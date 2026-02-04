import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import MarcoCard from '@/components/cards/MarcoCard';

export default function Chats() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    navigator.geolocation?.getCurrentPosition(
      p => setUserLocation([p.coords.latitude, p.coords.longitude]),
      () => {}
    );
  }, []);

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => base44.entities.Conversation.list('-last_message_at', 50),
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.ParkingAlert.list('-created_date', 100),
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const alertsMap = useMemo(() => {
    const map = new Map();
    alerts.forEach(a => map.set(a.id, a));
    return map;
  }, [alerts]);

  const filtered = useMemo(() => {
    return conversations.filter(c => {
      const name =
        c.participant1_id === user?.id
          ? c.participant2_name
          : c.participant1_name;
      return name?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [conversations, searchQuery, user?.id]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Chats" showBackButton backTo="Home" />

      <main className="pt-[60px] pb-24 px-4 space-y-3">
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar conversación..."
          className="mb-2"
        />

        {filtered.map((conv, index) => {
          const alert = alertsMap.get(conv.alert_id);
          if (!alert) return null;

          return (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-2.5 border-2 border-purple-500/50">
                <div className="flex justify-between items-center mb-2">
                  <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                    Info usuario
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-white font-bold">
                      {alert.price}€
                    </span>
                  </div>
                </div>

                <MarcoCard
                  photoUrl={conv.participant2_photo}
                  name={conv.participant2_name}
                  carLabel={`${alert.car_brand} ${alert.car_model}`}
                  plate={alert.car_plate}
                  address={alert.address}
                  timeLine={`Se va en ${alert.available_in_minutes} min`}
                  onChat={() =>
                    navigate(createPageUrl(`Chat?conversationId=${conv.id}`))
                  }
                  onCall={() =>
                    alert.phone && (window.location.href = `tel:${alert.phone}`)
                  }
                  phoneEnabled={alert.allow_phone_calls}
                />

                <div
                  className="mt-2 text-xs text-gray-300 cursor-pointer"
                  onClick={() =>
                    navigate(createPageUrl(`Chat?conversationId=${conv.id}`))
                  }
                >
                  {conv.last_message_text || 'Sin mensajes'}
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