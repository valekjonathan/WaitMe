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
    'w-full h-[50px] flex flex-col items-center justify-center gap-0.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 rounded-lg transition-all';

  const iconCls = 'w-7 h-7 shrink-0';
  const textCls =
    'text-[10px] font-bold leading-[10px] whitespace-nowrap truncate mt-0.5';

  const badgeBase =
    'absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-lg';
  const badgeGreen =
    'absolute -top-0.5 -left-0.5 bg-green-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-lg';
  const badgePurple =
    'absolute -top-0.5 -right-0.5 bg-purple-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-lg';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t-2 border-gray-700 px-3 safe-area-pb z-50" style={{ height: '50px' }}>
      <div className="flex items-center h-full max-w-md mx-auto gap-0.5">
        {/* ALERTAS */}
        <Link to={createPageUrl('History')} className="flex-1 relative">
          <Button variant="ghost" className={baseBtn}>
            <svg viewBox="0 0 24 24" fill="currentColor" className={iconCls}>
              <path d="M9 2C8.44772 2 8 2.44772 8 3V4H6C4.89543 4 4 4.89543 4 6V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V6C20 4.89543 19.1046 4 18 4H16V3C16 2.44772 15.5523 2 15 2C14.4477 2 14 2.44772 14 3V4H10V3C10 2.44772 9.55228 2 9 2ZM6 9V20H18V9H6ZM8 11H10V13H8V11ZM12 11H14V13H12V11ZM16 11H18V13H16V11ZM8 15H10V17H8V15ZM12 15H14V17H12V15Z" />
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

        {/* MAPA */}
        <Link to={createPageUrl('Home')} className="flex-1">
          <Button variant="ghost" className={baseBtn}>
            <svg viewBox="0 0 24 24" fill="currentColor" className={iconCls}>
              <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" />
            </svg>
            <span className={textCls}>Mapa</span>
          </Button>
        </Link>

        {/* NOTIFICACIONES */}
        <Link to={createPageUrl('Notifications')} className="flex-1 relative">
          <Button variant="ghost" className={baseBtn}>
            <svg viewBox="0 0 24 24" fill="currentColor" className={iconCls}>
              <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" />
            </svg>
            <span className={textCls}>Notificaciones</span>

            {unreadNotifications.length > 0 && (
              <span className={badgeBase}>
                {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
              </span>
            )}
          </Button>
        </Link>

        {/* CHATS */}
        <Link to={createPageUrl('Chats')} className="flex-1">
          <Button variant="ghost" className={baseBtn}>
            <svg viewBox="0 0 24 24" fill="currentColor" className={iconCls}>
              <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM7 9H17V11H7V9ZM13 14H7V12H13V14ZM17 8H7V6H17V8Z" />
            </svg>
            <span className={textCls}>Chats</span>
          </Button>
        </Link>
      </div>
    </nav>
  );
}