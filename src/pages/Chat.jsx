import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Phone, MessageCircle, Navigation, Car, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import BottomNav from '@/components/BottomNav';

export default function Chat() {
  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('conversationId');
  
  const [user, setUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

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

  // Obtener conversación
  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      try {
        const convs = await base44.entities.Conversation.filter({ id: conversationId });
        if (convs[0]) return convs[0];
      } catch (error) {
        console.log('Error fetching conversation:', error);
      }
      
      // Mock conversación si no existe
      return {
        id: conversationId,
        participant1_id: user?.id || 'user1',
        participant1_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
        participant1_photo: user?.photo_url,
        participant2_id: 'user2',
        participant2_name: 'Laura',
        participant2_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        alert_id: 'alert1',
        last_message_text: 'Ya estoy aquí, veo tu coche. Voy a hacer la reserva 👍',
        last_message_at: new Date().toISOString(),
        unread_count_p1: 0,
        unread_count_p2: 0
      };
    },
    enabled: !!conversationId
  });

  // Obtener alerta relacionada
  const { data: alert } = useQuery({
    queryKey: ['alertInChat', conversation?.alert_id],
    queryFn: async () => {
      if (!conversation?.alert_id) return null;
      try {
        const alerts = await base44.entities.ParkingAlert.filter({ id: conversation.alert_id });
        if (alerts[0]) return alerts[0];
      } catch (error) {
        console.log('Error fetching alert:', error);
      }
      
      // Mock alerta si no existe
      return {
        id: conversation?.alert_id,
        user_name: 'Laura',
        user_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        car_brand: 'Opel',
        car_model: 'Corsa',
        car_color: 'gris',
        car_plate: '9812 GHJ',
        price: 4,
        available_in_minutes: 28,
        address: 'Paseo de la Castellana, 42',
        latitude: 40.464667,
        longitude: -3.632623,
        allow_phone_calls: true,
        phone: '+34612345678'
      };
    },
    enabled: !!conversation?.alert_id
  });

  // Obtener mensajes
  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', conversationId, conversation?.id],
    queryFn: async () => {
      if (!conversationId) return [];
      
      try {
        const msgs = await base44.entities.ChatMessage.filter({ conversation_id: conversationId });
        if (msgs.length > 0) {
          return msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        }
      } catch (error) {
        console.log('Error fetching messages:', error);
      }
      
      // Conversación simulada mejorada
      const mockMessages = [
        {
          id: 'mock1',
          conversation_id: conversationId,
          sender_id: conversation?.participant2_id || 'user2',
          sender_name: conversation?.participant2_name || 'Laura',
          message: `¡Hola! 👋 Tengo un parking disponible aquí`,
          read: true,
          message_type: 'user',
          created_date: new Date(Date.now() - 6 * 60000).toISOString()
        },
        {
          id: 'mock2',
          conversation_id: conversationId,
          sender_id: user?.id,
          sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
          message: `Perfecto! ¿Cuánto cuesta?`,
          read: true,
          message_type: 'user',
          created_date: new Date(Date.now() - 5.5 * 60000).toISOString()
        },
        {
          id: 'mock3',
          conversation_id: conversationId,
          sender_id: conversation?.participant2_id || 'user2',
          sender_name: conversation?.participant2_name || 'Laura',
          message: `Son 4€ y tengo 28 minutos antes de irme`,
          read: true,
          message_type: 'user',
          created_date: new Date(Date.now() - 5 * 60000).toISOString()
        },
        {
          id: 'mock4',
          conversation_id: conversationId,
          sender_id: user?.id,
          sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
          message: `Perfecto, estoy a 300 metros exactamente`,
          read: true,
          message_type: 'user',
          created_date: new Date(Date.now() - 4.5 * 60000).toISOString()
        },
        {
          id: 'mock5',
          conversation_id: conversationId,
          sender_id: conversation?.participant2_id || 'user2',
          sender_name: conversation?.participant2_name || 'Laura',
          message: `Mi coche es un Opel Corsa gris, matrícula 9812 GHJ. Estoy en la zona azul`,
          read: true,
          message_type: 'user',
          created_date: new Date(Date.now() - 4 * 60000).toISOString()
        },
        {
          id: 'mock6',
          conversation_id: conversationId,
          sender_id: user?.id,
          sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
          message: `Genial, ya te veo! Estoy llegando`,
          read: true,
          message_type: 'user',
          created_date: new Date(Date.now() - 2 * 60000).toISOString()
        },
        {
          id: 'mock7',
          conversation_id: conversationId,
          sender_id: conversation?.participant2_id || 'user2',
          sender_name: conversation?.participant2_name || 'Laura',
          message: `Vale, aguanto aquí! Me aviso cuando llegues`,
          read: true,
          message_type: 'user',
          created_date: new Date(Date.now() - 1.5 * 60000).toISOString()
        },
        {
          id: 'mock8',
          conversation_id: conversationId,
          sender_id: user?.id,
          sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
          message: `¡Ya! Veo tu Corsa gris 👍`,
          read: false,
          message_type: 'user',
          created_date: new Date(Date.now() - 1 * 60000).toISOString()
        }
      ];
      
      return mockMessages;
    },
    enabled: !!conversationId,
    refetchInterval: 3000
  });

  // Marcar mensajes como leídos
  useEffect(() => {
    if (!messages.length || !user?.id) return;
    
    const unreadMessages = messages.filter(m => m.receiver_id === user.id && !m.read);
    if (unreadMessages.length > 0) {
      unreadMessages.forEach(async (msg) => {
        await base44.entities.ChatMessage.update(msg.id, { read: true });
      });
      
      if (conversation) {
        const isP1 = conversation.participant1_id === user.id;
        const updateData = isP1 
          ? { unread_count_p1: 0 }
          : { unread_count_p2: 0 };
        base44.entities.Conversation.update(conversation.id, updateData);
      }
      
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  }, [messages, user?.id, conversation, queryClient]);

  // Scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enviar mensaje
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText) => {
      const otherUserId = conversation.participant1_id === user?.id 
        ? conversation.participant2_id 
        : conversation.participant1_id;
      
      await base44.entities.ChatMessage.create({
        conversation_id: conversationId,
        alert_id: conversation.alert_id,
        sender_id: user?.id,
        sender_name: user?.display_name || user?.full_name?.split(' ')[0],
        sender_photo: user?.photo_url,
        receiver_id: otherUserId,
        message: messageText,
        message_type: 'user',
        read: false
      });

      const isP1 = conversation.participant1_id === user?.id;
      await base44.entities.Conversation.update(conversationId, {
        last_message_text: messageText,
        last_message_at: new Date().toISOString(),
        [isP1 ? 'unread_count_p2' : 'unread_count_p1']: (isP1 ? conversation.unread_count_p2 : conversation.unread_count_p1) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setNewMessage('');
    }
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  const isP1 = conversation?.participant1_id === user?.id;
  const otherUserName = isP1 ? conversation?.participant2_name : conversation?.participant1_name;
  const otherUserPhoto = isP1 ? conversation?.participant2_photo : conversation?.participant1_photo;

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="bg-black/90 backdrop-blur-sm border-b border-gray-700 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <Link to={createPageUrl('Chats')}>
            <Button variant="ghost" size="icon" className="text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>

          {/* User Info */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-purple-500 bg-gray-800 flex-shrink-0">
              {otherUserPhoto ? (
                <img src={otherUserPhoto} className="w-full h-full object-cover" alt={otherUserName} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">👤</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">{otherUserName}</p>
              {alert && (
                <p className="text-xs text-gray-500 truncate">{alert.car_brand} {alert.car_model}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {alert && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className={`border-gray-700 h-8 w-8 ${alert.allow_phone_calls ? 'hover:bg-gray-800' : 'opacity-40 cursor-not-allowed'}`}
                  onClick={() => alert.allow_phone_calls && alert?.phone && (window.location.href = `tel:${alert.phone}`)}
                  disabled={!alert.allow_phone_calls}
                >
                  {alert.allow_phone_calls ?
                    <Phone className="w-4 h-4 text-green-400" /> :
                    <Phone className="w-4 h-4 text-gray-600" />
                  }
                </Button>
                <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-2 py-0.5">
                  <span className="text-purple-400 font-bold text-xs">{Math.round(alert.price)}€</span>
                </div>
              </>
            )}
          </div>

          <Link to={createPageUrl('Settings')}>
            <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        <AnimatePresence>
          {messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end gap-2 max-w-xs`}>
                  {!isMine && (
                    <div className="w-6 h-6 rounded-full bg-gray-800 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-purple-400">
                      {otherUserName ? otherUserName[0] : '?'}
                    </div>
                  )}
                  <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        isMine
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-200'
                      }`}
                    >
                      <p className="break-words">{msg.message}</p>
                    </div>
                    <span className="text-xs text-gray-500 mt-0.5 px-1">
                      {format(new Date(msg.created_date), 'HH:mm')}
                      {isMine && (
                        <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>
                      )}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <div className="bg-black/90 backdrop-blur-sm border-t border-gray-700 p-3 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Mensaje..."
            className="flex-1 bg-gray-900 border-gray-800 text-white text-sm h-9"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            type="submit"
            size="icon"
            className="bg-purple-600 hover:bg-purple-700 flex-shrink-0 h-9 w-9"
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}