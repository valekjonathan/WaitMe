import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Bell, MessageCircle } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';

export default function BottomNav() {
  const { user } = useAuth();

  const { data: activeAlerts = [] } = useQuery({
    queryKey: ['userActiveAlerts', user?.email],
    queryFn: async () => {
      const alerts = await base44.entities.ParkingAlert.filter({
        user_email: user?.email,
        status: 'active'
      });
      return alerts;
    },
    enabled: !!user?.email
  });

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['unreadNotifications', user?.email],
    queryFn: async () => {
      const notifs = await base44.entities.Notification.filter({
        recipient_email: user?.email,
        read: false
      });
      return notifs;
    },
    enabled: !!user?.email
  });

  const baseBtn =
    "w-full relative flex flex-col items-center gap-1 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 h-auto py-2 px-3 rounded-lg";

  // 🔑 CLAVE: reset=1 fuerza Home limpio (logo + botones)
  const homeResetUrl = createPageUrl('Home?reset=1');

  const badgeBase =
    "absolute top-1 right-2 bg-red-500/20 border-2 border-red-500/30 text-red-400 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center";
  const badgeGreen =
    "absolute top-1 right-2 bg-green-500/20 border-2 border-green-500/30 text-green-400 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center";

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t-2 border-gray-700 px-4 py-3 safe-area-pb z-50">
      <div className="flex items-center max-w-md mx-auto gap-0">
        <Link to={createPageUrl('History')} className="flex-1 min-w-0">
          <Button variant="ghost" className={baseBtn}>
            <span className="text-[10px] font-bold">Alertas</span>
            {activeAlerts.length > 0 && (
              <span className={badgeGreen}>
                {activeAlerts.length > 9 ? '9+' : activeAlerts.length}
              </span>
            )}
          </Button>
        </Link>

        <div className="w-px h-10 bg-gray-700" />

        {/* ✅ MAPA: SIEMPRE vuelve al logo */}
        <a
          href={homeResetUrl}
          className="flex-1 min-w-0"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = homeResetUrl;
          }}
        >
          <Button variant="ghost" className={baseBtn}>
            <span className="text-[10px] font-bold">Mapa</span>
          </Button>
        </a>

        <div className="w-px h-10 bg-gray-700" />

        <Link to={createPageUrl('Notifications')} className="flex-1 min-w-0">
          <Button variant="ghost" className={baseBtn}>
            <Bell className="w-8 h-8" />
            <span className="text-[10px] font-bold">Notificaciones</span>
            {unreadNotifications.length > 0 && (
              <span className={badgeBase}>
                {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
              </span>
            )}
          </Button>
        </Link>

        <div className="w-px h-10 bg-gray-700" />

        <Link to={createPageUrl('Chats')} className="flex-1 min-w-0">
          <Button variant="ghost" className={baseBtn}>
            <MessageCircle className="w-8 h-8" />
            <span className="text-[10px] font-bold">Chats</span>
          </Button>
        </Link>
      </div>
    </nav>
  );
}