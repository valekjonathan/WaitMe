import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Bell, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function BottomNav() {
  const { user } = useAuth();

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

  const badgeRed =
    "absolute top-1 right-2 bg-red-500/20 border-2 border-red-500/30 text-red-400 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center";

  const badgeGreen =
    "absolute top-1 right-2 bg-green-500/20 border-2 border-green-500/30 text-green-400 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center";

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t-2 border-gray-700 px-4 py-3 z-50">
      <div className="flex items-center max-w-md mx-auto gap-0">

        <Button className={`flex-1 ${baseBtn}`}>
          <span className="text-[10px] font-bold">Alertas</span>
          {activeAlerts.length > 0 && (
            <span className={badgeGreen}>
              {activeAlerts.length > 9 ? '9+' : activeAlerts.length}
            </span>
          )}
        </Button>

        <div className="w-px h-10 bg-gray-700" />

        {/* MAPA — RESET TOTAL DE HOME */}
        <Button
          className={`flex-1 ${baseBtn}`}
          onClick={() => {
            window.dispatchEvent(new Event('RESET_HOME'));
          }}
        >
          <span className="text-[10px] font-bold">Mapa</span>
        </Button>

        <div className="w-px h-10 bg-gray-700" />

        <Button className={`flex-1 ${baseBtn}`}>
          <Bell className="w-6 h-6" />
          <span className="text-[10px] font-bold">Notificaciones</span>
          {unreadNotifications.length > 0 && (
            <span className={badgeRed}>
              {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
            </span>
          )}
        </Button>

        <div className="w-px h-10 bg-gray-700" />

        <Button className={`flex-1 ${baseBtn}`}>
          <MessageCircle className="w-6 h-6" />
          <span className="text-[10px] font-bold">Chats</span>
        </Button>

      </div>
    </nav>
  );
}