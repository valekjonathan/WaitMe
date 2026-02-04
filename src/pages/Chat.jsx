import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Send, ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import BottomNav from '@/components/BottomNav';

export default function Chat() {
  const [user, setUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('conversationId');
  const alertId = urlParams.get('alertId');
  const userId = urlParams.get('userId');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Cargar mensajes
  const { data: loadedMessages = [] } = useQuery({
    queryKey: ['chatMessages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const msgs = await base44.entities.ChatMessage.filter(
        { conversation_id: conversationId },
        'created_date'
      );
      return msgs;
    },
    enabled: !!conversationId,
    refetchInterval: 3000
  });

  // Cargar conversación
  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const convs = await base44.entities.Conversation.filter({ id: conversationId });
      return convs[0] || null;
    },
    enabled: !!conversationId
  });

  // Cargar alerta
  const { data: alert } = useQuery({
    queryKey: ['alert', alertId],
    queryFn: async () => {
      if (!alertId) return null;
      const alerts = await base44.entities.ParkingAlert.filter({ id: alertId });
      return alerts[0] || null;
    },
    enabled: !!alertId
  });

  useEffect(() => {
    if (loadedMessages.length > 0) {
      setMessages(loadedMessages);
    }
  }, [loadedMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;

    const tempMsg = {
      id: `temp_${Date.now()}`,
      sender_id: user?.id,
      sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
      sender_photo: user?.photo_url,
      message: newMessage,
      created_date: new Date().toISOString(),
      message_type: 'user'
    };

    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');

    if (conversationId) {
      const otherUserId = conversation?.participant1_id === user?.id 
        ? conversation?.participant2_id 
        : conversation?.participant1_id;

      await base44.entities.ChatMessage.create({
        conversation_id: conversationId,
        alert_id: alertId || conversation?.alert_id,
        sender_id: user?.id,
        sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
        sender_photo: user?.photo_url,
        receiver_id: otherUserId,
        message: newMessage,
        message_type: 'user',
        read: false
      });

      await base44.entities.Conversation.update(conversationId, {
        last_message_text: newMessage,
        last_message_at: new Date().toISOString()
      });
    }
  };

  const isP1 = conversation?.participant1_id === user?.id;
  const otherUserName = isP1 ? conversation?.participant2_name : conversation?.participant1_name;
  const otherUserPhoto = isP1 ? conversation?.participant2_photo : conversation?.participant1_photo;

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col">
      {/* Header del chat */}
      <div className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 z-50 h-14">
        <div className="flex items-center justify-between h-full px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.href = createPageUrl('Chats')}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-3">
            <img
              src={otherUserPhoto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'}
              alt={otherUserName}
              className="w-9 h-9 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-sm">{otherUserName || 'Usuario'}</p>
              <p className="text-xs text-green-400">En línea</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {alert?.allow_phone_calls && alert?.phone && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.location.href = `tel:${alert.phone}`}
                className="text-white hover:bg-gray-800"
              >
                <Phone className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div className="fixed top-14 bottom-[140px] left-0 right-0 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {messages.map((msg, index) => {
            const isMine = msg.sender_id === user?.id;
            const showTimestamp = index === 0 || 
              (new Date(msg.created_date).getTime() - new Date(messages[index - 1]?.created_date).getTime() > 300000);

            return (
              <div key={msg.id}>
                {showTimestamp && (
                  <div className="text-center text-xs text-gray-500 my-2">
                    {format(new Date(msg.created_date), "d 'de' MMMM - HH:mm", { locale: es })}
                  </div>
                )}
                
                {msg.message_type === 'system' ? (
                  <div className="flex justify-center">
                    <div className="bg-gray-800/50 rounded-xl px-3 py-1.5 text-xs text-gray-400">
                      {msg.message}
                    </div>
                  </div>
                ) : (
                  <div className={`flex gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    {!isMine && (
                      <img
                        src={msg.sender_photo || otherUserPhoto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'}
                        alt={msg.sender_name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                    <div className={`max-w-[70%] ${isMine ? 'bg-purple-600' : 'bg-gray-800'} rounded-2xl px-4 py-2`}>
                      <p className="text-sm break-words">{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? 'text-purple-200' : 'text-gray-500'}`}>
                        {format(new Date(msg.created_date), 'HH:mm')}
                      </p>
                    </div>
                    {isMine && (
                      <img
                        src={user?.photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'}
                        alt="Tú"
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input de mensaje */}
      <div className="fixed bottom-[76px] left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-3">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim()}
            className="bg-purple-600 hover:bg-purple-700 rounded-full w-10 h-10 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}