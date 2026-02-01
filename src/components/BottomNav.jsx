import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Bell, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function BottomNav() {
  const { user } = useAuth();

  const { data: activeAlerts = [] } = useQuery({
    queryKey: ['userActiveAlerts', user?.id],
    queryFn: async () =>
      base44.entities.ParkingAlert.filter({ user_id: user?.id, status: 'active' }),
    enabled: !!user?.id,
    staleTime: 60000
  });

  const { data: reservedAlerts = [] } = useQuery({
    queryKey: ['userReservedAlerts', user?.id],
    queryFn: async () =>
      base44.entities.ParkingAlert.filter({ reserved_by_id: user?.id, status: 'reserved' }),
    enabled: !!user?.id,
    staleTime: 60000
  });

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['unreadNotifications', user?.id],
    queryFn: async () =>
      base44.entities.Notification.filter({ recipient_id: user?.id, read: false }),
    enabled: !!user?.id,
    staleTime: 60000
  });

  const baseBtn =
    'w-full h-[39px] flex flex-col items-center justify-center gap-[1px] text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 rounded-lg';

  const iconCls = 'w-5 h-5 shrink-0';
  const textCls =
    'text-[9px] font-semibold leading-[9px] whitespace-nowrap truncate';

  const badgeBase =
    'absolute top-0 right-1 bg-red-500/20 border-2 border-red-500/30 text-red-400 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center';
  const badgeGreen =
    'absolute top-0 left-1 bg-green-500/20 border-2 border-green-500/30 text-green-400 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center';
  const badgePurple =
    'absolute top-0 right-1 bg-purple-500/20 border-2 border-purple-500/30 text-purple-400 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t-2 border-gray-700 px-4 py-2 safe-area-pb z-50">
      <div className="flex items-center max-w-md mx-auto gap-1">
        {/* ALERTAS */}
        <Link to={createPageUrl('History')} className="flex-1 relative">
          <Button variant="ghost" className={baseBtn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={iconCls}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={textCls}>Alertas</span>

            {activeAlerts.length > 0 && (
              <span className={badgeGreen}>
                {activeAlerts.length > 9 ? '9+' : activeAlerts.length}
              </span>
            )}

            {reservedAlerts.length > 0 && (
              <span className={badgePurple}>
                {reservedAlerts.length > 9 ? '9+' : reservedAlerts.length}
              </span>
            )}
          </Button>
        </Link>

        <div className="w-px h-8 bg-gray-700/50" />

        {/* MAPA */}
        <Link to={createPageUrl('Home')} className="flex-1">
          <Button variant="ghost" className={baseBtn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={iconCls}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className={textCls}>Mapa</span>
          </Button>
        </Link>

        <div className="w-px h-8 bg-gray-700/50" />

        {/* NOTIFICACIONES */}
        <Link to={createPageUrl('Notifications')} className="flex-1 relative">
          <Button variant="ghost" className={baseBtn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={iconCls}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className={textCls}>Notificaciones</span>

            {unreadNotifications.length > 0 && (
              <span className={badgeBase}>
                {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
              </span>
            )}
          </Button>
        </Link>

        <div className="w-px h-8 bg-gray-700/50" />

        {/* CHATS */}
        <Link to={createPageUrl('Chats')} className="flex-1">
          <Button variant="ghost" className={baseBtn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={iconCls}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className={textCls}>Chats</span>
          </Button>
        </Link>
      </div>
    </nav>
  );
}