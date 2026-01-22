import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Bell, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function BottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: activeAlerts = [] } = useQuery({
    queryKey: ['userActiveAlerts', user?.email],
    queryFn: async () =>
      await base44.entities.ParkingAlert.filter({
        user_email: user?.email,
        status: 'active'
      }),
    enabled: !!user?.email,
    refetchInterval: 20000
  });

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['unreadNotifications', user?.email],
    queryFn: async () =>
      await base44.entities.Notification.filter({
        recipient_email: user?.email,
        read: false
      }),
    enabled: !!user?.email,
    refetchInterval: 20000
  });

  const baseBtn =
    "w-full relative flex flex-col items-center gap-1 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 h-auto py-2 px-3 rounded-lg";

  const badge =
    "absolute top-1 right-2 bg-red-500/20 border-2 border-red-500/30 text-red-400 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center";

  const badgeGreen =
    "absolute top-1 right-2 bg-green-500/20 border-2 border-green-500/30 text-green-400 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center";

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t-2 border-gray-700 px-4 py-3 safe-area-pb z-50">
      <div className="flex items-center max-w-md mx-auto gap-0">

        <Button
          variant="ghost"
          className={`flex-1 ${baseBtn}`}
          onClick={() => navigate(createPageUrl('History'))}
        >
          <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
            <path d="M30 8 L14 8 L14 5 L8 10 L14 15 L14 12 L30 12 Z" fill="currentColor"/>
            <path d="M2 20 L18 20 L18 17 L24 22 L18 27 L18 24 L2 24 Z" fill="currentColor"/>
          </svg>
          <span className="text-[10px] font-bold">Alertas</span>
          {activeAlerts.length > 0 && (
            <span className={badgeGreen}>
              {activeAlerts.length > 9 ? '9+' : activeAlerts.length}
            </span>
          )}
        </Button>

        <div className="w-px h-10 bg-gray-700" />

        {/* MAPA – vuelve SIEMPRE a Home limpio */}
        <Button
          variant="ghost"
          className={`flex-1 ${baseBtn}`}
          onClick={() =>
            navigate(createPageUrl('Home'), {
              replace: true,
              state: { reset: Date.now() }
            })
          }
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span className="text-[10px] font-bold">Mapa</span>
        </Button>

        <div className="w-px h-10 bg-gray-700" />

        <Button
          variant="ghost"
          className={`flex-1 ${baseBtn}`}
          onClick={() => navigate(createPageUrl('Notifications'))}
        >
          <Bell className="w-8 h-8" />
          <span className="text-[10px] font-bold">Notificaciones</span>
          {unreadNotifications.length > 0 && (
            <span className={badge}>
              {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
            </span>
          )}
        </Button>

        <div className="w-px h-10 bg-gray-700" />

        <Button
          variant="ghost"
          className={`flex-1 ${baseBtn}`}
          onClick={() => navigate(createPageUrl('Chats'))}
        >
          <MessageCircle className="w-8 h-8" />
          <span className="text-[10px] font-bold">Chats</span>
        </Button>

      </div>
    </nav>
  );
}