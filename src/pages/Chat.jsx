import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Send, Paperclip, Camera, Image as ImageIcon, Phone, Check, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import {
  startDemoFlow,
  subscribeDemoFlow,
  getDemoConversation,
  getDemoMessages,
  markDemoRead,
  sendDemoMessage,
  demoFlow
} from '@/components/DemoFlowManager';

export default function Chat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const attachMenuRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('conversationId');
  const alertId = urlParams.get('alertId');
  const otherNameParam = urlParams.get('otherName');
  const otherPhotoParam = urlParams.get('otherPhoto');
  const isDemo = !conversationId || urlParams.get('demo') === 'true';

  // ======================
  // DEMO: estado en memoria (sin cargas)
  // ======================
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!isDemo) return;
    startDemoFlow();
    const unsub = subscribeDemoFlow(() => forceTick((x) => x + 1));
    return () => unsub?.();
  }, [isDemo]);

  // OJO: demoFlow ES UN OBJETO (no función)
  const demoSt = isDemo ? demoFlow : null;

  const demoConversationId = useMemo(() => {
    if (!isDemo) return null;
    const firstId = demoSt?.conversations?.[0]?.id || null;
    return conversationId || firstId;
  }, [isDemo, demoSt, conversationId]);

  const demoConv = isDemo && demoConversationId ? getDemoConversation(demoConversationId) : null;
  const demoMsgs = isDemo && demoConversationId ? (getDemoMessages(demoConversationId) || []) : [];

  const demoOtherUser = useMemo(() => {
    if (!isDemo || !demoConv) return null;
    return demoSt?.users?.[demoConv.otherUserId] || null;
  }, [isDemo, demoConv, demoSt]);

  useEffect(() => {
    if (!isDemo) return;
    if (!demoConversationId) return;
    markDemoRead(demoConversationId);
  }, [isDemo, demoConversationId]);

  // ======================
  // REAL (Base44)
  // ======================
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
    enabled: !isDemo
  });

  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    enabled: !!conversationId && !isDemo,
    queryFn: async () => {
      const conv = await base44.entities.Conversation.filter({ id: conversationId });
      return conv?.[0] || null;
    },
    staleTime: 30000
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', conversationId],
    enabled: !!conversationId && !isDemo,
    queryFn: async () => {
      const msgs = await base44.entities.ChatMessage.filter({
        conversation_id: conversationId
      });
      return (msgs || []).sort(
        (a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
      );
    },
    staleTime: 10000
  });

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

  // ======================
  // UNIFICAR MENSAJES PARA RENDER
  // ======================
  const displayMessages = useMemo(() => {
    if (isDemo) {
      return (demoMsgs || []).map((m) => ({
        id: m.id,
        mine: !!m.mine,
        sender_name: m.senderName,
        sender_photo: m.senderPhoto,
        message: m.text,
        created_date: new Date(m.ts).toISOString(),
        kind: m.kind || 'text'
      }));
    }

    return (messages || []).map((m) => ({
      id: m.id,
      mine: m.sender_id === user?.id,
      sender_name: m.sender_name,
      sender_photo: m.sender_photo,
      message: m.message,
      created_date: m.created_date,
      kind: m.message_type || 'user',
      attachments: m.attachments
    }));
  }, [isDemo, demoMsgs, messages, user]);

  // Datos del otro usuario (header)
  const otherUser = useMemo(() => {
    // Prioridad 1: Parámetros de URL
    if (otherNameParam && otherPhotoParam) {
      try {
        return {
          name: decodeURIComponent(otherNameParam),
          photo: decodeURIComponent(otherPhotoParam)
        };
      } catch (e) {
        console.error('Error decodificando parámetros:', e);
      }
    }

    // Prioridad 2: Demo
    if (isDemo) {
      return {
        name: demoOtherUser?.name || demoConv?.other_name || 'Usuario',
        photo: demoOtherUser?.photo || demoConv?.other_photo || null
      };
    }

    // Prioridad 3: Conversación real
    const isP1 = conversation?.participant1_id === user?.id;
    return {
      name: isP1 ? conversation?.participant2_name : conversation?.participant1_name,
      photo: isP1 ? conversation?.participant2_photo : conversation?.participant1_photo
    };
  }, [isDemo, demoOtherUser, demoConv, conversation, user, otherNameParam, otherPhotoParam]);

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [displayMessages]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showAttachMenu && attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAttachMenu]);

  // ======================
  // RESPUESTAS AUTOMÁTICAS DEMO
  // ======================
  const autoRespond = (convId, userMessage) => {
    const responses = {
      'mock_reservaste_1': [
        'Perfecto, ya voy de camino 🚗',
        '¿A qué distancia estás?',
        'Llego en 5 minutos',
        'Gracias por esperarme 😊',
        '¿Sigues ahí?'
      ],
      'mock_te_reservo_1': [
        'Estoy esperando aquí',
        '¿Cuánto tardas?',
        'Veo que te acercas en el mapa',
        'Perfecto, te espero',
        'No hay problema 👍'
      ],
      'mock_reservaste_2': [
        'Ok, voy llegando',
        'Genial, aguanto',
        '¿Cuánto falta?',
        'Ya casi estoy',
        'Muchas gracias'
      ],
      'mock_te_reservo_2': [
        'Estoy cerca',
        'Llego en 2 minutos',
        '¿Sigues ahí?',
        'Ya te veo',
        'Gracias por la paciencia'
      ]
    };

    const convResponses = responses[convId];
    if (!convResponses) return;

    setTimeout(() => {
      const randomResponse = convResponses[Math.floor(Math.random() * convResponses.length)];
      sendDemoMessage(convId, randomResponse, [], false);
    }, 1500 + Math.random() * 2000);
  };

  // ======================
  // ENVIAR
  // ======================
  const sendMutation = useMutation({
    mutationFn: async (text) => {
      const clean = String(text || '').trim();
      if (!clean && attachments.length === 0) return;

      if (isDemo) {
        if (demoConversationId) {
          sendDemoMessage(demoConversationId, clean, attachments);
          autoRespond(demoConversationId, clean);
        }
        return;
      }

      const otherUserId =
        conversation?.participant1_id === user?.id
          ? conversation?.participant2_id
          : conversation?.participant1_id;

      await base44.entities.ChatMessage.create({
        conversation_id: conversationId,
        alert_id: alertId,
        sender_id: user?.id,
        sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Usuario',
        sender_photo: user?.photo_url,
        receiver_id: otherUserId,
        message: clean,
        read: false,
        message_type: 'user',
        attachments: attachments.length ? JSON.stringify(attachments) : null
      });

      await base44.entities.Conversation.update(conversation.id, {
        last_message_text: clean,
        last_message_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      setMessage('');
      setAttachments([]);
      setShowAttachMenu(false);

      if (!isDemo) {
        queryClient.invalidateQueries({ queryKey: ['chatMessages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    }
  });

  const handleSend = () => {
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
        if (isDemo) {
          // En demo, metemos un "fake attachment" local (solo para UI)
          setAttachments((prev) => [
            ...prev,
            { url: URL.createObjectURL(file), type: file.type, name: file.name }
          ]);
        } else {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          setAttachments((prev) => [...prev, { url: file_url, type: file.type, name: file.name }]);
        }
      } catch (err) {
        console.error('Error subiendo archivo:', err);
      }
    }
    setShowAttachMenu(false);
  };

  const safeParseAttachments = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header title="Chat" showBackButton={true} backTo="Chats" />

      {/* Info del usuario */}
      <div className="fixed top-[56px] left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
        <div className="flex items-center gap-3 px-4 py-1 pt-[10px]">
          <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-purple-500/50 flex-shrink-0">
            {otherUser?.photo ? (
              <img src={otherUser.photo} alt={otherUser.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xl">👤</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold truncate">{otherUser?.name || 'Usuario'}</h2>
            <p className="text-xs text-gray-400">En línea</p>
          </div>

          <Button
            className="bg-blue-600 hover:bg-blue-700 border-2 border-blue-400/70 text-white rounded-lg h-9 px-3"
          >
            <Navigation className="w-4 h-4 mr-1" />
            IR
          </Button>

          <div className="bg-purple-600/20 border border-purple-500/40 rounded-lg p-2 hover:bg-purple-600/30 cursor-pointer transition-colors">
            <Phone className="w-5 h-5 text-purple-300" />
          </div>
        
      {/* Datos de la tarjeta */}
      {cardInfo && (
        <div className="fixed top-[112px] left-0 right-0 z-30 bg-black border-b border-gray-700 px-4 py-2 text-xs text-gray-300">
          <div className="flex items-center gap-3">
            <div className="flex-1 truncate">
              <span className="font-semibold text-white">{cardInfo.car}</span>
              {cardInfo.plate && <span className="ml-2 text-gray-400">({cardInfo.plate})</span>}
            </div>
            {Number.isFinite(cardInfo.price) && (
              <div className="text-purple-400 font-bold">{cardInfo.price}€</div>
            )}
          </div>
        </div>
      )}

</div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto pt-[130px] pb-[160px] px-4">
        <div className="max-w-3xl mx-auto space-y-4 py-4">
          {displayMessages.map((msg, idx) => {
            const isMine = !!msg.mine;

            const showDate =
              idx === 0 ||
              new Date(msg.created_date).getTime() - new Date(displayMessages[idx - 1].created_date).getTime() >
                300000;

            const atts = safeParseAttachments(msg.attachments);

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <div className="bg-gray-800/80 rounded-full px-4 py-1 text-xs text-gray-400">
                      {new Date(msg.created_date)
                        .toLocaleString('es-ES', {
                          timeZone: 'Europe/Madrid',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })
                        .replace(' de ', ' ')
                        .replace(',', ' -')}
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
                        alt={msg.sender_name || 'Usuario'}
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

                      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.message}</p>

                      {atts.map((att, i) => (
                        <div key={i} className="mt-2">
                          {att.type?.includes('image') ? (
                            <img src={att.url} alt="Adjunto" className="rounded-lg max-w-[200px]" />
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
                      <div className="w-full h-full bg-purple-700 flex items-center justify-center text-lg">👤</div>
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
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 pb-[81px]">
        <div className="max-w-3xl mx-auto px-4 py-2.5 pt-[8px]">
          {attachments.length > 0 && (
            <div className="mb-2 flex gap-2">
              {attachments.map((att, i) => (
                <div key={i} className="relative">
                  {att.type?.includes('image') ? (
                    <img src={att.url} alt="" className="w-16 h-16 rounded object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-800 rounded flex items-center justify-center text-xs">📄</div>
                  )}
                  <button
                    onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="relative" ref={attachMenuRef}>
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
              className="flex-1 bg-purple-900/30 border border-purple-700/50 rounded-md px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-400 h-[42px]"
            />

            <Button
              onClick={handleSend}
              disabled={!String(message || '').trim() && attachments.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-md h-[42px] w-10 p-0 disabled:opacity-50"
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