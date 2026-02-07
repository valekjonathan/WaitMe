import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, Paperclip, Camera, Image as ImageIcon, ArrowLeft, Phone, MoreVertical, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { startDemoFlow, subscribeDemoFlow, getDemoConversation, getDemoMessages, markDemoRead, sendDemoMessage, demoFlow } from '@/lib/demoFlow';

export default function Chat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('conversationId');
  const alertId = urlParams.get('alertId');
  const userId = urlParams.get('userId');
  // Activar modo demo si no hay conversación real
  const isDemo = !conversationId || urlParams.get('demo') === 'true';

  // ======================
  // Demo: estado en memoria (sin cargas)
  // ======================
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!isDemo) return;
    startDemoFlow();
    const unsub = subscribeDemoFlow(() => forceTick((x) => x + 1));
    return () => unsub?.();
  }, [isDemo]);

  const demoSt = isDemo ? demoFlow() : null;

  // Si no viene conversationId en demo, abrimos la primera conversación disponible
  const demoConversationId = isDemo ? (conversationId || demoSt?.conversations?.[0]?.id || null) : null;
  const demoConversation = isDemo ? getDemoConversation(demoConversationId) : null;
  const demoConv = demoConversation;
  const demoMessages = isDemo ? getDemoMessages(demoConversationId) : null;
  const demoOtherUser = isDemo && demoConv ? demoSt?.users?.[demoConv.otherUserId] : null;

  useEffect(() => {
    if (!isDemo) return;
    if (!demoConversationId) return;
    markDemoRead(demoConversationId);
  }, [isDemo, demoConversationId]);



  // Usuario actual
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
    enabled: !isDemo
  });

  // Conversación
  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    enabled: !!conversationId && !isDemo && !isDemo,
    queryFn: async () => {
      const conv = await base44.entities.Conversation.filter({ id: conversationId });
      return conv?.[0] || null;
    },
    staleTime: 30000
  });

  // Mensajes
  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', conversationId],
    enabled: !!conversationId && !isDemo,
    queryFn: async () => {
      const msgs = await base44.entities.ChatMessage.filter({ 
        conversation_id: conversationId 
      });
      return (msgs || []).sort((a, b) => 
        new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
      );
    },
    staleTime: 10000
  });

  // Demo: mensajes de Marta
  const [demoMessages, setDemoMessages] = useState([]);
  
  useEffect(() => {
    if (isDemo) {
      const now = Date.now();
      setDemoMessages([
        {
          id: '1',
          sender_id: 'marta',
          sender_name: 'Marta',
          sender_photo: 'https://randomuser.me/api/portraits/women/65.jpg',
          message: '¡Hola! He visto que buscas parking 🚗',
          created_date: new Date(now - 300000).toISOString()
        },
        {
          id: '2',
          sender_id: 'marta',
          sender_name: 'Marta',
          sender_photo: 'https://randomuser.me/api/portraits/women/65.jpg',
          message: 'Tengo un sitio perfecto en la calle Principal 💜',
          created_date: new Date(now - 240000).toISOString()
        },
        {
          id: '3',
          sender_id: 'marta',
          sender_name: 'Marta',
          sender_photo: 'https://randomuser.me/api/portraits/women/65.jpg',
          message: 'Me voy en 20 minutos. ¿Te interesa? Son 3€',
          created_date: new Date(now - 180000).toISOString()
        },
        {
          id: '4',
          sender_id: user?.id || 'you',
          sender_name: user?.display_name || 'Tú',
          sender_photo: user?.photo_url,
          message: '¡Me interesa! ¿Dónde exactamente?',
          created_date: new Date(now - 170000).toISOString()
        },
        {
          id: '5',
          sender_id: 'marta',
          sender_name: 'Marta',
          sender_photo: 'https://randomuser.me/api/portraits/women/65.jpg',
          message: 'En Calle Gran Vía, número 25. Es justo al lado del banco 🏦',
          created_date: new Date(now - 160000).toISOString()
        },
        {
          id: '6',
          sender_id: user?.id || 'you',
          sender_name: user?.display_name || 'Tú',
          sender_photo: user?.photo_url,
          message: 'Perfecto, voy para allá ahora mismo',
          created_date: new Date(now - 150000).toISOString()
        },
        {
          id: '7',
          sender_id: 'marta',
          sender_name: 'Marta',
          sender_photo: 'https://randomuser.me/api/portraits/women/65.jpg',
          message: '¡Genial! Te espero 😊',
          created_date: new Date(now - 140000).toISOString()
        }
      ]);
    }
  }, [isDemo, user]);

  const displayMessages = isDemo
    ? (demoMessages || []).map((m) => ({
        id: m.id,
        sender_id: m.senderId,
        sender_name: m.senderName,
        sender_photo: m.senderPhoto,
        message: m.text,
        created_date: new Date(m.ts).toISOString(),
        read: true,
        message_type: m.kind === 'system' ? 'system' : 'user'
      }))
    : messages;

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  // Suscripción en tiempo real
  useEffect(() => {
    if (!conversationId || isDemo) return;

    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.conversation_id === conversationId) {
        queryClient.invalidateQueries({ queryKey: ['chatMessages', conversationId] });
      }
    });

    return () => unsubscribe?.();
  }, [conversationId, isDemo, queryClient]);

  // Datos a renderizar (demo o real)
  const activeConversation = isDemo ? demoConv : conversation;
  const activeMessages = isDemo ? (demoMessages || []) : (messages || []);
  const activeOtherUser = isDemo
    ? demoOtherUser
    : (() => {
        const otherId =
          conversation?.participant1_id === user?.id ? conversation?.participant2_id : conversation?.participant1_id;
        return otherId ? null : null;
      })();

  // Enviar mensaje
  const sendMutation = useMutation({
    mutationFn: async (text) => {
      if (isDemo) {
        const clean = String(text || '').trim();
        if (!clean) return;
        if (conversationId) {
          if (demoConversationId) sendDemoMessage(demoConversationId, clean);
        }
        return;
      }

      // Real: crear mensaje
      const otherUserId = conversation?.participant1_id === user?.id 
        ? conversation?.participant2_id 
        : conversation?.participant1_id;

      await base44.entities.ChatMessage.create({
        conversation_id: conversationId,
        alert_id: alertId,
        sender_id: user?.id,
        sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Usuario',
        sender_photo: user?.photo_url,
        receiver_id: otherUserId,
        message: text,
        read: false,
        message_type: 'user'
      });

      // Actualizar conversación
      await base44.entities.Conversation.update(conversation.id, {
        last_message_text: text,
        last_message_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      setMessage('');
      setAttachments([]);
      if (!isDemo) {
        queryClient.invalidateQueries({ queryKey: ['chatMessages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    }
  });

  const handleSend = () => {
    if (!message.trim() && attachments.length === 0) return;

    if (isDemo) {
      // En demo, enviamos al motor local y generamos respuesta automática
      if (demoConversationId) {
        sendDemoMessage(demoConversationId, message, attachments);
      }
      setMessage('');
      setAttachments([]);
      setShowAttachMenu(false);
      return;
    }

    sendMutation.mutate(message);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Archivo muy grande (máx 10MB)');
        continue;
      }
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setAttachments(prev => [...prev, { url: file_url, type: file.type, name: file.name }]);
      } catch (err) {
        console.error('Error subiendo archivo:', err);
      }
    }
    setShowAttachMenu(false);
  };

  // Datos del otro usuario
  const isP1 = conversation?.participant1_id === user?.id;
  const otherUser = isDemo
    ? { name: demoOtherUser?.name || demoConversation?.other_name || 'Usuario', photo: demoOtherUser?.photo || demoConversation?.other_photo || null }
    : {
        name: isP1 ? conversation?.participant2_name : conversation?.participant1_name,
        photo: isP1 ? conversation?.participant2_photo : conversation?.participant1_photo
      };

  // Mensajes a renderizar (demo o real)
  const renderMessages = isDemo ? (demoMessages || demoConversation?.messages || []) : (messages || []);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header title="Chat" showBackButton={true} backTo="Chats" />

      {/* Info del usuario */}
      <div className="fixed top-[56px] left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-purple-500/50 flex-shrink-0">
            {otherUser?.photo ? (
              <img 
                src={otherUser.photo} 
                alt={otherUser.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xl">
                👤
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold truncate">
              {otherUser?.name || 'Usuario'}
            </h2>
            <p className="text-xs text-gray-400">En línea</p>
          </div>

          <div className="bg-purple-600/20 border border-purple-500/40 rounded-lg p-2 hover:bg-purple-600/30 cursor-pointer transition-colors">
            <Phone className="w-5 h-5 text-purple-300" />
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto pt-[128px] pb-[160px] px-4">
        <div className="max-w-3xl mx-auto space-y-4 py-4">
          {displayMessages.map((msg, idx) => {
            const isMine = msg.sender_id === user?.id || msg.sender_id === 'you';
            const showDate = idx === 0 || 
              (new Date(msg.created_date).getTime() - new Date(displayMessages[idx - 1].created_date).getTime() > 300000);

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <div className="bg-gray-800/80 rounded-full px-4 py-1 text-xs text-gray-400">
                      {new Date(msg.created_date).toLocaleString('es-ES', {
                        timeZone: 'Europe/Madrid',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      }).replace(' de ', ' ').replace(',', ' -')}
                    </div>
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 w-full ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMine && (
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-purple-500/30">
                      <img 
                        src={msg.sender_photo || 'https://via.placeholder.com/32'} 
                        alt={msg.sender_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                    <div 
                      className={`rounded-2xl px-4 py-2 ${
                        isMine 
                          ? 'bg-purple-600 text-white rounded-br-sm max-w-[280px]' 
                          : 'bg-gray-800 text-white rounded-bl-sm max-w-[280px]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-[10px] ${isMine ? 'text-purple-200' : 'text-gray-400'}`}>
                          {format(new Date(msg.created_date), 'HH:mm')}
                        </span>
                        {isMine && (
                          <div className="relative w-4 h-3">
                            <Check className="w-3 h-3 text-blue-400 absolute top-0 left-0" strokeWidth={2.5} />
                            <Check className="w-3 h-3 text-blue-400 absolute top-0 left-1.5" strokeWidth={2.5} />
                          </div>
                        )}
                      </div>

                      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                        {msg.message}
                      </p>
                      
                      {msg.attachments && JSON.parse(msg.attachments).map((att, i) => (
                        <div key={i} className="mt-2">
                          {att.type?.includes('image') ? (
                            <img 
                              src={att.url} 
                              alt="Adjunto" 
                              className="rounded-lg max-w-[200px]"
                            />
                          ) : (
                            <a 
                              href={att.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs underline"
                            >
                              📎 {att.name}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {isMine && (
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-purple-500/30">
                      {user?.photo_url ? (
                        <img 
                          src={user.photo_url} 
                          alt="Tú"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-purple-700 flex items-center justify-center text-lg">
                          👤
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 pb-20">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {attachments.length > 0 && (
            <div className="mb-2 flex gap-2">
              {attachments.map((att, i) => (
                <div key={i} className="relative">
                  {att.type.includes('image') ? (
                    <img src={att.url} alt="" className="w-16 h-16 rounded object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-800 rounded flex items-center justify-center text-xs">
                      📄
                    </div>
                  )}
                  <button
                    onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="text-purple-400 hover:bg-gray-800 rounded-md"
              >
                <Paperclip className="w-5 h-5" />
              </Button>

                <AnimatePresence>
                  {showAttachMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-12 left-0 bg-gray-800 border border-gray-700 rounded-md overflow-hidden shadow-xl"
                    >
                      <button
                        onClick={() => {
                          cameraInputRef.current?.click();
                          setShowAttachMenu(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700 w-full text-left whitespace-nowrap"
                      >
                        <Camera className="w-5 h-5 text-purple-400" />
                        <span className="text-sm text-white">Hacer foto</span>
                      </button>
                      <button
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowAttachMenu(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700 w-full text-left whitespace-nowrap border-t border-gray-700"
                      >
                        <ImageIcon className="w-5 h-5 text-purple-400" />
                        <span className="text-sm text-white">Subir foto</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-purple-900/30 border border-purple-700/50 rounded-md px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-400"
            />

            <Button
              onClick={handleSend}
              disabled={!message.trim() && attachments.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-md h-10 w-10 p-0 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}