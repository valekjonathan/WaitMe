import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, User, MapPin, Clock, Euro, Phone, MessageCircle, Navigation, Car, Paperclip, X, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
        
        // Si hay mensajes, devolverlos ordenados
        if (msgs.length > 0) {
          return msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        }
      } catch (error) {
        console.log('Error fetching messages:', error);
      }
      
      // Si no hay mensajes, crear conversación simulada
      const mockMessages = [
        {
          id: 'mock1',
          conversation_id: conversationId,
          sender_id: conversation?.participant2_id || 'user2',
          sender_name: conversation?.participant2_name || 'Laura',
          message: `¡Hola! Vi tu anuncio de búsqueda de parking`,
          read: true,
          message_type: 'user',
          created_date: new Date(Date.now() - 5 * 60000).toISOString()
        },
        {
          id: 'mock2',
          conversation_id: conversationId,
          sender_id: user?.id,
          sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
          message: `¡Hola! Sí, necesito un parking por aquí urgentemente`,
          read: true,
          message_type: 'user',
          created_date: new Date(Date.now() - 4 * 60000).toISOString()
        },
        {
          id: 'mock3',
          conversation_id: conversationId,
          sender_id: conversation?.participant2_id || 'user2',
          sender_name: conversation?.participant2_name || 'Laura',
          message: `Perfecto, tengo uno disponible en Paseo de la Castellana. Son 4€ y me voy en 28 minutos`,
          read: true,
          message_type: 'user',
          created_date: new Date(Date.now() - 3.5 * 60000).toISOString()
        },
        {
          id: 'mock4',
          conversation_id: conversationId,
          sender_id: user?.id,
          sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
          message: `Genial, ¿cuál es exactamente la dirección?`,
          read: true,
          message_type: 'user',
          created_date: new Date(Date.now() - 3 * 60000).toISOString()
        },
        {
          id: 'mock5',
          conversation_id: conversationId,
          sender_id: conversation?.participant2_id || 'user2',
          sender_name: conversation?.participant2_name || 'Laura',
          message: `Paseo de la Castellana, 42, zona azul. Mi coche es un Opel Corsa gris, matrícula 9812 GHJ`,
          read: true,
          message_type: 'user',
          created_date: new Date(Date.now() - 2.5 * 60000).toISOString()
        },
        {
          id: 'mock6',
          conversation_id: conversationId,
          sender_id: user?.id,
          sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
          message: `Perfecto, estoy a 250 metros. Llego en 3 minutos`,
          read: true,
          message_type: 'user',
          created_date: new Date(Date.now() - 2 * 60000).toISOString()
        },
        {
          id: 'mock7',
          conversation_id: conversationId,
          sender_id: conversation?.participant2_id || 'user2',
          sender_name: conversation?.participant2_name || 'Laura',
          message: `Vale, aguanto aquí. Avísame cuando llegues`,
          read: true,
          message_type: 'user',
          created_date: new Date(Date.now() - 1.5 * 60000).toISOString()
        },
        {
          id: 'mock8',
          conversation_id: conversationId,
          sender_id: user?.id,
          sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
          message: `Ya estoy aquí, veo tu coche. Voy a hacer la reserva 👍`,
          read: false,
          message_type: 'user',
          created_date: new Date(Date.now() - 30000).toISOString()
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
      
      // Actualizar contador en conversación
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
      if (!conversation || !user?.id) {
        throw new Error('Conversation o user no disponibles');
      }

      const otherUserId = conversation.participant1_id === user?.id 
        ? conversation.participant2_id 
        : conversation.participant1_id;
      
      const newMsg = {
        conversation_id: conversationId,
        alert_id: conversation.alert_id,
        sender_id: user?.id,
        sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
        sender_photo: user?.photo_url,
        receiver_id: otherUserId,
        message: messageText,
        message_type: 'user',
        read: false
      };

      await base44.entities.ChatMessage.create(newMsg);

      const isP1 = conversation.participant1_id === user?.id;
      await base44.entities.Conversation.update(conversation.id, {
        last_message_text: messageText,
        last_message_at: new Date().toISOString(),
        [isP1 ? 'unread_count_p2' : 'unread_count_p1']: (isP1 ? conversation.unread_count_p2 : conversation.unread_count_p1) + 1
      });
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['chatMessages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      console.error('Error enviando mensaje:', error);
    }
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (!conversation || !user?.id) {
      console.error('Conversation o user no disponibles');
      return;
    }
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

  // Calcular distancia
  const calculateDistance = () => {
    if (!user?.user_location || !alert?.latitude || !alert?.longitude) return null;
    
    const userLat = user.user_location?.latitude;
    const userLon = user.user_location?.longitude;
    
    if (!userLat || !userLon) return null;

    const R = 6371;
    const dLat = (alert.latitude - userLat) * Math.PI / 180;
    const dLon = (alert.longitude - userLon) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLat * Math.PI / 180) * Math.cos(alert.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;
    
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
  };

  const distance = calculateDistance();

  const formatPlate = (plate) => {
    if (!plate) return 'XXXX XXX';
    const cleaned = plate.replace(/\s/g, '').toUpperCase();
    if (cleaned.length >= 4) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    }
    return cleaned;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-700 px-4 py-3 overflow-y-auto max-h-screen">
        <Link to={createPageUrl('Chats')} className="mb-3">
          <Button variant="ghost" size="icon" className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>

        {/* User Card */}
        {alert && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-2.5 border-2 border-purple-500 flex flex-col">
            {/* Header con nombre y botones distancia + precio */}
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-[13px] text-purple-400">Info del usuario:</p>
            </div>

            {/* User info and car */}
            <div className="flex gap-2.5 mb-1.5">
              <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500 bg-gray-800 flex-shrink-0">
                {otherUserPhoto ? (
                  <img src={otherUserPhoto} className="w-full h-full object-cover" alt={otherUserName} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-gray-500">👤</div>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2 w-full">
                  <p className="font-bold text-xl text-white truncate">{otherUserName}</p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {distance && (
                      <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-purple-400" />
                        <span className="text-white font-bold text-xs whitespace-nowrap">{distance}</span>
                      </div>
                    )}
                    <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1">
                      <span className="text-purple-400 font-bold text-xs whitespace-nowrap">{Math.round(alert.price)}€</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-sm font-medium text-white">{alert.car_brand} {alert.car_model}</p>
                  <Car className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>

                {/* Placa */}
                <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-8">
                  <div className="bg-blue-600 h-full w-6 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">E</span>
                  </div>
                  <span className="flex-1 text-center font-mono font-bold text-base tracking-wider text-black">
                    {formatPlate(alert.car_plate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Address and time info */}
            <div className="space-y-1.5 pt-1.5 border-t border-gray-700">
              {alert.address && (
                <div className="flex items-start gap-1.5 text-gray-400 text-xs">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{alert.address}</span>
                </div>
              )}
              
              {alert.available_in_minutes !== undefined && (
                <div className="flex items-center gap-1 text-gray-500 text-[10px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Se va en {alert.available_in_minutes} min</span>
                  <span className="text-purple-400">
                    • Te espera hasta las {format(new Date(new Date().getTime() + alert.available_in_minutes * 60000), 'HH:mm', { locale: es })}
                  </span>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-2 mt-4">
                <Button
                  size="icon"
                  className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-8 w-[42px]"
                  disabled
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  className={`border-gray-700 h-8 w-[42px] ${alert.allow_phone_calls ? 'hover:bg-gray-800' : 'opacity-40 cursor-not-allowed'}`}
                  onClick={() => alert.allow_phone_calls && alert?.phone && (window.location.href = `tel:${alert.phone}`)}
                  disabled={!alert.allow_phone_calls}
                >
                  {alert.allow_phone_calls ?
                    <Phone className="w-4 h-4 text-green-400" /> :
                    <Phone className="w-4 h-4 text-gray-600" />
                  }
                </Button>

                <Button className="bg-purple-600 text-white ml-2 px-4 py-2 text-sm font-semibold rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow hover:bg-purple-700 h-8 flex-1"
                  disabled>
                  WaitMe!
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Messages */}
      <main className="flex-1 pt-80 pb-20 px-4 overflow-y-auto">
        <div className="mb-4 mt-2 p-4 bg-purple-600/20 border border-purple-500 rounded-lg">
          <p className="text-base text-purple-300 font-bold">Ultimos mensajes:</p>
        </div>
        <AnimatePresence>
          {messages.map((msg, index) => {
            const isMine = msg.sender_id === user?.id;
            const isSystem = msg.message_type === 'system';
            const showTimestamp = index === 0 || 
              (new Date(msg.created_date).getTime() - new Date(messages[index - 1].created_date).getTime() > 300000);

            return (
              <div key={msg.id}>
                {showTimestamp && (
                  <div className="text-center text-xs text-gray-500 my-4">
                    {format(new Date(msg.created_date), "d 'de' MMMM, HH:mm", { locale: es })}
                  </div>
                )}

                {isSystem ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center my-4"
                  >
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-400 max-w-xs text-center">
                      {msg.message}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: isMine ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] ${isMine ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isMine
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-white'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.message}</p>
                      </div>
                      <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <span>{format(new Date(msg.created_date), 'HH:mm')}</span>
                        {isMine && (
                          <span>{msg.read ? '✓✓' : '✓'}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <div className="fixed bottom-24 left-0 right-0 bg-black/90 backdrop-blur-sm border-t-2 border-gray-700 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-gray-900 border-gray-800 text-white"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            type="submit"
            size="icon"
            className="bg-purple-600 hover:bg-purple-700 flex-shrink-0"
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}