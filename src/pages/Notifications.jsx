import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, MessageCircle, Navigation, TrendingUp, TrendingDown, X, Check } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

// ===== helpers =====
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
    case 'extended':
    case 'prorroga':
    case 'prórroga':
      return 'PRÓRROGA';
    case 'cancelled':
    case 'canceled':
    case 'cancelada':
      return 'CANCELADA';
    default:
      return null;
  }
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

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id ?? 'none'],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await base44.entities.Notification.list('-created_date', 100);
      // Solo las mías
      return (res || []).filter((n) => n.recipient_id === user.id);
    },
    staleTime: 15000,
    refetchOnWindowFocus: false
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', user?.id ?? 'none'],
    enabled: !!user?.id,
    queryFn: async () => await base44.entities.Conversation.list('-last_message_at', 50),
    staleTime: 15000,
    refetchOnWindowFocus: false
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alertsForNotifications', user?.id ?? 'none'],
    enabled: !!user?.id,
    queryFn: async () => await base44.entities.ParkingAlert.list('-created_date', 120),
    staleTime: 15000,
    refetchOnWindowFocus: false
  });

  const byId = useMemo(() => {
    const m = new Map();
    for (const a of alerts || []) m.set(String(a.id), a);
    return m;
  }, [alerts]);

  const findConversationByAlert = (alertId) =>
    (conversations || []).find((c) => String(c.alert_id) === String(alertId)) || null;

  const markReadMutation = useMutation({
    mutationFn: async (n) => {
      if (!n?.id) return;
      await base44.entities.Notification.update(n.id, { read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications', user?.id] });
    }
  });

  const actionMutation = useMutation({
    mutationFn: async ({ alert, nextStatus, systemText }) => {
      if (!alert?.id) return;

      const conv = findConversationByAlert(alert.id);
      if (!conv) return;

      const otherUserId = conv.participant1_id === user?.id ? conv.participant2_id : conv.participant1_id;

      await base44.entities.ParkingAlert.update(alert.id, { status: nextStatus });

      if (systemText) {
        await base44.entities.ChatMessage.create({
          conversation_id: conv.id,
          alert_id: alert.id,
          sender_id: user?.id,
          sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Usuario',
          sender_photo: user?.photo_url,
          receiver_id: otherUserId,
          message: systemText,
          read: false,
          message_type: 'system'
        });

        await base44.entities.Conversation.update(conv.id, {
          last_message_text: systemText,
          last_message_at: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertsForNotifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['alertsForChats'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
    }
  });

  const openChat = (conv, otherName, otherPhoto) => {
    const name = encodeURIComponent(otherName || '');
    const photo = encodeURIComponent(otherPhoto || '');
    navigate(createPageUrl(`Chat?conversationId=${conv.id}&otherName=${name}&otherPhoto=${photo}`));
  };

  const sorted = useMemo(() => {
    return [...(notifications || [])].sort(
      (a, b) => new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime()
    );
  }, [notifications]);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <Header title="Notificaciones" showBackButton={false} />
      <main className="max-w-md mx-auto px-4 pt-4">
        {sorted.length === 0 ? (
          <div className="text-center text-gray-400 mt-12">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-60" />
            <p className="font-bold">Sin notificaciones</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((n, idx) => {
              const alert = n.alert_id ? byId.get(String(n.alert_id)) : null;
              const conv = alert ? findConversationByAlert(alert.id) : null;

              const isUnread = n.read === false;
              const statusLabel = alert ? getChatStatusLabel(alert.status) : null;

              const isBuyer = alert?.reserved_by_id === user?.id;
              const isSeller = !!alert?.reserved_by_id && !isBuyer;

              const otherName =
                conv?.participant1_id === user?.id ? conv?.participant2_name : conv?.participant1_name;
              const otherPhoto =
                conv?.participant1_id === user?.id ? conv?.participant2_photo : conv?.participant1_photo;

              return (
                <motion.div
                  key={n.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`rounded-xl border-2 ${isUnread ? 'border-purple-500/50' : 'border-purple-500/30'} bg-gray-900/60 p-3`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`${isUnread ? 'bg-purple-500/20 text-purple-300 border-purple-400/50' : 'bg-purple-500/10 text-purple-300/70 border-purple-400/30'} border font-bold`}>
                        {n.type || 'notificación'}
                      </Badge>
                      {statusLabel && (
                        <span className="text-xs text-purple-300 font-bold">{statusLabel}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {alert && (
                        <PriceChip amount={alert.price || 0} direction={isBuyer ? 'down' : isSeller ? 'up' : null} />
                      )}
                      {isUnread && (
                        <Button
                          size="sm"
                          className="h-7 bg-black/40 border border-purple-500/30 text-purple-200"
                          onClick={() => markReadMutation.mutate(n)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-gray-300">
                    {n.type === 'extension_request'
                      ? `Prórroga: ${n.extension_minutes || ''} min · ${n.amount || ''}€`
                      : n.type === 'payment_completed'
                      ? 'Pago completado'
                      : n.type === 'status_update'
                      ? 'Actualización de estado'
                      : 'Aviso'}
                  </div>

                  {alert && conv && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        className="flex-1 h-9 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30"
                        onClick={() => {
                          if (isUnread) markReadMutation.mutate(n);
                          openChat(conv, otherName, otherPhoto);
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" /> CHAT
                      </Button>

                      <Button
                        className="h-9 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30"
                        onClick={() => actionMutation.mutate({ alert, nextStatus: 'prorroga', systemText: '⏱️ Prórroga' })}
                      >
                        PRÓRROGA
                      </Button>

                      <Button
                        className="h-9 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30"
                        onClick={() => actionMutation.mutate({ alert, nextStatus: 'me_lo_pienso', systemText: 'Ey! me lo pienso 🤔' })}
                      >
                        ME LO PIENSO
                      </Button>

                      <Button
                        className="h-9 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30"
                        onClick={() => actionMutation.mutate({ alert, nextStatus: 'cancelada', systemText: '❌ Cancelada' })}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
