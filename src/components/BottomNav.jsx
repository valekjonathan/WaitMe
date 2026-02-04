import React, { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Bell, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function BottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Prefetch para que al pulsar "Chats" cargue instantáneo
  const prefetchChats = useCallback(() => {
    if (!user?.id) return;

    const conversationsKey = ['conversations', user.id];
    const alertsKey = ['alertsForChatsList', user.id];

    queryClient.prefetchQuery({
      queryKey: conversationsKey,
      queryFn: async () => {
        const [asP1, asP2] = await Promise.all([
          base44.entities.Conversation.filter({ participant1_id: user.id }),
          base44.entities.Conversation.filter({ participant2_id: user.id })
        ]);

        const map = new Map();
        [...(asP1 || []), ...(asP2 || [])].forEach((c) => {
          if (c?.id) map.set(c.id, c);
        });

        const merged = Array.from(map.values());
        merged.sort((a, b) => {
          const ta = new Date(a.last_message_at || a.updated_date || a.created_date || 0).getTime();
          const tb = new Date(b.last_message_at || b.updated_date || b.created_date || 0).getTime();
          return tb - ta;
        });

        return merged;
      },
      staleTime: 5 * 60 * 1000
    });

    queryClient.prefetchQuery({
      queryKey: alertsKey,
      queryFn: async () => base44.entities.ParkingAlert.list('-created_date', 200),
      staleTime: 5 * 60 * 1000
    });
  }, [queryClient, user?.id]);

  const { data: activeAlerts = [] } = useQuery({
    queryKey: ['userActiveAlerts', user?.id],
    queryFn: async () => base44.entities.ParkingAlert.filter({ user_id: user?.id, status: 'active' }),
    enabled: !!user?.id,
    staleTime: 60000,
    refetchInterval: false
  });

  const { data: reservedAlerts = [] } = useQuery({
    queryKey: ['userReservedAlerts', user?.id],
    queryFn: async () => base44.entities.ParkingAlert.filter({ reserved_by_id: user?.id, status: 'reserved' }),
    enabled: !!user?.id,
    staleTime: 60000,
    refetchInterval: false
  });

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['unreadNotifications', user?.id],
    queryFn: async () => base44.entities.Notification.filter({ recipient_id: user?.id, read: false }),
    enabled: !!user?.id,
    staleTime: 60000,
    refetchInterval: false
  });

  const baseBtn =
    'w-full relative flex flex-col items-center gap-1 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 h-auto py-2 px-3 rounded-lg';

  const homeUrl = createPageUrl('Home');

  const badgeBase =
    'absolute top-1 right-2 bg-red-500/20 border-2 border-red-500/30 text-red-400 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center';
  const badgeGreen =
    'absolute top-1 left-2 bg-green-500/20 border-2 border-green-500/30 text-green-400 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center';
  const badgePurple =
    'absolute top-1 right-2 bg-purple-500/20 border-2 border-purple-500/30 text-purple-400 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t-2 border-gray-700 px-4 py-3 safe-area-pb z-50">
      <div className="flex items-center max-w-md mx-auto gap-0">
        <Link to={createPageUrl('History')} className="flex-1 min-w-0">
          <Button variant="ghost" className={baseBtn}>
            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
              <path d="M30 8 L14 8 L14 5 L8 10 L14 15 L14 12 L30 12 Z" fill="currentColor" />
              <path d="M2 20 L18 20 L18 17 L24 22 L18 27 L18 24 L2 24 Z" fill="currentColor" />
            </svg>
            <span className="text-[10px] font-bold whitespace-nowrap truncate">Alertas</span>

            {activeAlerts.length > 0 && (
              <span className={badgeGreen}>{activeAlerts.length > 9 ? '9+' : activeAlerts.length}</span>
            )}

            {reservedAlerts.length > 0 && (
              <span className={badgePurple}>{reservedAlerts.length > 9 ? '9+' : reservedAlerts.length}</span>
            )}
          </Button>
        </Link>

        <div className="w-px h-10 bg-gray-700" />

        <button type="button" className="flex-1 min-w-0" onClick={() => navigate(homeUrl + '?reset=' + Date.now())}>
          <Button variant="ghost" className={baseBtn}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <span className="text-[10px] font-bold whitespace-nowrap truncate">Mapa</span>
          </Button>
        </button>

        <div className="w-px h-10 bg-gray-700" />

        <Link to={createPageUrl('Notifications')} className="flex-1 min-w-0">
          <Button variant="ghost" className={baseBtn}>
            <Bell className="w-8 h-8" />
            <span className="text-[10px] font-bold whitespace-nowrap truncate">Notificaciones</span>

            {unreadNotifications.length > 0 && (
              <span className={badgeBase}>
                {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
              </span>
            )}
          </Button>
        </Link>

        <div className="w-px h-10 bg-gray-700" />

        <Link
          to={createPageUrl('Chats')}
          className="flex-1 min-w-0"
          onMouseEnter={prefetchChats}
          onTouchStart={prefetchChats}
          onFocus={prefetchChats}
        >
          <Button variant="ghost" className={baseBtn}>
            <MessageCircle className="w-8 h-8" />
            <span className="text-[10px] font-bold whitespace-nowrap truncate">Chats</span>
          </Button>
        </Link>
      </div>
    </nav>
  );
}