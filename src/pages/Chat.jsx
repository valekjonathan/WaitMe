import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Phone, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

const DEMO_PROFILES = {
  demo_1: { name: 'Sofía', photo: 'https://randomuser.me/api/portraits/women/44.jpg', allowCalls: true, phone: '600123123' },
  demo_2: { name: 'Marco', photo: 'https://randomuser.me/api/portraits/men/32.jpg', allowCalls: true, phone: '600456789' },
  demo_3: { name: 'Nerea', photo: 'https://randomuser.me/api/portraits/women/68.jpg', allowCalls: false, phone: null }
};

const demoSeedMessages = (conversationId) => {
  const p = DEMO_PROFILES[conversationId] || { name: 'Usuario', photo: null };
  return [
    {
      id: `seed_${conversationId}_1`,
      created_date: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      sender_id: 'other',
      sender_name: p.name,
      sender_photo: p.photo,
      message: 'Hola! Soy yo. Dime cuando vas llegando 🙂'
    },
    {
      id: `seed_${conversationId}_2`,
      created_date: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      sender_id: 'me',
      sender_name: 'Tú',
      sender_photo: null,
      message: 'Perfecto, voy de camino.'
    }
  ];
};

const storageKey = (conversationId) => `waitme_demo_chat_${conversationId}`;

const loadDemoMessages = (conversationId) => {
  try {
    const raw = localStorage.getItem(storageKey(conversationId));
    if (raw) return JSON.parse(raw);
  } catch {}
  const seed = demoSeedMessages(conversationId);
  try {
    localStorage.setItem(storageKey(conversationId), JSON.stringify(seed));
  } catch {}
  return seed;
};

const saveDemoMessages = (conversationId, list) => {
  try {
    localStorage.setItem(storageKey(conversationId), JSON.stringify(list));
  } catch {}
};

const pickReply = (conversationId, text) => {
  const t = String(text || '').toLowerCase();
  const name = (DEMO_PROFILES[conversationId]?.name || 'Yo').split(' ')[0];

  if (t.includes('llego') || t.includes('llegando') || t.includes('estoy cerca')) {
    return `Perfecto, ${name} aquí espera. Avísame cuando estés a 1 minuto.`;
  }
  if (t.includes('cuánto') || t.includes('cuanto') || t.includes('min')) {
    return `Vale. Yo aguanto el tiempo que puse. Escríbeme si cambias algo.`;
  }
  if (t.includes('llamo') || t.includes('llamar')) {
    return DEMO_PROFILES[conversationId]?.allowCalls ? 'Sí, puedes llamarme si quieres.' : 'Prefiero solo chat 🙂';
  }
  if (t.includes('ok') || t.includes('vale') || t.includes('perfecto')) {
    return 'Genial 👍';
  }
  return 'Dale, te leo. ¿Por dónde vienes?';
};

export default function Chat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('conversationId') || '';
  const isDemo = conversationId.startsWith('demo_');

  const [text, setText] = useState('');
  const [demoMessages, setDemoMessages] = useState(() => (isDemo ? loadDemoMessages(conversationId) : []));
  const listRef = useRef(null);
  const replyTimerRef = useRef(null);

  // Usuario (solo si NO demo)
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    enabled: !isDemo,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false
  });

  // Conversación (solo si NO demo)
  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const res = await base44.entities.Conversation.filter({ id: conversationId });
      const list = Array.isArray(res) ? res : res?.data || [];
      return list[0] || null;
    },
    enabled: !isDemo && !!conversationId,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: false
  });

  // Mensajes (solo si NO demo)
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const res = await base44.entities.ChatMessage.filter({ conversation_id: conversationId }, '-created_date', 200);
      return Array.isArray(res) ? res : res?.data || [];
    },
    enabled: !isDemo && !!conversationId,
    staleTime: 2 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false
  });

  // Auto-scroll
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [demoMessages, messages?.length]);

  useEffect(() => {
    return () => {
      if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    };
  }, []);

  const otherProfile = useMemo(() => {
    if (isDemo) {
      return DEMO_PROFILES[conversationId] || { name: 'Usuario', photo: null, allowCalls: false, phone: null };
    }
    // Para real: intenta sacar del objeto conversación
    const otherName =
      conversation?.participant1_id === me?.id ? conversation?.participant2_name : conversation?.participant1_name;
    const otherPhoto =
      conversation?.participant1_id === me?.id ? conversation?.participant2_photo : conversation?.participant1_photo;

    return {
      name: (otherName || 'Usuario').split(' ')[0],
      photo: otherPhoto || null,
      allowCalls: false,
      phone: null
    };
  }, [isDemo, conversationId, conversation, me?.id]);

  const sendMutation = useMutation({
    mutationFn: async (msgText) => {
      const clean = String(msgText || '').trim();
      if (!clean) return;

      // DEMO: localStorage + respuesta automática
      if (isDemo) {
        const nowIso = new Date().toISOString();
        const newMsg = {
          id: `demo_${Date.now()}_me`,
          created_date: nowIso,
          sender_id: 'me',
          sender_name: 'Tú',
          sender_photo: null,
          message: clean
        };

        const next = [...demoMessages, newMsg];
        setDemoMessages(next);
        saveDemoMessages(conversationId, next);

        // Respuesta automática rápida (sin bloquear UI)
        replyTimerRef.current = setTimeout(() => {
          const replyText = pickReply(conversationId, clean);
          const reply = {
            id: `demo_${Date.now()}_other`,
            created_date: new Date().toISOString(),
            sender_id: 'other',
            sender_name: otherProfile.name,
            sender_photo: otherProfile.photo,
            message: replyText
          };
          const next2 = [...(loadDemoMessages(conversationId) || next), reply];
          setDemoMessages(next2);
          saveDemoMessages(conversationId, next2);
        }, 650);

        return;
      }

      // REAL: Base44
      if (!conversationId) return;
      await base44.entities.ChatMessage.create({
        conversation_id: conversationId,
        sender_id: me?.id,
        sender_name: me?.display_name || (me?.full_name ? me.full_name.split(' ')[0] : 'Usuario'),
        sender_photo: me?.photo_url,
        message: clean,
        read: false,
        message_type: 'text'
      });

      // (opcional) actualizar last_message en Conversation si existe ese campo en tu entidad
      try {
        await base44.entities.Conversation.update(conversationId, {
          last_message_text: clean,
          last_message_at: new Date().toISOString()
        });
      } catch {}

      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversationsForUser'] });
    }
  });

  const onSend = () => {
    const clean = text.trim();
    if (!clean) return;
    setText('');
    sendMutation.mutate(clean);
  };

  const renderList = isDemo ? demoMessages : messages;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header title={otherProfile.name ? `Chat con ${otherProfile.name}` : 'Chat'} showBackButton={true} backTo="Chats" />

      <main className="pt-[60px] pb-28 flex-1 flex flex-col">
        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {!isDemo && loadingMessages ? (
            <div className="text-center py-12 text-gray-500">Cargando...</div>
          ) : renderList.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Sin mensajes</div>
          ) : (
            renderList
              .slice()
              .reverse()
              .map((m) => {
                const mine = isDemo ? m.sender_id === 'me' : m.sender_id === me?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm border ${
                        mine
                          ? 'bg-purple-600/25 border-purple-500/40 text-white'
                          : 'bg-gray-900 border-gray-800 text-gray-100'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.message}</div>
                      <div className="text-[10px] mt-1 opacity-60">
                        {new Date(m.created_date || Date.now()).toLocaleTimeString('es-ES', {
                          timeZone: 'Europe/Madrid',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="bg-gray-900 border-gray-800 text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSend();
              }}
            />

            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white h-10 w-10 p-0"
              onClick={onSend}
              disabled={sendMutation.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>

            {otherProfile.allowCalls ? (
              <Button
                className="bg-white hover:bg-gray-100 text-black h-10 w-10 p-0"
                onClick={() => otherProfile.phone && (window.location.href = `tel:${otherProfile.phone}`)}
              >
                <Phone className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                className="border-white/30 bg-white/10 text-white h-10 w-10 p-0 opacity-70 cursor-not-allowed"
                disabled
              >
                <PhoneOff className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}