import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, User, Settings, Search, X, Phone } from 'lucide-react';
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
    queryKey: ['conversations'],
    queryFn: async () => {
      // Obtener TODAS las conversaciones ordenadas por más reciente
      const allConversations = await base44.entities.Conversation.list();
      return allConversations.sort((a, b) => 
        new Date(b.last_message_at || b.updated_date || b.created_date) - 
        new Date(a.last_message_at || a.updated_date || a.created_date)
      );
    },
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

  // Calcular total de no leídos
  const totalUnread = React.useMemo(() => {
    return conversations.reduce((sum, conv) => {
      const isP1 = conv.participant1_id === user?.id;
      const unread = isP1 ? conv.unread_count_p1 : conv.unread_count_p2;
      return sum + (unread || 0);
    }, 0);
  }, [conversations, user?.id]);

  // Filtrar conversaciones por búsqueda
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

  // Función para calcular minutos desde el último mensaje
  const getMinutesSince = (timestamp) => {
    if (!timestamp) return 1;
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    return Math.max(1, minutes);
  };



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
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
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
          <div className="px-4 space-y-3">
            {filteredConversations.map((conv, index) => {
              const isP1 = conv.participant1_id === user?.id;
              const otherUserId = isP1 ? conv.participant2_id : conv.participant1_id;
              const otherUserName = isP1 ? conv.participant2_name : conv.participant1_name;
              const otherUserPhoto = isP1 ? conv.participant2_photo : conv.participant1_photo;
              const alert = alertsMap.get(conv.alert_id);
              
              // Borde encendido solo para las 2 primeras
              const isHighlighted = index < 2;
              
              // Avatar con fallback a pravatar
              const avatarUrl = otherUserPhoto || `https://i.pravatar.cc/150?u=${otherUserId}`;
              
              // Obtener teléfono del otro usuario
              const otherUserPhone = null; // TODO: obtener del usuario si está disponible
              
              // Calcular minutos
              const minutesSince = getMinutesSince(conv.last_message_at);

              return (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div
                    className={`
                      bg-gray-900 rounded-2xl p-4 transition-all
                      ${isHighlighted 
                        ? 'border-2 border-purple-500 shadow-lg shadow-purple-500/20' 
                        : 'border-2 border-gray-800'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar + botón llamar */}
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <Link to={createPageUrl(`Chat?conversationId=${conv.id}`)}>
                          <img 
                            src={avatarUrl} 
                            className="w-12 h-12 rounded-full object-cover" 
                            alt="" 
                          />
                        </Link>
                        
                        {otherUserPhone ? (
                          <a 
                            href={`tel:${otherUserPhone}`}
                            className="flex items-center gap-1 bg-purple-600/20 border border-purple-500/30 rounded-full px-2 py-0.5 hover:bg-purple-600/30 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="w-3 h-3 text-purple-400" />
                            <span className="text-purple-400 text-[10px] font-medium">Llamar</span>
                          </a>
                        ) : (
                          <div className="flex items-center gap-1 bg-gray-800/50 border border-gray-700 rounded-full px-2 py-0.5 opacity-40">
                            <Phone className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-500 text-[10px]">Sin tel.</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <Link 
                        to={createPageUrl(`Chat?conversationId=${conv.id}`)}
                        className="flex-1 min-w-0"
                      >
                        {/* Fila superior: nombre + pill + hora */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${isHighlighted ? 'text-white' : 'text-gray-300'}`}>
                            {otherUserName}
                          </span>
                          
                          {alert && (
                            <div className="flex-shrink-0 bg-purple-600/20 border border-purple-500/30 rounded-full px-2 py-0.5">
                              <span className="text-purple-400 text-xs font-medium">
                                {alert.price}€ / {alert.available_in_minutes}min
                              </span>
                            </div>
                          )}
                          
                          <span className="text-xs text-gray-500 ml-auto flex-shrink-0">
                            hace {minutesSince} minutos
                          </span>
                        </div>
                        
                        {/* Fila inferior: último mensaje */}
                        <p className={`text-sm truncate ${isHighlighted ? 'text-gray-300' : 'text-gray-500'}`}>
                          {conv.last_message_text || 'Sin mensajes'}
                        </p>
                      </Link>
                    </div>
                  </div>
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