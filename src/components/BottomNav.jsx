import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Bell, MessageCircle } from 'lucide-react';

export default function BottomNav() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Error:', error);
      }
    };
    fetchUser();
  }, []);

  const { data: activeAlerts = [] } = useQuery({
    queryKey: ['userActiveAlerts', user?.email],
    queryFn: async () => {
      try {
        if (!base44?.entities?.ParkingAlert) return [];
        const alerts = await base44.entities.ParkingAlert.filter({
          user_email: user?.email,
          status: 'active'
        });
        return Array.isArray(alerts) ? alerts : [];
      } catch {
        return [];
      }
    },
    enabled: !!user?.email,
    refetchInterval: 20000
  });

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['unreadNotifications', user?.email],
    queryFn: async () => {
      try {
        if (!base44?.entities?.Notification) return [];
        const notifs = await base44.entities.Notification.filter({
          recipient_email: user?.email,
          read: false
        });
        return Array.isArray(notifs) ? notifs : [];
      } catch {
        return [];
      }
    },
    enabled: !!user?.email,
    refetchInterval: 20000
  });

  const baseBtn =
    'w-full min-w-0 flex flex-col items-center gap-1 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 h-auto py-2 px-3 rounded-lg';

  const labelCls =
    'w-full text-center text-[9px] font-bold whitespace-nowrap leading-none tracking-tight';

  // BADGE: misma altura, más a la derecha, y por encima
  const badgeBase =
    'absolute top-1 right-2 z-20 pointer-events-none rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border-2';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t-2 border-gray-700 px-4 py-3 safe-area-pb z-50">
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center max-w-md mx-auto gap-0">

        {/* ALERTAS */}
        <Link to={createPageUrl('History')} className="w-full">
          <div className="relative w-full">
            <Button variant="ghost" className={baseBtn}>
              <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                <path d="M30 8 L14 8 L14 5 L8 10 L14 15 L14 12 L30 12 Z" fill="currentColor"/>
                <path d="M2 20 L18 20 L18 17 L24 22 L18 27 L18 24 L2 24 Z" fill="currentColor"/>
              </svg>
              <span className={labelCls}>Alertas</span>
            </Button>

            {activeAlerts.length > 0 && (
              <span className={`${badgeBase} bg-green-500/20 border-green-500/30 text-green-400`}>
                {activeAlerts.length > 9 ? '9+' : activeAlerts.length}
              </span>
            )}
          </div>
        </Link>

        <div className="w-px h-10 bg-gray-700" />

        {/* MAPA */}
        <Link to={createPageUrl('Home')} className="w-full">
          <div className="relative w-full">
            <Button variant="ghost" className={baseBtn}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className={labelCls}>Mapa</span>
            </Button>
          </div>
        </Link>

        <div className="w-px h-10 bg-gray-700" />

        {/* NOTIFICACIONES */}
        <Link to={createPageUrl('Notifications')} className="w-full">
          <div className="relative w-full">
            <Button variant="ghost" className={baseBtn}>
              <Bell className="w-8 h-8" />
              <span className={labelCls}>Notificaciones</span>
            </Button>

            {unreadNotifications.length > 0 && (
              <span className={`${badgeBase} bg-red-500/20 border-red-500/30 text-red-400`}>
                {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
              </span>
            )}
          </div>
        </Link>

        <div className="w-px h-10 bg-gray-700" />

        {/* CHATS */}
        <Link to={createPageUrl('Chats')} className="w-full">
          <div className="relative w-full">
            <Button variant="ghost" className={baseBtn}>
              <MessageCircle className="w-8 h-8" />
              <span className={labelCls}>Chats</span>
            </Button>
            {/* Si algún día quieres badge aquí, va con el mismo badgeBase */}
          </div>
        </Link>

      </div>
    </nav>
  );
}