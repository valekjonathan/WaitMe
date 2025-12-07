import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Phone, PhoneOff, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import BottomNav from '@/components/BottomNav';

export default function Chat() {
  const urlParams = new URLSearchParams(window.location.search);
  const alertId = urlParams.get('alertId');
  const otherUserId = urlParams.get('userId');
  
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

  // Obtener alerta para info del otro usuario
  const { data: alert } = useQuery({
    queryKey: ['alert', alertId],
    queryFn: async () => {
      const alerts = await base44.entities.ParkingAlert.filter({ id: alertId });
      return alerts[0];
    },
    enabled: !!alertId
  });

  // Obtener mensajes
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chatMessages', alertId, user?.id, otherUserId],
    queryFn: async () => {
      const allMessages = await base44.entities.ChatMessage.filter({ alert_id: alertId });
      return allMessages
        .filter(m => 
          (m.sender_id === user?.email && m.receiver_id === otherUserId) ||
          (m.sender_id === otherUserId && m.receiver_id === user?.email)
        )
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    enabled: !!alertId && !!user?.id && !!otherUserId,
    refetchInterval: 3000 // Actualizar cada 3 segundos
  });

  // Marcar como leídos
  useEffect(() => {
    const markAsRead = async () => {
      const unread = messages.filter(m => m.receiver_id === user?.email && !m.read);
      for (const msg of unread) {
        await base44.entities.ChatMessage.update(msg.id, { read: true });
      }
    };
    if (messages.length > 0 && user?.email) {
      markAsRead();
    }
  }, [messages, user?.email]);

  // Scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enviar mensaje
  const sendMutation = useMutation({
    mutationFn: async (message) => {
      const msgData = {
        alert_id: alertId,
        sender_id: user?.email || user?.id,
        sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Usuario',
        receiver_id: otherUserId,
        message: message,
        read: false
      };
      console.log('Enviando mensaje:', msgData);
      return base44.entities.ChatMessage.create(msgData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
      setNewMessage('');
    }
  });

  const handleSend = () => {
    if (newMessage.trim() && user) {
      sendMutation.mutate(newMessage.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherUserName = alert?.user_id === otherUserId 
    ? alert?.user_name 
    : alert?.reserved_by_name || 'Usuario';

  const canCall = alert?.allow_phone_calls && alert?.phone;

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="bg-black/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-4">
        <Link to={createPageUrl('Chats')}>
          <Button variant="ghost" size="icon" className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="font-medium">{otherUserName}</p>
            {alert && (
              <p className="text-xs text-gray-400">
                {alert.car_brand} {alert.car_model} • {alert.car_plate}
              </p>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={canCall ? 'text-green-400' : 'text-gray-600'}
          onClick={() => canCall && (window.location.href = `tel:${alert.phone}`)}
          disabled={!canCall}
        >
          {canCall ? (
            <Phone className="w-5 h-5" />
          ) : (
            <PhoneOff className="w-5 h-5" />
          )}
        </Button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-2">
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">
            Cargando mensajes...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Inicia la conversación</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMine = msg.sender_id === user?.email;
            const showDate = index === 0 || 
              format(new Date(msg.created_date), 'yyyy-MM-dd') !== 
              format(new Date(messages[index - 1].created_date), 'yyyy-MM-dd');

            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="text-center text-gray-500 text-xs py-2">
                    {format(new Date(msg.created_date), "d 'de' MMMM", { locale: es })}
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      isMine
                        ? 'bg-purple-600 text-white rounded-br-md'
                        : 'bg-gray-800 text-white rounded-bl-md'
                    }`}
                  >
                    <p className="break-words">{msg.message}</p>
                    <p className={`text-xs mt-1 ${isMine ? 'text-purple-200' : 'text-gray-500'}`}>
                      {format(new Date(msg.created_date), 'HH:mm')}
                    </p>
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-4 bg-black pb-6">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje..."
            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 rounded-full"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMutation.isPending || !user}
            className="bg-purple-600 hover:bg-purple-700 rounded-full w-12 h-10"
          >
            {sendMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}