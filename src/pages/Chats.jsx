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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setUserLocation([p.coords.latitude, p.coords.longitude]),
        () => setUserLocation(null)
      );
    }
  }, []);

  const conversationsKey = useMemo(() => ['conversations', user?.id], [user?.id]);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: conversationsKey,
    enabled: !!user?.id,
    placeholderData: () => queryClient.getQueryData(conversationsKey) || [],
    queryFn: async () => {
      const [p1, p2] = await Promise.all([
        base44.entities.Conversation.filter({ participant1_id: user.id }),
        base44.entities.Conversation.filter({ participant2_id: user.id })
      ]);
      const map = new Map();
      [...p1, ...p2].forEach(c => map.set(c.id, c));
      return Array.from(map.values());
    },
    staleTime: 5 * 60 * 1000
  });

  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        (c.last_message_text || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [conversations, searchQuery]);

  const getReserveLabel = (conv) => {
    if (conv.alert_user_id === user.id) return 'Te reservó:';
    if (conv.reserved_by_id === user.id) return 'Reservaste a:';
    return 'Res.';
  };

  const formatDate = (ts) => {
    if (!ts) return '--';
    const d = new Date(ts);
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace('.', '');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Chats" showBackButton unreadCount={0} />

      <main className="pt-[60px] pb-24">
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar conversaciones..."
              className="w-full bg-gray-900 border border-gray-700 pl-10 pr-10 py-2 rounded-xl text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="px-4 space-y-3 pt-1">
          {filteredConversations.map((conv, index) => {
            const isP1 = conv.participant1_id === user.id;
            const otherName = isP1 ? conv.participant2_name : conv.participant1_name;
            const otherPhoto = isP1 ? conv.participant2_photo : conv.participant1_photo;
            const unread = isP1 ? conv.unread_count_p1 : conv.unread_count_p2;
            const hasUnread = unread > 0;

            return (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <div className={`rounded-xl p-2.5 border-2 ${
                  hasUnread ? 'border-purple-500/50 bg-gray-800' : 'border-gray-700 bg-gray-900/50'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="h-7 w-[95px] flex items-center justify-center text-xs font-bold whitespace-nowrap">
                      {getReserveLabel(conv)}
                    </Badge>

                    <div className="flex-1 text-center text-xs text-gray-400 truncate">
                      {formatDate(conv.last_message_at || conv.created_date)}
                    </div>
                  </div>

                  <MarcoCard
                    photoUrl={otherPhoto}
                    name={otherName}
                    carLabel={conv.car_label}
                    plate={conv.car_plate}
                    address={conv.address}
                    onChat={() =>
                      (window.location.href = createPageUrl(`Chat?conversationId=${conv.id}`))
                    }
                    dimmed={!hasUnread}
                  />
                </div>
              </motion.div>
            );
          })}

          {isLoading && null}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}