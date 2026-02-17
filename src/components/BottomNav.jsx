import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Bell, MessageCircle } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();

  const current = (location.pathname + location.hash).toLowerCase();

  // ✅ FIX: en Base44 "Mapa" a veces no contiene "home", contiene "map" o directamente "/"
  const isActive = (page) => {
    const p = page.toLowerCase();
    if (p === 'home') {
      return (
        current.includes('home') ||
        current.includes('map') ||
        current.includes('#/') ||
        current === '/' ||
        current.endsWith('/') ||
        current.includes('/home')
      );
    }
    return current.includes(p);
  };

  const baseBtn =
    "flex-1 flex flex-col items-center justify-center text-purple-400 " +
    "h-[60px] rounded-lg";

  const activeStyle =
    "bg-purple-700/40 border border-purple-500/50";

  const labelClass =
    "text-[10px] font-bold leading-none mt-[2px] whitespace-nowrap";

  const labelClassLong =
    "text-[9px] font-bold leading-none mt-[2px] whitespace-nowrap tracking-tight";

  const divider = <div className="w-px h-8 bg-gray-700" />;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-700 px-4 pt-[6px] pb-2 z-50">
      <div className="flex items-center max-w-md mx-auto">

        <Link to={createPageUrl('History')} className="flex-1">
          <div className={`${baseBtn} ${isActive('History') ? activeStyle : ''}`}>
            <svg className="w-10 h-10 drop-shadow-[0_0_1px_rgba(255,255,255,0.85)]" viewBox="0 0 32 32" fill="none">
              <path d="M30 8 L14 8 L14 5 L8 10 L14 15 L14 12 L30 12 Z" fill="currentColor"/>
              <path d="M2 20 L18 20 L18 17 L24 22 L18 27 L18 24 L2 24 Z" fill="currentColor"/>
            </svg>
            <span className={labelClass}>Alertas</span>
          </div>
        </Link>

        {divider}

        <Link to={`${createPageUrl('Home')}?reset=1`} className="flex-1">
          <div className={`${baseBtn} ${isActive('Home') ? activeStyle : ''}`}>
            <svg className="w-10 h-10 drop-shadow-[0_0_1px_rgba(255,255,255,0.85)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <span className={labelClass}>Mapa</span>
          </div>
        </Link>

        {divider}

        <Link to={createPageUrl('Notifications')} className="flex-1">
          <div className={`${baseBtn} ${isActive('Notifications') ? activeStyle : ''}`}>
            <Bell className="w-10 h-10 drop-shadow-[0_0_1px_rgba(255,255,255,0.85)]" />
            <span className={labelClassLong}>Notificaciones</span>
          </div>
        </Link>

        {divider}

        <Link to={createPageUrl('Chats')} className="flex-1">
          <div className={`${baseBtn} ${isActive('Chats') ? activeStyle : ''}`}>
            <MessageCircle className="w-10 h-10 drop-shadow-[0_0_1px_rgba(255,255,255,0.85)]" />
            <span className={labelClass}>Chats</span>
          </div>
        </Link>

      </div>
    </nav>
  );
}