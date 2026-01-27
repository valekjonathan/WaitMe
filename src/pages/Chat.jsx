import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import { useAuth } from '@/lib/AuthContext';

export default function Chat() {
  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('conversationId');
  
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const queryClient = useQueryClient();
  const typingTimeoutRef = useRef(null);

  // Obtener conversación (si existe) o crear una simulada si no
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
      // Si no existe conversación, construimos un objeto de conversación simulado
      return {
        id: conversationId || 'temp_conv',
        participant1_id: user?.id || 'user1',
        participant1_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
        participant1_photo: user?.photo_url,
        participant2_id: 'user2',
        participant2_name: 'Usuario',
        participant2_photo: null,
        alert_id: conversationId || null,
        last_message_text: '',
        last_message_at: new Date().toISOString(),
        unread_count_p1: 0,
        unread_count_p2: 0
      };
    },
    enabled: !!conversationId
  });

  // Obtener alerta relacionada (para info adicional si se requiere, no fundamental para chat)
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
      return null;
    },
    enabled: !!conversation?.alert_id
  });

  // Obtener mensajes del chat (por conversation_id si existe, sino por alert_id)
  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', conversationId, conversation?.id],
    queryFn: async () => {
      if (!conversationId && !conversation?.alert_id) return [];
      try {
        // Usamos alert_id de la conversación para obtener todos los mensajes relacionados
        const msgs = await base44.entities.ChatMessage.filter({ alert_id: conversation?.alert_id || conversationId });
        // Ordenar por fecha de creación ascendente
        return msgs.sort((a, b) => new Date(a.created_date || a.created_at) - new Date(b.created_date || b.created_at));
      } catch {
        return [];
      }
    },
    enabled: !!conversation
  });

  // Mutación para enviar un mensaje nuevo
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText) => {
      if (!conversation) return;
      const isP1 = conversation.participant1_id === user?.id;
      // Crear mensaje en la base de datos
      const newMsg = {
        conversation_id: conversation.id && conversation.id !== 'temp_conv' ? conversation.id : null,
        alert_id: conversation.alert_id || null,
        sender_id: user?.email || user?.id,
        receiver_id: isP1 ? conversation.participant2_id : conversation.participant1_id,
        message: messageText,
        read: false
      };
      await base44.entities.ChatMessage.create(newMsg);
      // Si existe una conversación en BD, actualizar su last_message (en este caso, ignoramos error si no existe)
      if (conversation.id && conversation.id !== 'temp_conv') {
        try {
          await base44.entities.Conversation.update(conversation.id, {
            last_message_text: messageText,
            last_message_at: new Date().toISOString(),
            [`unread_count_${isP1 ? 'p2' : 'p1'}`]: (conversation[`unread_count_${isP1 ? 'p2' : 'p1'}`] || 0) + 1
          });
        } catch (e) {
          console.log('No conversation record to update (fallback chat).');
        }
      }
    },
    onSuccess: () => {
      // Limpiar campo de nuevo mensaje y recargar lista de mensajes
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
    }
  });

  const handleSendMessage = () => {
    const text = newMessage.trim();
    if (!text) return;
    sendMessageMutation.mutate(text);
  };

  // Manejo de indicador "escribiendo..."
  const handleTyping = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header title={conversation?.participant2_name || 'Chat'} showBackButton={true} backTo="Chats" />
      <main className="pt-[60px] pb-[70px] flex-1 flex flex-col">
        <ChatMessages messages={messages} user={user} />
        {alert && alert.allow_phone_calls && alert.phone && (
          <div className="px-4 py-2 bg-purple-900/20 flex items-center justify-between text-sm text-purple-100">
            <span>Llamar al usuario por teléfono:</span>
            <Button size="sm" onClick={() => window.location.href = `tel:${alert.phone}`} className="bg-purple-600 hover:bg-purple-700 text-white">
              {alert.phone}
            </Button>
          </div>
        )}
        <ChatInput
          newMessage={newMessage}
          setNewMessage={(text) => { setNewMessage(text); handleTyping(); }}
          attachments={attachments}
          setAttachments={setAttachments}
          onSend={handleSendMessage}
        />
      </main>
      <BottomNav />
    </div>
  );
}