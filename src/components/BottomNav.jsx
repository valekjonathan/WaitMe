import React, { useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Bell, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function BottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;
  const isActive = (page) => currentPath === createPageUrl(page);
  const homeUrl = useMemo(() => createPageUrl('Home'), []);

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['unreadNotifications', user?.id],
    queryFn: async () =>
      base44.entities.Notification.filter({ recipient_id: user?.id, read: false }),
    enabled: !!user?.id
  });

  const baseBtn =
    "w-full relative flex flex-col items-center justify-center text-purple-400 h-[64px] px-3 rounded-lg";

  const activeGlow =
    "bg-purple-500/10 shadow-[0_6px_14px_rgba(168,85,247,0.28)]";

  const labelClass =
    "text-[10px] font-bold leading-none mt-[3px]";

  const iconWrapper =
    "h-9 flex items-center justify-center";

  const divider = <div className="w-px h-10 bg-gray-700" />;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/95 border-t-2 border-gray-700 px-4 py-3 safe-area-pb z-50">
      <div className="flex items-center max-w-md mx-auto gap-0">

        <Link to={createPageUrl('History')} className="flex-1">
          <Button variant="ghost"
            className={`${baseBtn} ${isActive('History') ? activeGlow : ''}`}>
            <div className={iconWrapper}>↔</div>
            <span className={labelClass}>Alertas</span>
          </Button>
        </Link>

        {divider}

        <button type="button" className="flex-1"
          onClick={() => navigate(`${homeUrl}?reset=${Date.now()}`)}>
          <Button variant="ghost"
            className={`${baseBtn} ${isActive('Home') ? activeGlow : ''}`}>
            <div className={iconWrapper}>🗺</div>
            <span className={labelClass}>Mapa</span>
          </Button>
        </button>

        {divider}

        <Link to={createPageUrl('Notifications')} className="flex-1">
          <Button variant="ghost"
            className={`${baseBtn} ${isActive('Notifications') ? activeGlow : ''}`}>
            <div className={iconWrapper}>
              <Bell className="w-6 h-6" />
            </div>
            <span className={labelClass}>Avisos</span>

            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadNotifications.length}
              </span>
            )}
          </Button>
        </Link>

        {divider}

        <Link to={createPageUrl('Chats')} className="flex-1">
          <Button variant="ghost"
            className={`${baseBtn} ${isActive('Chats') ? activeGlow : ''}`}>
            <div className={iconWrapper}>
              <MessageCircle className="w-6 h-6" />
            </div>
            <span className={labelClass}>Chats</span>
          </Button>
        </Link>

      </div>
    </nav>
  );
}