import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Bell, Map, MessageCircle, History } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const location = useLocation();
  const pathname = location.pathname;

  const isActive = (path) => pathname === createPageUrl(path);

  const baseBtn =
    'flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-colors';
  const activeBtn = 'bg-purple-600/20 text-purple-300';
  const inactiveBtn = 'text-gray-400 hover:text-purple-300';

  const homeUrl = createPageUrl('Home');
  // "Mapa" siempre vuelve a Home y fuerza recarga (aunque ya estés en Home)
  const goHomeReload = () => {
    window.location.href = homeUrl;
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-black border-t border-purple-500/30 px-2 pb-2 pt-1 z-50">
      <div className="flex items-center gap-2">
        <Link
          to={createPageUrl('History')}
          className={`${baseBtn} ${isActive('History') ? activeBtn : inactiveBtn}`}
        >
          <History className="w-5 h-5" />
          <span className="text-[11px]">Alertas</span>
        </Link>

        <button
          type="button"
          onClick={goHomeReload}
          className={`${baseBtn} ${isActive('Home') ? activeBtn : inactiveBtn}`}
        >
          <Map className="w-5 h-5" />
          <span className="text-[11px]">Mapa</span>
        </button>

        <Link
          to={createPageUrl('Notifications')}
          className={`${baseBtn} ${isActive('Notifications') ? activeBtn : inactiveBtn}`}
        >
          <Bell className="w-5 h-5" />
          <span className="text-[11px]">Notificaciones</span>
        </Link>

        <Link
          to={createPageUrl('Chats')}
          className={`${baseBtn} ${isActive('Chats') ? activeBtn : inactiveBtn}`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[11px]">Chats</span>
        </Link>
      </div>
    </div>
  );
}