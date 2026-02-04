import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  const conversationId = urlParams.get('conversationId') || 'demo_conv_1';
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

  // Obtener conversación simplificada
  const conversation = {
    id: conversationId,
    participant1_id: user?.id || 'user1',
    participant1_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
    participant1_photo: user?.photo_url,
    participant2_id: 'marta_id',
    participant2_name: 'Marta',
    participant2_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    alert_id: 'alert1',
    last_message_text: '',
    last_message_at: new Date().toISOString()
  };

  // Inicializar mensajes con Marta
  useEffect(() => {
    if (messages.length > 0) return;
    
    const martaMessages = [
      {
        id: 'marta1',
        conversation_id: 'demo_conv_1',
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
        conversation_id: 'demo_conv_1',
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
        conversation_id: 'demo_conv_1',
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
        conversation_id: 'demo_conv_1',
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
  }, []);

  // Auto-scroll al último mensaje
  useEffect(() => {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);



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

    // Agregar el mensaje del usuario localmente
    const userMsg = {
      id: `user_${messageIdRef.current++}`,
      conversation_id: conversationId,
      sender_id: user?.id,
      sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
      message: newMessage,
      read: true,
      message_type: 'user',
      created_date: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMsg]);
    sendMessageMutation.mutate({ text: newMessage, attachments });
    setNewMessage('');
    setAttachments([]);

    // Simular respuesta automática de Marta después de 2-3 segundos
    if (autoReplyEnabled) {
      const autoReplies = {
        'hola': ['¡Hola! ¿Cómo estás? 😊', '¡Hey! ¿Qué tal tu día?'],
        'gracias': ['¡De nada! Estoy para ayudarte 💜', 'Por supuesto, cualquier cosa que necesites'],
        'ok': ['Perfecto, te dejo el lugar listo 👍', 'Claro, sin problema'],
        'sí': ['Excelente, te espero aquí 🎉', 'Perfecto, vamos con eso'],
        'no': ['Entendido, sin problema 😊', 'Okey, no hay prisa'],
        'dónde': ['Estoy en la calle Principal, esquina con Mayor. Frente al bar "El Rincón" 📍', 'Justo aquí en la zona azul, muy fácil de encontrar'],
        'cuándo': ['Me voy en 15 minutos más o menos ⏰', 'En unos 20 minutos tengo que irme'],
        'cuánto': ['Son 3€, muy buen precio para la zona 💸', 'Son 3.50€, zona azul así que está muy bien'],
        'placa': ['Mi matrícula es 1234 BCD, Honda blanco 🚗', 'Es 1234 BCD, no tiene pérdida'],
      };

      const messageLower = newMessage.toLowerCase();
      let reply = '';
      
      for (const [keyword, replies] of Object.entries(autoReplies)) {
        if (messageLower.includes(keyword)) {
          reply = replies[Math.floor(Math.random() * replies.length)];
          break;
        }
      }

      if (!reply) {
        const genericReplies = [
          'Te entiendo perfectamente 😊',
          'Claro, totalmente de acuerdo contigo 👍',
          'Sí, tiene sentido lo que dices',
          'Buena pregunta, déjame pensar...',
          'Exacto, eso es lo que yo también pienso'
        ];
        reply = genericReplies[Math.floor(Math.random() * genericReplies.length)];
      }

      setTimeout(() => {
        const martaMsg = {
          id: `marta_${messageIdRef.current++}`,
          conversation_id: conversationId,
          sender_id: 'marta_id',
          sender_name: 'Marta',
          sender_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
          message: reply,
          read: true,
          message_type: 'user',
          created_date: new Date().toISOString()
        };
        setMessages(prev => [...prev, martaMsg]);
      }, 2000 + Math.random() * 1500);
    }
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
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden">
      <Header title="Chat" showBackButton={true} backTo="Chats" />
      
      <div className="fixed top-[56px] left-0 right-0 h-[1px] bg-purple-500/30 z-40" />
      
      <ChatHeader otherUserPhoto={otherUserPhoto} otherUserName={otherUserName} />

      {/* Foto prominente */}
      {otherUserPhoto && (
        <div className="flex justify-center py-6 px-4">
          <img src={otherUserPhoto} alt={otherUserName} className="w-32 h-32 rounded-lg border-4 border-purple-500/50 object-cover" />
        </div>
      )}

      {/* Messages */}
      <div className="messages-container flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24">
        {messages.map((msg, index) => {
          const isMine = msg.sender_id === user?.id;
          const isSystem = msg.message_type === 'system';
          const showTimestamp = index === 0 || 
            (new Date(msg.created_date).getTime() - new Date(messages[index - 1].created_date).getTime() > 300000);

          return (
            <div key={msg.id}>
              {showTimestamp && (
                <div className="text-center text-xs text-gray-500 my-2">
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
                <div className={`flex gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                  {!isMine && (
                    <img src={msg.sender_photo || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'} alt={msg.sender_name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                  )}
                  <div className={`max-w-xs ${isMine ? 'bg-purple-800 text-white' : 'bg-gray-800 text-white'} rounded-2xl px-4 py-2`}>
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
                  {isMine && (
                    <img src={user?.photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'} alt="Tú" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                  )}
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

      <div className="fixed bottom-[76px] left-0 right-0 h-[1px] bg-purple-500/30 z-40" />

      <BottomNav />
    </div>
  );
}