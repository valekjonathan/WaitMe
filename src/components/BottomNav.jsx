import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

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

  const homeUrl = createPageUrl('Home');  // (Se mantiene para consistencia, aunque se usa Link directamente)

  const badgeBase =
    "absolute top-1 right-2 bg-red-500/20 border-2 border-red-500/30 text-red-400 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center";
  const badgeGreen =
    "absolute top-1 right-2 bg-green-500/20 border-2 border-green-500/30 text-green-400 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center";

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t-2 border-gray-700 px-4 py-3 safe-area-pb z-50">
      <div className="flex items-center max-w-md mx-auto gap-0">
        
        {/* Botón Alertas */}
        <Link to={createPageUrl('History')} className="flex-1 min-w-0">
          <Button variant="ghost" className={baseBtn}>
            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
              <path d="M30 8 L14 8 L14 5 L8 10 L14 15 L14 12 L30 12 Z" fill="currentColor" />
              <path d="M2 20 L18 20 L18 17 L24 22 L18 27 L18 24 L2 24 Z" fill="currentColor" />
            </svg>
            <span className="text-[10px] font-bold whitespace-nowrap truncate">Alertas</span>
            {/* Badge verde con número de alertas activas */}
            {activeAlerts.length > 0 && (
              <span className={badgeGreen}>
                {activeAlerts.length > 9 ? '9+' : activeAlerts.length}
              </span>
            )}
          </Button>
        </Link>

        <div className="w-px h-10 bg-gray-700" />

        {/* Botón Mapa – siempre lleva a Home (pantalla principal) */}
        <Link to="/" className="flex-1 min-w-0">
          <Button variant="ghost" className={baseBtn}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="text-[10px] font-bold whitespace-nowrap truncate">Mapa</span>
          </Button>
        </Link>

        <div className="w-px h-10 bg-gray-700" />

        {/* Botón Avisos (Notificaciones) */}
        <Link to={createPageUrl('Notifications')} className="flex-1 min-w-0">
          <Button variant="ghost" className={baseBtn}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-[10px] font-bold whitespace-nowrap truncate">Avisos</span>
            {/* Badge rojo con número de avisos no leídos */}
            {unreadNotifications.length > 0 && (
              <span className={badgeBase}>
                {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
              </span>
            )}
          </Button>
        </Link>

        <div className="w-px h-10 bg-gray-700" />

        {/* Botón Chats */}
        <Link to={createPageUrl('Chats')} className="flex-1 min-w-0">
          <Button variant="ghost" className={baseBtn}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            <span className="text-[10px] font-bold whitespace-nowrap truncate">Chats</span>
          </Button>
        </Link>

      </div>
    </nav>
  );
}