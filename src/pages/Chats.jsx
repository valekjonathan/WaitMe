import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Chats() {
  const [user, setUser] = useState(null);

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

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['myChats', user?.id],
    queryFn: async () => {
      // Obtener todos los mensajes donde soy emisor o receptor
      const [sent, received] = await Promise.all([
        base44.entities.ChatMessage.filter({ sender_id: user?.id }),
        base44.entities.ChatMessage.filter({ receiver_id: user?.id })
      ]);
      return [...sent, ...received];
    },
    enabled: !!user?.id
  });

  // Agrupar mensajes por conversación (alert_id + otro usuario)
  const conversations = React.useMemo(() => {
    const convMap = new Map();
    
    messages.forEach(msg => {
      const otherUserId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id;
      const otherUserName = msg.sender_id === user?.id ? 'Usuario' : msg.sender_name;
      const key = `${msg.alert_id}-${otherUserId}`;
      
      if (!convMap.has(key)) {
        convMap.set(key, {
          alertId: msg.alert_id,
          otherUserId,
          otherUserName,
          lastMessage: msg,
          unread: 0
        });
      } else {
        const existing = convMap.get(key);
        if (new Date(msg.created_date) > new Date(existing.lastMessage.created_date)) {
          existing.lastMessage = msg;
        }
      }
      
      // Contar no leídos
      if (msg.receiver_id === user?.id && !msg.read) {
        convMap.get(key).unread++;
      }
    });
    
    return Array.from(convMap.values()).sort((a, b) => 
      new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date)
    );
  }, [messages, user?.id]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="text-white">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Mensajes</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="pt-16 pb-8">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">
            Cargando conversaciones...
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">Sin conversaciones</p>
            <p className="text-sm">Cuando reserves o alguien reserve tu plaza, podrás chatear aquí</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {conversations.map((conv, index) => (
              <motion.div
                key={`${conv.alertId}-${conv.otherUserId}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={createPageUrl(`Chat?alertId=${conv.alertId}&userId=${conv.otherUserId}`)}
                  className="flex items-center gap-4 px-4 py-4 hover:bg-gray-900/50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-gray-500" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{conv.otherUserName}</span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(conv.lastMessage.created_date), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {conv.lastMessage.sender_id === user?.id && (
                        <span className="text-gray-500">Tú: </span>
                      )}
                      {conv.lastMessage.message}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {conv.unread > 0 && (
                    <Badge className="bg-purple-600 text-white min-w-[24px] h-6 flex items-center justify-center">
                      {conv.unread}
                    </Badge>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}