import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, User, Settings, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import BottomNav from '@/components/BottomNav';

export default function Chats() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Error:', error);
      }
    };
    fetchUser();
  }, []);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      // Obtener conversaciones donde soy participante
      const [asP1, asP2] = await Promise.all([
        base44.entities.Conversation.filter({ participant1_id: user?.id }),
        base44.entities.Conversation.filter({ participant2_id: user?.id })
      ]);
      return [...asP1, ...asP2].sort((a, b) => 
        new Date(b.last_message_at || b.created_date) - new Date(a.last_message_at || a.created_date)
      );
    },
    enabled: !!user?.id,
    refetchInterval: 5000
  });

  // Obtener alertas para mostrar info
  const { data: alerts = [] } = useQuery({
    queryKey: ['alertsForChats'],
    queryFn: () => base44.entities.ParkingAlert.list(),
    enabled: !!user?.id
  });

  const alertsMap = React.useMemo(() => {
    const map = new Map();
    alerts.forEach(alert => map.set(alert.id, alert));
    return map;
  }, [alerts]);

  // Filtrar conversaciones
  const filteredConversations = React.useMemo(() => {
    if (!searchQuery) return conversations;
    
    const query = searchQuery.toLowerCase();
    return conversations.filter(conv => {
      const otherUserName = conv.participant1_id === user?.id 
        ? conv.participant2_name 
        : conv.participant1_name;
      const lastMessage = conv.last_message_text || '';
      
      return otherUserName?.toLowerCase().includes(query) || 
             lastMessage.toLowerCase().includes(query);
    });
  }, [conversations, searchQuery, user?.id]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="text-white">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-1 flex items-center gap-1">
              <span className="text-purple-400 font-bold text-sm">{(user?.credits || 0).toFixed(2)}€</span>
            </div>
            <Link to={createPageUrl('Home')}>
              <h1 className="text-lg font-semibold cursor-pointer hover:opacity-80 transition-opacity">
                <span className="text-white">Wait</span><span className="text-purple-500">Me!</span>
              </h1>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <Link to={createPageUrl('Settings')}>
              <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Link to={createPageUrl('Chats')} className="relative">
              <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20">
                <MessageCircle className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Buscador */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar conversaciones..."
              className="pl-10 pr-10 bg-gray-900 border-gray-800 text-white"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="pt-32 pb-24">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">
            Cargando conversaciones...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">
              {searchQuery ? 'No se encontraron conversaciones' : 'Sin conversaciones'}
            </p>
            <p className="text-sm">
              {searchQuery ? 'Intenta con otra búsqueda' : 'Cuando reserves o alguien reserve tu plaza, podrás chatear aquí'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filteredConversations.map((conv, index) => {
              const isP1 = conv.participant1_id === user?.id;
              const otherUserId = isP1 ? conv.participant2_id : conv.participant1_id;
              const otherUserName = isP1 ? conv.participant2_name : conv.participant1_name;
              const otherUserPhoto = isP1 ? conv.participant2_photo : conv.participant1_photo;
              const unreadCount = isP1 ? conv.unread_count_p1 : conv.unread_count_p2;
              const alert = alertsMap.get(conv.alert_id);

              return (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={createPageUrl(`Chat?conversationId=${conv.id}`)}
                    className="flex items-center gap-4 px-4 py-4 hover:bg-gray-900/50 transition-colors"
                  >
                    {/* Avatar */}
                    {otherUserPhoto ? (
                      <img 
                        src={otherUserPhoto} 
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0" 
                        alt="" 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-gray-500" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{otherUserName}</span>
                        <span className="text-xs text-gray-500">
                          {conv.last_message_at && formatDistanceToNow(new Date(conv.last_message_at), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </span>
                      </div>
                      
                      {alert && (
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30 text-xs">
                            {alert.price}€ / {alert.available_in_minutes} min
                          </Badge>
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-400 truncate">
                        {conv.last_message_text || 'Sin mensajes'}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {unreadCount > 0 && (
                      <Badge className="bg-purple-600 text-white min-w-[24px] h-6 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}