import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Send, Paperclip, Camera, Image as ImageIcon, Phone, Check } from 'lucide-react';
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
} from '@/lib/demoFlow';

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
  const isDemo = !conversationId || urlParams.get('demo') === 'true';

  /* ======================
     DEMO FLOW (sin cargas)
  ====================== */
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!isDemo) return;
    startDemoFlow();
    const unsub = subscribeDemoFlow(() => forceTick(x => x + 1));
    return () => unsub?.();
  }, [isDemo]);

  const demoState = isDemo ? demoFlow() : null;
  const demoConversationId = isDemo
    ? conversationId || demoState?.conversations?.[0]?.id || null
    : null;

  const demoConversation = isDemo ? getDemoConversation(demoConversationId) : null;
  const demoMessages = isDemo ? getDemoMessages(demoConversationId) || [] : [];
  const demoOtherUser =
    isDemo && demoConversation
      ? demoState?.users?.[demoConversation.otherUserId]
      : null;

  useEffect(() => {
    if (isDemo && demoConversationId) {
      markDemoRead(demoConversationId);
    }
  }, [isDemo, demoConversationId]);

  /* ======================
     USUARIO REAL
  ====================== */
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    enabled: !isDemo,
    staleTime: 60000
  });

  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    enabled: !!conversationId && !isDemo,
    queryFn: async () => {
      const res = await base44.entities.Conversation.filter({ id: conversationId });
      return res?.[0] || null;
    }
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', conversationId],
    enabled: !!conversationId && !isDemo,
    queryFn: async () => {
      const res = await base44.entities.ChatMessage.filter({
        conversation_id: conversationId
      });
      return (res || []).sort(
        (a, b) => new Date(a.created_date) - new Date(b.created_date)
      );
    }
  });

  const activeMessages = isDemo ? demoMessages : messages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [activeMessages]);

  /* ======================
     ENVÍO MENSAJES
  ====================== */
  const sendMutation = useMutation({
    mutationFn: async text => {
      if (isDemo) {
        if (demoConversationId && text.trim()) {
          sendDemoMessage(demoConversationId, text, attachments);
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
        sender_id: user.id,
        sender_name: user.display_name || 'Usuario',
        sender_photo: user.photo_url,
        receiver_id: otherUserId,
        message: text,
        read: false,
        message_type: 'user'
      });

      await base44.entities.Conversation.update(conversation.id, {
        last_message_text: text,
        last_message_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      setMessage('');
      setAttachments([]);
      queryClient.invalidateQueries(['chatMessages', conversationId]);
      queryClient.invalidateQueries(['conversations']);
    }
  });

  const handleSend = () => {
    if (!message.trim() && attachments.length === 0) return;
    if (isDemo) {
      sendDemoMessage(demoConversationId, message, attachments);
      setMessage('');
      setAttachments([]);
      setShowAttachMenu(false);
      return;
    }
    sendMutation.mutate(message);
  };

  /* ======================
     USUARIO CABECERA
  ====================== */
  const otherUser = isDemo
    ? {
        name: demoOtherUser?.name || 'Usuario',
        photo: demoOtherUser?.photo || null
      }
    : {
        name:
          conversation?.participant1_id === user?.id
            ? conversation?.participant2_name
            : conversation?.participant1_name,
        photo:
          conversation?.participant1_id === user?.id
            ? conversation?.participant2_photo
            : conversation?.participant1_photo
      };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header title="Chat" showBackButton backTo="Chats" />

      {/* HEADER USUARIO */}
      <div className="fixed top-[56px] left-0 right-0 z-40 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-purple-500/40">
            {otherUser.photo ? (
              <img src={otherUser.photo} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">👤</div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold">{otherUser.name}</p>
            <p className="text-xs text-gray-400">En línea</p>
          </div>
          <div className="p-2 border border-purple-500/40 rounded-lg">
            <Phone className="w-5 h-5 text-purple-300" />
          </div>
        </div>
      </div>

      {/* MENSAJES */}
      <div className="flex-1 overflow-y-auto pt-[120px] pb-[160px] px-4">
        <div className="space-y-4">
          {activeMessages.map((msg, idx) => {
            const isMine = msg.sender_id === user?.id || msg.sender_id === 'you';
            return (
              <motion.div key={msg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2`}>
                  {!isMine && (
                    <img
                      src={msg.sender_photo}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl max-w-[260px] ${
                      isMine
                        ? 'bg-purple-600 text-white rounded-br-sm'
                        : 'bg-gray-800 text-white rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <div className="text-[10px] text-right opacity-60">
                      {format(new Date(msg.created_date), 'HH:mm')}
                    </div>
                  </div>
                  {isMine && (
                    <img
                      src={user?.photo_url}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 pb-20">
        <div className="flex items-center gap-2 px-4 py-3">
          <Button variant="ghost" onClick={() => setShowAttachMenu(!showAttachMenu)}>
            <Paperclip className="w-5 h-5 text-purple-400" />
          </Button>
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-purple-900/30 border border-purple-700 rounded px-4 py-2 text-white"
            placeholder="Escribe un mensaje..."
          />
          <Button onClick={handleSend} className="bg-purple-600">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}