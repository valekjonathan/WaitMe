import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import ChatHeader from '@/components/chat/ChatHeader';

export default function Chat() {
  const [user, setUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [messages, setMessages] = useState([]);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const queryClient = useQueryClient();
  const messageIdRef = useRef(1000);

  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('conversationId');
  const isDemo = urlParams.get('demo') === 'true';
  const demoUserName = urlParams.get('userName');
  const demoUserPhoto = urlParams.get('userPhoto');
  const demoAlertId = urlParams.get('alertId');
  const justReserved = urlParams.get('justReserved') === 'true';

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
    queryKey: ['conversation', conversationId, isDemo],
    queryFn: async () => {
      if (!conversationId) return null;
      
      // Si es demo, retornar conversación demo directamente
      if (isDemo) {
        return {
          id: conversationId,
          participant1_id: user?.id || 'user1',
          participant1_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
          participant1_photo: user?.photo_url,
          participant2_id: 'demo_user',
          participant2_name: demoUserName || 'Usuario Demo',
          participant2_photo: decodeURIComponent(demoUserPhoto || ''),
          alert_id: demoAlertId,
          last_message_text: 'Conversación demo',
          last_message_at: new Date().toISOString(),
          unread_count_p1: 0,
          unread_count_p2: 0
        };
      }
      
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

  // Inicializar mensajes con Marta
  useEffect(() => {
    if (!conversationId || messages.length > 0) return;
    
    const martaMessages = [
      {
        id: 'marta1',
        conversation_id: conversationId,
        sender_id: 'marta_id',
        sender_name: 'Marta',
        sender_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        message: `¡Hola! He visto que buscas parking en la zona 🚗`,
        read: true,
        message_type: 'user',
        created_date: new Date(Date.now() - 15 * 60000).toISOString()
      },
      {
        id: 'marta2',
        conversation_id: conversationId,
        sender_id: 'marta_id',
        sender_name: 'Marta',
        sender_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        message: `Tengo un sitio perfecto en la calle Principal, zona azul 💜`,
        read: true,
        message_type: 'user',
        created_date: new Date(Date.now() - 14 * 60000).toISOString()
      },
      {
        id: 'marta3',
        conversation_id: conversationId,
        sender_id: 'marta_id',
        sender_name: 'Marta',
        sender_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        message: `Mi coche es un Honda Civic blanco, me voy en 20 minutos. ¿Te interesa?`,
        read: true,
        message_type: 'user',
        created_date: new Date(Date.now() - 13 * 60000).toISOString()
      },
      {
        id: 'marta4',
        conversation_id: conversationId,
        sender_id: 'marta_id',
        sender_name: 'Marta',
        sender_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        message: `Son 3€, es muy buen precio para la zona 😊`,
        read: true,
        message_type: 'user',
        created_date: new Date(Date.now() - 12 * 60000).toISOString()
      }
    ];
    
    setMessages(martaMessages);
  }, [conversationId]);

  // Marcar mensajes como leídos
  useEffect(() => {
    if (!messages.length || !user?.id || isDemo) return;
    
    const unreadMessages = messages.filter(m => m.receiver_id === user.id && !m.read);
    if (unreadMessages.length > 0) {
      Promise.all(unreadMessages.map(msg => base44.entities.ChatMessage.update(msg.id, { read: true }))).then(() => {
        if (conversation) {
          const isP1 = conversation.participant1_id === user.id;
          base44.entities.Conversation.update(conversation.id, isP1 ? { unread_count_p1: 0 } : { unread_count_p2: 0 });
        }
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      });
    }
  }, [messages, user?.id, conversation, queryClient, isDemo]);



  // Enviar mensaje
  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      if (!conversation || !user?.id) {
        throw new Error('Conversation o user no disponibles');
      }
      
      // Si es demo, solo simular
      if (isDemo) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { demo: true };
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
        message: data.text,
        attachments: data.attachments.length > 0 ? JSON.stringify(data.attachments) : null,
        message_type: 'user',
        read: false
      };

      await base44.entities.ChatMessage.create(newMsg);

      const isP1 = conversation.participant1_id === user?.id;
      await base44.entities.Conversation.update(conversation.id, {
        last_message_text: data.text || `📎 ${data.attachments.length} archivo(s)`,
        last_message_at: new Date().toISOString(),
        [isP1 ? 'unread_count_p2' : 'unread_count_p1']: (isP1 ? conversation.unread_count_p2 : conversation.unread_count_p1) + 1
      });
    },
    onSuccess: () => {
      setNewMessage('');
      setAttachments([]);
      if (!isDemo) {
        queryClient.invalidateQueries({ queryKey: ['chatMessages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },
    onError: (error) => {
      console.error('Error enviando mensaje:', error);
    }
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!conversation || !user?.id) {
      console.error('Conversation o user no disponibles');
      return;
    }
    sendMessageMutation.mutate({ text: newMessage, attachments });
    setAttachments([]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo es demasiado grande (máx. 10MB)');
        continue;
      }
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setAttachments(prev => [...prev, { name: file.name, type: file.type, url: file_url }]);
      } catch (error) {
        console.error('Error subiendo archivo:', error);
      }
    }
  };



  const handleTyping = () => {
    setIsTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
  };

  const isP1 = conversation?.participant1_id === user?.id;
  const otherUserName = isP1 ? conversation?.participant2_name : conversation?.participant1_name;
  const otherUserPhoto = isP1 ? conversation?.participant2_photo : conversation?.participant1_photo;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-20">
      <Header title="Chat" showBackButton={true} backTo="Chats" />
      
      <ChatHeader otherUserPhoto={otherUserPhoto} otherUserName={otherUserName} />

      {/* Foto prominente */}
      {otherUserPhoto && (
        <div className="flex justify-center py-6 px-4">
          <img src={otherUserPhoto} alt={otherUserName} className="w-32 h-32 rounded-full border-4 border-purple-500/50 object-cover" />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, index) => {
          const isMine = msg.sender_id === user?.id;
          const isSystem = msg.message_type === 'system';
          const showTimestamp = index === 0 || 
            (new Date(msg.created_date).getTime() - new Date(messages[index - 1].created_date).getTime() > 300000);

          return (
            <div key={msg.id}>
              {showTimestamp && (
                <div className="text-center text-xs text-gray-500 my-3">
                  {format(new Date(msg.created_date), "d 'Ene' - HH:mm", { locale: es })}
                </div>
              )}
              
              {isSystem ? (
                <div className="flex justify-center">
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2 text-xs text-gray-400 text-center">
                    {msg.message}
                  </div>
                </div>
              ) : (
                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs ${isMine ? 'bg-purple-600 text-white' : 'bg-gray-800 text-white'} rounded-2xl px-4 py-2`}>
                    <p className="text-sm break-words">{msg.message}</p>
                    {msg.attachments && JSON.parse(msg.attachments).map((att, idx) => (
                      <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="block mt-2">
                        {att.type.includes('image') ? (
                          <img src={att.url} alt={att.name} className="max-w-[120px] rounded" />
                        ) : (
                          <div className="text-xs flex items-center gap-1">📎 {att.name}</div>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-gray-700/80 bg-gray-800/50 flex gap-2 flex-shrink-0 relative z-10">
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
        />
        <input
          type="file"
          ref={galleryInputRef}
          accept="image/*"
          className="hidden"
        />
        <div className="relative">
          <Button
            size="icon"
            variant="ghost"
            className="text-purple-400 hover:text-purple-300 flex-shrink-0"
            onClick={() => setShowMediaMenu(!showMediaMenu)}
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          {showMediaMenu && (
            <div className="absolute bottom-12 left-0 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden z-50">
              <button
                onClick={() => {
                  cameraInputRef.current?.click();
                  setShowMediaMenu(false);
                }}
                className="w-full px-4 py-2 text-sm text-white hover:bg-gray-700 flex items-center gap-2 whitespace-nowrap"
              >
                📷 Hacer foto
              </button>
              <button
                onClick={() => {
                  galleryInputRef.current?.click();
                  setShowMediaMenu(false);
                }}
                className="w-full px-4 py-2 text-sm text-white hover:bg-gray-700 flex items-center gap-2 whitespace-nowrap border-t border-gray-700"
              >
                🖼️ Subir foto
              </button>
            </div>
          )}
        </div>
        <input
          value={newMessage}
          onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
          onKeyPress={handleKeyPress}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-purple-900/30 border-2 border-purple-600/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 focus:border-2"
          disabled={sendMessageMutation.isPending}
        />
        <Button
          size="icon"
          onClick={handleSendMessage}
          disabled={(!newMessage.trim() && attachments.length === 0) || sendMessageMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0 h-10 px-5"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}