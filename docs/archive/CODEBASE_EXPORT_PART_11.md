
================================================================
FILE: src/main.jsx
================================================================
```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/AuthContext";
import { getSupabaseConfig } from "./lib/supabaseClient";
import App from "./App";
import MissingEnvScreen from "./diagnostics/MissingEnvScreen";
import SafeModeShell from "./diagnostics/SafeModeShell";
import "./globals.css";
import "./styles/no-zoom.css";

// Captura global de errores — guarda en window.__WAITME_DIAG__ para diagnóstico
function initErrorCapture() {
  if (typeof window === "undefined") return;
  window.__WAITME_DIAG__ = window.__WAITME_DIAG__ || { errors: [], maxErrors: 10 };

  const push = (type, err) => {
    const entry = { type, message: err?.message ?? String(err), stack: err?.stack, ts: Date.now() };
    window.__WAITME_DIAG__.errors.push(entry);
    if (window.__WAITME_DIAG__.errors.length > window.__WAITME_DIAG__.maxErrors) {
      window.__WAITME_DIAG__.errors.shift();
    }
  };

  window.onerror = (msg, src, line, col, err) => {
    push("onerror", err || new Error(String(msg)));
  };
  window.addEventListener("unhandledrejection", (e) => {
    push("unhandledrejection", e.reason);
  });
}
initErrorCapture();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error('[ErrorBoundary]', error);
    try {
      if (typeof window !== "undefined" && window.__WAITME_DIAG__) {
        window.__WAITME_DIAG__.errors = window.__WAITME_DIAG__.errors || [];
        window.__WAITME_DIAG__.errors.push({
          type: "ErrorBoundary",
          message: error?.message ?? String(error),
          stack: error?.stack,
          ts: Date.now(),
        });
        if (window.__WAITME_DIAG__.errors.length > (window.__WAITME_DIAG__.maxErrors || 10)) {
          window.__WAITME_DIAG__.errors.shift();
        }
      }
    } catch (_) {}
  }

  render() {
    const err = this.state.error;
    if (err) {
      const msg = err?.message ?? String(err);
      const stack = err?.stack ?? '';
      return (
        <div
          style={{
            background: "#0a0a0a",
            color: "#fca5a5",
            padding: 24,
            fontFamily: "monospace, system-ui",
            fontSize: 13,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            minHeight: "100vh",
            overflow: "auto",
          }}
        >
          <h2 style={{ marginBottom: 12, color: "#ef4444" }}>Runtime error:</h2>
          <div style={{ marginBottom: 16 }}>{msg}</div>
          {stack && (
            <>
              <h3 style={{ marginBottom: 8, color: "#f97316" }}>Stack:</h3>
              <pre style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{stack}</pre>
            </>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

// Sentry debe cargarse después de React para evitar dispatcher.useState null
import('./lib/sentry').catch(() => {});

const RENDER_LOG = (msg, extra) => {
  if (import.meta.env.DEV) {
    try {
      console.log(`[RENDER:main] ${msg}`, extra ?? '');
    } catch {}
  }
};

const rootEl = document.getElementById("root");
if (rootEl) {
  RENDER_LOG('root element found, getting config');

  // SAFE MODE — shell mínima con nav + diagnóstico, siempre carga
  if (import.meta.env.VITE_SAFE_MODE === 'true') {
    RENDER_LOG('VITE_SAFE_MODE active');
    ReactDOM.createRoot(rootEl).render(
      <ErrorBoundary>
        <SafeModeShell />
      </ErrorBoundary>
    );
  } else if (import.meta.env.VITE_HARD_BYPASS_APP === 'true') {
    const isSimple = import.meta.env.VITE_HARD_BYPASS_APP_SIMPLE === 'true';
    RENDER_LOG('VITE_HARD_BYPASS_APP active', { isSimple });
    ReactDOM.createRoot(rootEl).render(
      isSimple ? (
        <div style={{
          minHeight: '100vh',
          background: '#111',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontFamily: 'system-ui',
        }}>
          APP SIMPLE OK
        </div>
      ) : (
        <div style={{
          minHeight: '100vh',
          background: '#111',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontFamily: 'system-ui',
        }}>
          WAITME HARD BYPASS OK
        </div>
      )
    );
  } else {
  const config = getSupabaseConfig();
  if (!config.ok) {
    RENDER_LOG('config NOT ok, rendering MissingEnvScreen', config.missing);
    ReactDOM.createRoot(rootEl).render(
      <HashRouter>
        <MissingEnvScreen missing={config.missing} />
      </HashRouter>
    );
  } else {
    RENDER_LOG('config ok, rendering App with ErrorBoundary');
    ReactDOM.createRoot(rootEl).render(
      <ErrorBoundary>
        <HashRouter>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <App />
            </AuthProvider>
          </QueryClientProvider>
        </HashRouter>
      </ErrorBoundary>
    );
  }
  }
} else {
  RENDER_LOG('root element NOT found');
}

```

================================================================
FILE: src/pages/Chat.jsx
================================================================
```jsx
import { useEffect, useRef, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import * as chat from '@/data/chat';
import * as uploads from '@/data/uploads';
import { format } from 'date-fns';
import { Send, Paperclip, Camera, Image as ImageIcon, Phone, Check, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getDemoConversation,
  getDemoMessages,
  markDemoRead,
  sendDemoMessage,
  demoFlow
} from '@/components/DemoFlowManager';

export default function Chat() {
  const { user } = useAuth();
  const { search: locationSearch } = useLocation();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const attachMenuRef = useRef(null);

  const urlParams = new URLSearchParams(locationSearch);
  const conversationId = urlParams.get('conversationId');
  const alertId = urlParams.get('alertId');
  const otherNameParam = urlParams.get('otherName');
  const otherPhotoParam = urlParams.get('otherPhoto');
  const carLabelParam = urlParams.get('carLabel');
  const plateParam = urlParams.get('plate');
  const priceParam = urlParams.get('price');
  const demoFirstMsgParam = urlParams.get('demoFirstMsg'); // mensaje inicial de la conv demo

  const cardInfo = useMemo(() => {
    const car = carLabelParam ? decodeURIComponent(carLabelParam) : null;
    const plate = plateParam ? decodeURIComponent(plateParam) : null;
    const price = priceParam != null ? Number(priceParam) : null;
    const hasAny = !!car || !!plate || Number.isFinite(price);
    if (!hasAny) return null;
    return { car, plate, price };
  }, [carLabelParam, plateParam, priceParam]);

  const isDemo = !conversationId || urlParams.get('demo') === 'true';

  // ======================
  // DEMO: estado en memoria (sin cargas)
  // ======================
  const [, forceTick] = useState(0);

  // useEffect(() => {
  //   if (!isDemo) return;
  //   startDemoFlow();
  //   const unsub = subscribeDemoFlow(() => forceTick((x) => x + 1));
  //   return () => unsub?.();
  // }, [isDemo]);

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
    const otherId = demoConv.participant1_id === 'me' ? demoConv.participant2_id : demoConv.participant1_id;
    return (demoSt?.users || []).find((u) => u.id === otherId) || null;
  }, [isDemo, demoConv, demoSt]);

  useEffect(() => {
    if (!isDemo) return;
    if (!demoConversationId) return;
    markDemoRead(demoConversationId);
  }, [isDemo, demoConversationId]);

  // ======================
  // REAL (data/chat adapter → Supabase)
  // ======================
  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    enabled: !!conversationId && !!user?.id && !isDemo,
    queryFn: async () => {
      const { data, error } = await chat.getConversation(conversationId, user?.id);
      if (error) throw error;
      return data ?? null;
    },
    staleTime: 30000
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', conversationId, user?.id],
    enabled: !!conversationId && !!user?.id && !isDemo,
    queryFn: async () => {
      const { data, error } = await chat.getMessages(conversationId, user?.id);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10000
  });

  // Suscripción Realtime a mensajes
  useEffect(() => {
    if (!conversationId || isDemo || !user?.id) return;

    const unsub = chat.subscribeMessages(conversationId, () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', conversationId, user?.id] });
    });
    return () => unsub?.();
  }, [conversationId, isDemo, user?.id, queryClient]);

  // Mensajes demo desde localStorage (para chats de WaitMe aceptados que vienen de Chats page)
  const [localDemoMessages, setLocalDemoMessages] = useState(() => {
    if (!demoFirstMsgParam) return [];
    const firstMsg = decodeURIComponent(demoFirstMsgParam);
    if (!firstMsg) return [];

    const isMineMsg = firstMsg.includes('he enviado') || firstMsg.includes('he reservado');
    return [{
      id: 'demo_initial_1',
      mine: !isMineMsg,
      sender_name: otherNameParam ? decodeURIComponent(otherNameParam) : 'Usuario',
      sender_photo: otherPhotoParam ? decodeURIComponent(otherPhotoParam) : null,
      message: firstMsg,
      created_date: new Date().toISOString(),
      kind: 'text'
    }];
  });

  // ======================
  // UNIFICAR MENSAJES PARA RENDER
  // ======================
  const displayMessages = useMemo(() => {
    if (isDemo) {
      const demoMapped = (demoMsgs || []).map((m) => ({
        id: m.id,
        mine: !!m.mine,
        sender_name: m.senderName,
        sender_photo: m.senderPhoto,
        message: m.text,
        created_date: new Date(m.ts).toISOString(),
        kind: m.kind || 'text'
      }));
      // Combinar con mensajes locales del demo (para WaitMe aceptados)
      const combined = [...localDemoMessages, ...demoMapped];
      // Deduplicar por id
      const seen = new Set();
      return combined.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });
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
    // Prioridad 1: Parámetros de URL (acepta nombre aunque no venga foto)
    if (otherNameParam || otherPhotoParam) {
      let decodedName = null;
      let decodedPhoto = null;

      try {
        decodedName = otherNameParam ? decodeURIComponent(otherNameParam) : null;
      } catch (e) {
        console.error('Error decodificando otherName:', e);
        decodedName = otherNameParam || null;
      }

      try {
        decodedPhoto = otherPhotoParam ? decodeURIComponent(otherPhotoParam) : null;
      } catch (e) {
        console.error('Error decodificando otherPhoto:', e);
        decodedPhoto = otherPhotoParam || null;
      }

      return {
        name: decodedName || 'Usuario',
        photo: decodedPhoto || null
      };
    }

    // Prioridad 2: Demo
    if (isDemo) {
      const fallbackPhotos = [
        'https://randomuser.me/api/portraits/women/44.jpg',
        'https://randomuser.me/api/portraits/men/32.jpg',
        'https://randomuser.me/api/portraits/women/68.jpg',
        'https://randomuser.me/api/portraits/men/75.jpg'
      ];
      const seed = String(demoConversationId || alertId || 'x').charCodeAt(0) || 0;
      const fallbackPhoto = fallbackPhotos[seed % fallbackPhotos.length];

      return {
        name: demoOtherUser?.name || demoConv?.other_name || otherNameParam || 'Sofía',
        photo: demoOtherUser?.photo || demoConv?.other_photo || otherPhotoParam || fallbackPhoto
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
        // Si venimos de un chat directo con demoFirstMsg (WaitMe aceptado desde Chats)
        if (demoFirstMsgParam) {
          const myMsg = {
            id: `local_${Date.now()}`,
            mine: true,
            sender_name: 'Tú',
            sender_photo: null,
            message: clean,
            created_date: new Date().toISOString(),
            kind: 'text'
          };
          setLocalDemoMessages(prev => [...prev, myMsg]);
          // Auto-respuesta simple del otro usuario
          const otherName = otherNameParam ? decodeURIComponent(otherNameParam) : 'Usuario';
          const otherPhoto = otherPhotoParam ? decodeURIComponent(otherPhotoParam) : null;
          setTimeout(() => {
            const responses = ['Vale, ya voy de camino 🚗', '¿A qué distancia estás?', 'Perfecto, te espero', 'Ok!', 'Bien, salgo en un momento 👍'];
            const reply = responses[Math.floor(Math.random() * responses.length)];
            setLocalDemoMessages(prev => [...prev, {
              id: `local_reply_${Date.now()}`,
              mine: false,
              sender_name: otherName,
              sender_photo: otherPhoto,
              message: reply,
              created_date: new Date().toISOString(),
              kind: 'text'
            }]);
          }, 1500 + Math.random() * 2000);
          return;
        }
        if (demoConversationId) {
          sendDemoMessage(demoConversationId, clean, attachments);
          autoRespond(demoConversationId, clean);
        }
        return;
      }

      const { error } = await chat.sendMessage({
        conversationId,
        senderId: user?.id,
        body: clean
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage('');
      setAttachments([]);
      setShowAttachMenu(false);

      if (!isDemo) {
        queryClient.invalidateQueries({ queryKey: ['chatMessages', conversationId, user?.id] });
        queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
      }
    }
  });

  const handleSend = () => {
    if (!message.trim()) return;
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
          const ext = file.name.split('.').pop() || 'bin';
          const safeName = (file.name || 'file').replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 50);
          const path = `chat/${user?.id || 'anon'}/${Date.now()}_${safeName}`;
          const { file_url, url, error } = await uploads.uploadFile(file, path);
          if (error) throw error;
          const attachmentUrl = file_url || url;
          if (attachmentUrl) {
            setAttachments((prev) => [...prev, { url: attachmentUrl, type: file.type, name: file.name }]);
          }
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
    <div className="min-min-h-[100dvh] bg-black flex flex-col">
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
        </div>
      </div>

      {/* Datos de la tarjeta */}
      {cardInfo && (
        <div className="fixed top-[112px] left-0 right-0 z-30 bg-black border-b border-gray-700 px-4 py-2 text-xs text-gray-300">
          <div className="flex items-center gap-3">
            <div className="flex-1 truncate">
              {cardInfo.car && <span className="font-semibold text-white">{cardInfo.car}</span>}
              {cardInfo.plate && <span className="ml-2 text-gray-400">({cardInfo.plate})</span>}
            </div>
            {Number.isFinite(cardInfo.price) && (
              <div className="text-purple-400 font-bold">{cardInfo.price}€</div>
            )}
          </div>
        </div>
      )}

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto pt-[156px] pb-[160px] px-4">
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
    </div>
  );
}
```

================================================================
FILE: src/pages/Chats.jsx
================================================================
```jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as chat from '@/data/chat';
import * as alerts from '@/data/alerts';
import * as notifications from '@/data/notifications';
import { Search, X, Navigation, TrendingUp, TrendingDown, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import MarcoCard from '@/components/cards/MarcoCard';
import { useAuth } from '@/lib/AuthContext';

// ======================
// Helpers
// ======================
const pad2 = (n) => String(n).padStart(2, '0');

const formatMMSS = (ms) => {
  const safe = Math.max(0, ms ?? 0);
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${pad2(minutes)}:${pad2(seconds)}`;
};

const getChatStatusLabel = (status) => {
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'completed':
    case 'completada':
      return 'COMPLETADA';
    case 'thinking':
    case 'me_lo_pienso':
    case 'pending':
      return 'ME LO PIENSO';
    case 'rejected':
    case 'rechazada':
      return 'RECHAZADA';
    case 'extended':
    case 'prorroga':
    case 'prórroga':
      return 'PRÓRROGA';
    case 'cancelled':
    case 'canceled':
    case 'cancelada':
      return 'CANCELADA';
    case 'expired':
    case 'agotada':
    case 'expirada':
      return 'AGOTADA';
    case 'went_early':
    case 'se_fue':
      return 'SE FUE';
    default:
      return null;
  }
};

const isFinalChatStatus = (status) => {
  const s = String(status || '').toLowerCase();
  return ['completed', 'completada', 'cancelled', 'canceled', 'cancelada', 'expired', 'agotada', 'expirada', 'went_early', 'se_fue'].includes(s);
};

// ====== Estilos sincronizados (CHATS / CHAT / NOTIFICACIONES) ======
const PURPLE_ACTIVE_BORDER = 'border-purple-400/70';
const PURPLE_ACTIVE_TEXT = 'text-purple-400';
const PURPLE_ACTIVE_TEXT_DIM = 'text-purple-400/70';

const normalizeStatus = (status) => String(status || '').trim().toLowerCase();

const isStatusMeLoPienso = (status) => {
  const s = normalizeStatus(status);
  return s === 'thinking' || s === 'me_lo_pienso' || s === 'me lo pienso' || s === 'pending';
};

const isStatusProrrogada = (status) => {
  const s = normalizeStatus(status);
  return s === 'extended' || s === 'prorroga' || s === 'prórroga' || s === 'prorrogada';
};

const isStatusCancelada = (status) => {
  const s = normalizeStatus(status);
  return s === 'cancelled' || s === 'canceled' || s === 'cancelada';
};

const isStatusCompletada = (status) => {
  const s = normalizeStatus(status);
  return s === 'completed' || s === 'completada';
};

const getRoleBoxClasses = ({ status, isSeller, isBuyer }) => {
  // Caja izquierda: "Te reservo:" (vendes/ganas) o "Reservaste a:" (compras/pagas)
  const base =
    'border font-bold text-xs h-7 w-full flex items-center justify-center cursor-default select-none pointer-events-none truncate';

  // COMPLETADAS / CANCELADAS => rojo (ambas)
  if (isStatusCompletada(status) || isStatusCancelada(status)) {
    return `${base} bg-red-500/20 text-red-300 border-red-400/50`;
  }

  // ME LO PIENSO / PRORROGADA => seller verde, buyer morado
  if (isStatusMeLoPienso(status) || isStatusProrrogada(status)) {
    if (isSeller) return `${base} bg-green-500/20 text-green-300 border-green-400/50`;
    if (isBuyer) return `${base} bg-purple-500/20 text-purple-300 border-purple-400/50`;
  }

  // Por defecto: seller verde (ganas) / buyer morado (pagas) / otros rojo suave
  if (isSeller) return `${base} bg-green-500/20 text-green-300 border-green-400/50`;
  if (isBuyer) return `${base} bg-purple-500/20 text-purple-300 border-purple-400/50`;
  return `${base} bg-red-500/20 text-red-400 border-red-500/30`;
};

const PricePill = ({ direction = 'up', amount = 0 }) => {
  const isUp = direction === 'up';
  const wrapCls = isUp ? 'bg-green-500/15 border border-green-400/40' : 'bg-red-500/15 border border-red-400/40';
  const textCls = isUp ? 'text-green-400' : 'text-red-400';
  return (
    <div className={`${wrapCls} rounded-lg px-2 py-1 flex items-center gap-1 h-7`}>
      {isUp ? <TrendingUpIcon className={`w-4 h-4 ${textCls}`} /> : <TrendingDownIcon className={`w-4 h-4 ${textCls}`} />}
      <span className={`font-bold text-sm ${textCls}`}>{Math.floor(amount || 0)}€</span>
    </div>
  );
};

// Íconos (SVG) para mantener este archivo autocontenido sin tocar imports
const TrendingUpIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const TrendingDownIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

const shouldEnableIR = ({ status, isSeller, isFinal }) => {
  if (isFinal) return false;
  if (isSeller) return false;
  // En ME LO PIENSO / PRORROGA el botón debe estar encendido (comprador)
  if (isStatusMeLoPienso(status) || isStatusProrrogada(status)) return true;
  // En el resto de estados no finales, también lo dejamos activo (comprador)
  return true;
};


const clampFinite = (n, fallback = null) => (Number.isFinite(n) ? n : fallback);

const getTargetTimeMs = (alert) => {
  const t = alert?.target_time;
  if (!t) return null;
  if (typeof t === 'number') return t;
  const asDate = new Date(t);
  const ms = asDate.getTime();
  return Number.isFinite(ms) ? ms : null;
};

const hasLatLon = (obj, latKey = 'latitude', lonKey = 'longitude') => {
  const lat = clampFinite(Number(obj?.[latKey]));
  const lon = clampFinite(Number(obj?.[lonKey]));
  return lat !== null && lon !== null;
};

const pickCoords = (obj, latKey = 'latitude', lonKey = 'longitude') => {
  const lat = clampFinite(Number(obj?.[latKey]));
  const lon = clampFinite(Number(obj?.[lonKey]));
  if (lat === null || lon === null) return null;
  return { lat, lon };
};

const PriceChip = ({ amount, direction }) => {
  const n = Number(amount || 0);
  const amountText = `${Math.floor(Math.abs(n))}€`;
  const isGreen = direction === 'up';
  const isRed = direction === 'down';
  const wrapCls = isGreen
    ? 'bg-green-500/20 border border-green-500/30'
    : isRed
    ? 'bg-red-500/20 border border-red-500/30'
    : 'bg-purple-600/20 border border-purple-500/30';
  const textCls = isGreen ? 'text-green-400' : isRed ? 'text-red-400' : 'text-purple-300';
  return (
    <div className={`${wrapCls} rounded-lg px-3 py-0.5 flex items-center gap-1 h-7`}>
      {isGreen ? <TrendingUp className={`w-4 h-4 ${textCls}`} /> : null}
      {isRed ? <TrendingDown className={`w-4 h-4 ${textCls}`} /> : null}
      <span className={`font-bold text-xs ${textCls}`}>{amountText}</span>
    </div>
  );
};


export default function Chats() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [nowTs, setNowTs] = useState(Date.now());

  const [showProrrogaDialog, setShowProrrogaDialog] = useState(false);
  const [selectedProrroga, setSelectedProrroga] = useState(null);
  const [currentExpiredAlert, setCurrentExpiredAlert] = useState(null);

  const [etaMap, setEtaMap] = useState({});

  const expiredHandledRef = useRef(new Set());
  const hasEverHadTimeRef = useRef(new Map());

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
        },
        (error) => console.log('Error obteniendo ubicación:', error),
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 5000 }
      );
    }
  }, []);

  const [demoConvs, setDemoConvs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('waitme:demo_conversations') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    const handler = () => {
      try { setDemoConvs(JSON.parse(localStorage.getItem('waitme:demo_conversations') || '[]')); } catch {}
    };
    window.addEventListener('waitme:newDemoConversation', handler);
    return () => window.removeEventListener('waitme:newDemoConversation', handler);
  }, []);

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', user?.id ?? 'none'],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await chat.getConversations(user.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    placeholderData: (prev) => prev,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false
  });

  const { data: alertsData = [] } = useQuery({
    queryKey: ['alertsForChats', user?.id ?? 'none'],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await alerts.getAlertsForChats(user.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    placeholderData: (prev) => prev,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false
  });

  const alertsMap = useMemo(() => {
    const map = new Map();
    alertsData.forEach((a) => map.set(a.id, a));
    return map;
  }, [alertsData]);

  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, conv) => {
      const isP1 = conv.participant1_id === user?.id;
      const unread = isP1 ? conv.unread_count_p1 : conv.unread_count_p2;
      return sum + (unread || 0);
    }, 0);
  }, [conversations, user?.id]);

  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = conversations.filter((conv) => {
        const isP1 = conv.participant1_id === user?.id;
        const otherName = isP1 ? conv.participant2_name : conv.participant1_name;
        const lastMsg = conv.last_message_text || '';
        return otherName?.toLowerCase().includes(q) || lastMsg.toLowerCase().includes(q);
      });
    }

    // Aplicar lógica de negocio: solo UNA reserva activa como buyer y UNA como seller
    const buyerReservations = [];
    const sellerReservations = [];
    const others = [];

    filtered.forEach((conv) => {
      const alert = alertsMap.get(conv.alert_id);
      if (!alert) return;

      const isBuyer = alert?.reserved_by_id === user?.id;
      const isSeller = alert?.user_id === user?.id && alert?.reserved_by_id;
      const isActive = alert?.status === 'reserved';

      if (isBuyer && isActive) {
        buyerReservations.push(conv);
      } else if (isSeller && isActive) {
        sellerReservations.push(conv);
      } else {
        others.push(conv);
      }
    });

    // Mantener solo la reserva buyer más reciente como activa
    if (buyerReservations.length > 1) {
      buyerReservations.sort((a, b) => new Date(b.last_message_at || b.created_date) - new Date(a.last_message_at || a.created_date));
      const [activeBuyer, ...restBuyer] = buyerReservations;
      filtered = filtered.map((conv) => {
        if (restBuyer.find((c) => c.id === conv.id)) {
          const alert = alertsMap.get(conv.alert_id);
          if (alert) alert.status = 'cancelled';
        }
        return conv;
      });
      buyerReservations.length = 1;
    }

    // Mantener solo la reserva seller más reciente como activa
    if (sellerReservations.length > 1) {
      sellerReservations.sort((a, b) => new Date(b.last_message_at || b.created_date) - new Date(a.last_message_at || a.created_date));
      const [activeSeller, ...restSeller] = sellerReservations;
      filtered = filtered.map((conv) => {
        if (restSeller.find((c) => c.id === conv.id)) {
          const alert = alertsMap.get(conv.alert_id);
          if (alert) alert.status = 'cancelled';
        }
        return conv;
      });
      sellerReservations.length = 1;
    }

    return filtered.sort((a, b) => {
      const aUnread = (a.participant1_id === user?.id ? a.unread_count_p1 : a.unread_count_p2) || 0;
      const bUnread = (b.participant1_id === user?.id ? b.unread_count_p1 : b.unread_count_p2) || 0;

      if (bUnread !== aUnread) return bUnread - aUnread;

      const toMs = (v) => {
        if (!v) return 0;
        if (typeof v === 'number') return v;
        const d = new Date(v);
        const ms = d.getTime();
        return Number.isFinite(ms) ? ms : 0;
      };

      const aLast = Math.max(
        toMs(a.last_message_at),
        toMs(a.status_updated_at),
        toMs(a.updated_date),
        toMs(a.updated_at),
        toMs(a.created_date),
        toMs(a.created_at)
      );

      const bLast = Math.max(
        toMs(b.last_message_at),
        toMs(b.status_updated_at),
        toMs(b.updated_date),
        toMs(b.updated_at),
        toMs(b.created_date),
        toMs(b.created_at)
      );

      return bLast - aLast;
    });
  }, [conversations, searchQuery, user?.id, alertsMap]);

  const openExpiredDialog = (alert, isBuyer) => {
    if (!alert?.id) return;
    if (expiredHandledRef.current.has(alert.id)) return;
    expiredHandledRef.current.add(alert.id);

    const title = isBuyer ? '⏱️ No te has presentado' : '⏱️ Usuario no se ha presentado';
    const desc = isBuyer
      ? 'No te has presentado, se te devolverá tu importe menos la comisión de WaitMe!'
      : 'Usuario no se ha presentado, se te ingresará el 33% del importe de la operación como compensación por tu espera';

    toast({ title, description: desc });

    setCurrentExpiredAlert({ alert, isBuyer });
    setSelectedProrroga(null);
    setShowProrrogaDialog(true);
  };

  const handleProrroga = async () => {
    if (!selectedProrroga || !currentExpiredAlert) return;

    const { minutes, price } = selectedProrroga;
    const { alert, isBuyer } = currentExpiredAlert;

    try {
      const recipientId = isBuyer ? alert.user_id : alert.reserved_by_id;
      const { error } = await notifications.createNotification({
        user_id: recipientId,
        type: 'extension_request',
        title: 'Prórroga solicitada',
        message: `${minutes} min por ${price}€`,
        metadata: {
          sender_id: user?.id,
          sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Usuario',
          alert_id: alert.id,
          amount: price,
          extension_minutes: minutes,
          status: 'pending'
        }
      });
      if (error) throw error;

      toast({
        title: '✅ PRÓRROGA ENVIADA',
        description: `${minutes} min por ${price}€`
      });
    } catch (err) {
      console.error('Error creando notificación de prórroga:', err);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la prórroga. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }

    setShowProrrogaDialog(false);
    setSelectedProrroga(null);
    setCurrentExpiredAlert(null);
  };

  const calculateDistanceText = (alert) => {
    if (!alert?.latitude || !alert?.longitude) return null;
    if (!userLocation) {
      const demoDistances = ['150m', '320m', '480m', '650m', '800m'];
      return demoDistances[String(alert.id || '').charCodeAt(0) % demoDistances.length];
    }
    const R = 6371;
    const dLat = ((alert.latitude - userLocation.lat) * Math.PI) / 180;
    const dLon = ((alert.longitude - userLocation.lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.lat * Math.PI) / 180) *
        Math.cos((alert.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;
    const meters = Math.round(distanceKm * 1000);
    return `${Math.min(meters, 999)}m`;
  };

  const openDirectionsToAlert = (alert) => {
    const coords = hasLatLon(alert) ? pickCoords(alert) : null;
    if (!coords) return;
    const { lat, lon } = coords;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`;
    window.location.href = url;
  };

  const getRemainingMsForAlert = (alert, isBuyer) => {
    const entry = etaMap?.[alert?.id];

    if (entry && Number.isFinite(entry.etaSeconds)) {
      const elapsed = nowTs - entry.fetchedAt;
      const base = entry.etaSeconds * 1000;
      const remaining = Math.max(0, base - elapsed);

      if (base > 0) {
        hasEverHadTimeRef.current.set(alert.id, true);
      }

      return remaining;
    }

    const targetMs = getTargetTimeMs(alert);
    if (targetMs && targetMs > nowTs) {
      hasEverHadTimeRef.current.set(alert.id, true);
      return targetMs - nowTs;
    }

    return null;
  };

  useEffect(() => {
    const max = 25;
    for (const conv of filteredConversations.slice(0, max)) {
      const alert = alertsMap.get(conv.alert_id);
      if (!alert) continue;
      const isBuyer = alert?.reserved_by_id === user?.id;
      const remainingMs = getRemainingMsForAlert(alert, isBuyer);
            const statusLabel = getChatStatusLabel(alert?.status);
const isCompletedOrCanceled = statusLabel === 'COMPLETADA' || statusLabel === 'CANCELADA';
const isThinking = statusLabel === 'ME LO PIENSO';
const isProrroga = statusLabel === 'PRÓRROGA';

const isSeller = alert?.user_id === user?.id;

const badgeCls = isCompletedOrCanceled
  ? 'bg-red-500/20 text-red-400 border-red-500/30'
  : isBuyer
  ? 'bg-purple-500/20 text-purple-300 border-purple-400/50'
  : isSeller
  ? 'bg-green-500/20 text-green-300 border-green-400/50'
  : 'bg-purple-500/10 text-purple-300/70 border-purple-400/30';


      if (remainingMs === 0 && hasEverHadTimeRef.current.get(alert.id) === true && !showProrrogaDialog) {
        openExpiredDialog(alert, isBuyer);
      }
    }
  }, [nowTs, filteredConversations, alertsMap, user?.id, showProrrogaDialog]);

  return (
    <div className="min-min-h-[100dvh] bg-black text-white flex flex-col">
      <main className="flex-1 flex flex-col min-h-0 overflow-auto">
        {/* Conversaciones demo (WaitMe aceptados) */}
        {demoConvs.length > 0 && (
          <div className="px-4 pt-3 space-y-3">
            {demoConvs.map((dc) => {
              const buyerFirstName = (dc.buyer_name || 'Usuario').split(' ')[0];
              const buyerPhoto = dc.buyer_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(dc.buyer_name||'U')}&background=7c3aed&color=fff&size=128`;
              const carLabel = `${dc.brand || ''} ${dc.model || ''}`.trim() || 'Sin datos';
              const hasUnread = (dc.unread || 0) > 0;
              return (
                <div key={dc.id}
                  className={`bg-gray-900 rounded-xl p-2.5 border-2 ${hasUnread ? 'border-purple-400/70' : 'border-purple-500/30'} cursor-pointer`}
                  onClick={() => {
                    // Limpiar unread de esta conv
                    try {
                      const updated = demoConvs.map(c => c.id === dc.id ? { ...c, unread: 0 } : c);
                      setDemoConvs(updated);
                      localStorage.setItem('waitme:demo_conversations', JSON.stringify(updated));
                      const total = updated.reduce((s, c) => s + (c.unread || 0), 0);
                      localStorage.setItem('waitme:chat_unread', String(total));
                      window.dispatchEvent(new Event('waitme:chatUnreadUpdate'));
                    } catch {}
                    navigate(`/chat?demo=true&conversationId=${dc.id}&alertId=${dc.alert_id}&otherName=${encodeURIComponent(dc.buyer_name || '')}&otherPhoto=${encodeURIComponent(dc.buyer_photo || '')}`);
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-shrink-0 w-[95px] h-7 bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold text-xs rounded-md flex items-center justify-center">
                      Te reservó:
                    </div>
                    <div className="flex-1"/>
                    <div className="bg-black/40 border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
                      <Navigation className="w-3 h-3 text-purple-400"/>
                      <span className="text-white font-bold text-xs">300m</span>
                    </div>
                    <div className="bg-green-500/15 border border-green-400/40 rounded-lg px-2 py-0.5 flex items-center gap-1 h-7">
                      <TrendingUp className="w-4 h-4 text-green-400"/>
                      <span className="text-green-400 font-bold text-sm">{dc.price || 3}€</span>
                    </div>
                    <button onClick={(e) => {
                      e.stopPropagation();
                      const updated = demoConvs.filter(c => c.id !== dc.id);
                      setDemoConvs(updated);
                      localStorage.setItem('waitme:demo_conversations', JSON.stringify(updated));
                      const total = updated.reduce((s, c) => s + (c.unread || 0), 0);
                      localStorage.setItem('waitme:chat_unread', String(total));
                      window.dispatchEvent(new Event('waitme:chatUnreadUpdate'));
                    }} className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 flex items-center justify-center transition-colors">
                      <X className="w-3.5 h-3.5 text-red-400"/>
                    </button>
                  </div>
                  <div className="border-t border-gray-700/80 mb-2"/>
                  <div className="flex gap-2.5 mb-2">
                    <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500/40 bg-gray-900 flex-shrink-0">
                      <img src={buyerPhoto} alt={buyerFirstName} className="w-full h-full object-cover"/>
                    </div>
                    <div className="flex-1 h-[85px] flex flex-col">
                      <p className="font-bold text-xl text-white leading-none">{buyerFirstName}</p>
                      <p className="text-sm font-medium text-gray-200 flex-1 flex items-center truncate relative top-[6px]">{carLabel}</p>
                      <div className="flex items-end gap-2 mt-1 min-h-[28px]">
                        <div className="flex-shrink-0">
                          <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
                            <div className="bg-blue-600 h-full w-5 flex items-center justify-center"><span className="text-white text-[8px] font-bold">E</span></div>
                            <span className="px-1.5 text-black font-mono font-bold text-sm tracking-wider">{dc.plate || '0000 XXX'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-700/80 pt-2">
                    <div className="flex justify-between items-center mb-1">
                      <p className={`text-xs font-bold ${hasUnread ? 'text-purple-400' : 'text-purple-400/70'}`}>Últimos mensajes:</p>
                      {hasUnread && (
                        <div className="w-6 h-6 bg-red-500/20 border-2 border-red-500/30 rounded-full flex items-center justify-center">
                          <span className="text-red-400 text-xs font-bold">{dc.unread > 9 ? '9+' : dc.unread}</span>
                        </div>
                      )}
                    </div>
                    <p className={`text-xs ${hasUnread ? 'text-gray-300' : 'text-gray-500'}`}>{dc.first_message || 'Sin mensajes'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredConversations.length === 0 && demoConvs.length === 0 && (
          <div className="min-h-[calc(100dvh-60px-96px)] flex items-center justify-center px-4">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">No hay chats iniciados.</p>
            </div>
          </div>
        )}

        {filteredConversations.length > 0 && (
          <>

        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-white pl-10 pr-10 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="px-4 space-y-3 pt-1">
          {filteredConversations.map((conv, index) => {
            const alert = alertsMap.get(conv.alert_id);
            if (!alert) return null;

            const isP1 = conv.participant1_id === user?.id;
            const unreadCount = isP1 ? conv.unread_count_p1 : conv.unread_count_p2;
            const hasUnread = (unreadCount || 0) > 0;

            const isBuyer = alert?.reserved_by_id === user?.id;
            const isSeller = alert?.reserved_by_id && !isBuyer;

            const otherUserName = isP1 ? conv.participant2_name : conv.participant1_name;
            let otherUserPhoto = isP1 ? conv.participant2_photo : conv.participant1_photo;

            if (!otherUserPhoto) {
              const photoUrls = [
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
                'https://randomuser.me/api/portraits/women/68.jpg',
                'https://randomuser.me/api/portraits/men/32.jpg',
                'https://randomuser.me/api/portraits/women/44.jpg',
                'https://randomuser.me/api/portraits/men/75.jpg'
              ];
              otherUserPhoto = photoUrls[String(conv.id || '').charCodeAt(0) % photoUrls.length];
            }

            const distanceText = calculateDistanceText(alert);

            const remainingMs = getRemainingMsForAlert(alert, isBuyer);
            const countdownText = formatMMSS(remainingMs);

            const remainingMinutes = Math.max(0, Math.ceil((remainingMs ?? 0) / 60000));
            const waitUntilText = format(new Date(nowTs + (remainingMs ?? 0)), 'HH:mm', { locale: es });

            const finalLabel = getChatStatusLabel(alert?.status);
            const isFinal = isFinalChatStatus(alert?.status) && !!finalLabel;
            const canIR = shouldEnableIR({ status: alert?.status, isSeller, isFinal });
            const statusBoxText = isFinal ? finalLabel : countdownText;

            const navigateToChat = () => {
              const name = encodeURIComponent(otherUserName || '');
              const photo = encodeURIComponent(otherUserPhoto || '');
              navigate(`/chat?conversationId=${conv.id}&alertId=${conv.alert_id}&otherName=${name}&otherPhoto=${photo}`);
            };

            return (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  className={`bg-gradient-to-br ${
                    hasUnread ? 'from-gray-800 to-gray-900' : 'from-gray-900/50 to-gray-900/50'
                  } rounded-xl p-2.5 transition-all border-2 ${
                    hasUnread ? 'border-purple-400/70' : 'border-purple-500/30'
                  }`}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-shrink-0 w-[95px]">
                        <Badge
                          className={getRoleBoxClasses({ status: alert?.status, isSeller, isBuyer })}
                        >
                          {isBuyer ? 'Reservaste a:' : isSeller ? 'Te reservo:' : 'Info usuario'}
                        </Badge>
                      </div>
                      <div className="flex-1"></div>
                      <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
                        <Navigation className="w-3 h-3 text-purple-400" />
                        <span className="text-white font-bold text-xs">{distanceText}</span>
                      </div>
                      <PricePill direction={isSeller ? 'up' : 'down'} amount={alert?.price} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Cerrar conversación:', conv.id);
                        }}
                        className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 flex items-center justify-center transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>

                    <div className="border-t border-gray-700/80 mb-1.5 pt-2">
                      <MarcoCard
                        photoUrl={otherUserPhoto}
                        name={otherUserName}
                        carLabel={`${alert.brand || ''} ${alert.model || ''}`.trim()}
                        plate={alert.plate}
                        carColor={alert.color || 'gris'}
                        address={alert.address}
                        timeLine={
                          isSeller ? (
                            <span className="text-white leading-5">
                              Te vas en {remainingMinutes} min · Debes esperar hasta las{' '}
                              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{waitUntilText}</span>
                            </span>
                          ) : isBuyer ? (
                            <span className="text-white leading-5">
                              Se va en {remainingMinutes} min · Te espera hasta las{' '}
                              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{waitUntilText}</span>
                            </span>
                          ) : (
                            <span className={hasUnread ? 'text-white' : 'text-gray-400'}>Tiempo para llegar:</span>
                          )
                        }
                        onChat={navigateToChat}
                        statusText={statusBoxText}
                        phoneEnabled={alert.allow_phone_calls}
                        onCall={() => alert.allow_phone_calls && alert?.phone && (window.location.href = `tel:${alert.phone}`)}
                        dimmed={!hasUnread}
                        role={isSeller ? 'seller' : 'buyer'}
                      />

                      {hasLatLon(alert) && (
                        <div className="mt-2">
                          <Button
                            disabled={!canIR}
                            className={`w-full border-2 ${
                              canIR ? 'bg-blue-600 hover:bg-blue-700 border-blue-400/70' : 'bg-blue-600/30 text-white/50 border-blue-500/30'
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (isSeller || isFinal) return;
                              openDirectionsToAlert(alert);
                            }}
                          >
                            <span className="flex items-center justify-center gap-2">
                              <Navigation className="w-4 h-4" />
                              IR
                            </span>
                          </Button>
                        </div>
                      )}
                    </div>

                    <div
                      className="border-t border-gray-700/80 mt-2 pt-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={navigateToChat}
                    >
                      <div className="flex justify-between items-center">
                        <p className={`text-xs font-bold ${hasUnread ? PURPLE_ACTIVE_TEXT : PURPLE_ACTIVE_TEXT_DIM}`}>
                          Últimos mensajes:
                        </p>
                        {unreadCount > 0 && (
                          <div className="w-6 h-6 bg-red-500/20 border-2 border-red-500/30 rounded-full flex items-center justify-center relative top-[10px]">
                            <span className="text-red-400 text-xs font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                          </div>
                        )}
                      </div>
                      <p className={`text-xs ${hasUnread ? 'text-gray-300' : 'text-gray-500'} mt-1`}>
                        {conv.last_message_text || 'Sin mensajes'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      
          </>
        )}
</main>

      <Dialog
        open={showProrrogaDialog}
        onOpenChange={(open) => {
          setShowProrrogaDialog(open);
          if (!open) {
            setSelectedProrroga(null);
            setCurrentExpiredAlert(null);
            expiredHandledRef.current.clear();
          }
        }}
      >
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {currentExpiredAlert?.isBuyer ? '⏱️ No te has presentado' : '⏱️ Usuario no se ha presentado'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {currentExpiredAlert?.isBuyer
                ? 'No te has presentado, se te devolverá tu importe menos la comisión de WaitMe!'
                : 'Usuario no se ha presentado, se te ingresará el 33% del importe de la operación como compensación por tu espera'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-gray-300 font-semibold">PRORROGAR</p>

            <div className="space-y-2">
              <button
                onClick={() => setSelectedProrroga({ minutes: 5, price: 1 })}
                className={`w-full p-3 rounded-lg border-2 transition-all ${
                  selectedProrroga?.minutes === 5
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500/50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">5 minutos más</span>
                  <span className="text-purple-300 font-bold">1€</span>
                </div>
              </button>

              <button
                onClick={() => setSelectedProrroga({ minutes: 10, price: 3 })}
                className={`w-full p-3 rounded-lg border-2 transition-all ${
                  selectedProrroga?.minutes === 10
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500/50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">10 minutos más</span>
                  <span className="text-purple-300 font-bold">3€</span>
                </div>
              </button>

              <button
                onClick={() => setSelectedProrroga({ minutes: 15, price: 5 })}
                className={`w-full p-3 rounded-lg border-2 transition-all ${
                  selectedProrroga?.minutes === 15
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500/50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">15 minutos más</span>
                  <span className="text-purple-300 font-bold">5€</span>
                </div>
              </button>
            </div>
          </div>

          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={() => setShowProrrogaDialog(false)} className="flex-1 border-gray-700">
              {currentExpiredAlert?.isBuyer ? 'ACEPTAR DEVOLUCIÓN' : 'ACEPTAR COMPENSACIÓN'}
            </Button>
            <Button
              onClick={handleProrroga}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={!selectedProrroga}
            >
              PRORROGAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

================================================================
FILE: src/pages/DevDiagnostics.jsx
================================================================
```jsx
/**
 * Página de diagnóstico DEV — solo accesible en desarrollo.
 * Ruta: /dev-diagnostics (o #/dev-diagnostics con HashRouter)
 */
import { useAuth } from '@/lib/AuthContext';
import { useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Link } from 'react-router-dom';

export default function DevDiagnostics() {
  const { user, isLoadingAuth, isAuthenticated } = useAuth();
  const location = useLocation();
  const diag = typeof window !== 'undefined' ? window.__DEV_DIAG : {};

  const diagGlobal = typeof window !== 'undefined' ? window.__WAITME_DIAG__ : null;
  const lastErrors = diagGlobal?.errors?.slice(-3) || [];

  const rows = [
    { label: 'import.meta.env.DEV', value: String(import.meta.env.DEV) },
    { label: 'VITE_SAFE_MODE', value: String(import.meta.env.VITE_SAFE_MODE === 'true') },
    { label: 'VITE_DISABLE_MAP', value: String(import.meta.env.VITE_DISABLE_MAP === 'true') },
    { label: 'VITE_DISABLE_REALTIME', value: String(import.meta.env.VITE_DISABLE_REALTIME === 'true') },
    { label: 'VITE_BYPASS_AUTH', value: String(import.meta.env.VITE_BYPASS_AUTH === 'true') },
    { label: 'VITE_DEV_BYPASS_AUTH', value: String(import.meta.env.VITE_DEV_BYPASS_AUTH === 'true') },
    { label: 'Capacitor (nativo)', value: String(Capacitor.isNativePlatform()) },
    {
      label: 'Server URL',
      value: import.meta.env.VITE_CAPACITOR_SERVER_URL || '(ver capacitor.config)',
    },
    { label: 'Auth: user', value: user?.id ? `id=${user.id}` : 'null' },
    { label: 'Auth: isLoadingAuth', value: String(isLoadingAuth) },
    { label: 'Auth: isAuthenticated', value: String(isAuthenticated) },
    { label: 'Router: path', value: location.pathname || '/' },
    { label: 'Layout monta', value: String(diag?.layoutMounted ?? 'N/A') },
    { label: 'Home monta', value: String(diag?.homeMounted ?? 'N/A') },
    { label: 'MapboxMap monta', value: String(diag?.mapboxMounted ?? 'N/A') },
    { label: 'Realtime hook', value: import.meta.env.VITE_DISABLE_REALTIME === 'true' ? 'disabled' : 'active' },
    { label: 'mapRef disponible', value: String(diag?.mapRefAvailable ?? 'N/A') },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6 font-mono text-sm">
      <h1 className="text-xl font-bold text-purple-400 mb-4">Dev Diagnostics</h1>
      <Link to="/" className="text-purple-400 underline mb-4 block">
        ← Volver a Home
      </Link>
      <table className="w-full border-collapse">
        <tbody>
          {rows.map(({ label, value }) => (
            <tr key={label} className="border-b border-gray-700">
              <td className="py-2 pr-4 text-gray-400">{label}</td>
              <td className="py-2 text-purple-300">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {lastErrors.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h2 className="text-lg font-bold text-red-400 mb-2">Últimos errores</h2>
          {lastErrors.map((e, i) => (
            <pre
              key={i}
              className="text-xs text-red-300 bg-black/50 p-2 rounded mb-2 overflow-auto"
            >
              [{e.type}] {e.message}
              {e.stack ? `\n${e.stack}` : ''}
            </pre>
          ))}
        </div>
      )}
    </div>
  );
}

```
