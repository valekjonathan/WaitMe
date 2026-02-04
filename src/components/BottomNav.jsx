import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Map, Bell, MessageCircle, List } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const go = (page) => {
    const url = createPageUrl(page);
    if (location.pathname === url) return;
    navigate(url);
  };

  const isActive = (page) => location.pathname === createPageUrl(page);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-700 h-[76px]">
      <div className="flex justify-around items-center h-full">
        
        <button
          onClick={() => go('History')}
          className={`flex flex-col items-center justify-center gap-1 text-xs ${
            isActive('History') ? 'text-purple-400' : 'text-gray-400'
          }`}
        >
          <List className="w-6 h-6" />
          Alertas
        </button>

        <button
          onClick={() => go('Navigate')}
          className={`flex flex-col items-center justify-center gap-1 text-xs ${
            isActive('Navigate') ? 'text-purple-400' : 'text-gray-400'
          }`}
        >
          <Map className="w-6 h-6" />
          Mapa
        </button>

        <button
          onClick={() => go('Notifications')}
          className={`flex flex-col items-center justify-center gap-1 text-xs ${
            isActive('Notifications') ? 'text-purple-400' : 'text-gray-400'
          }`}
        >
          <Bell className="w-6 h-6" />
          Notifs
        </button>

        <button
          onClick={() => go('Chats')}
          className={`flex flex-col items-center justify-center gap-1 text-xs ${
            isActive('Chats') ? 'text-purple-400' : 'text-gray-400'
          }`}
        >
          <MessageCircle className="w-6 h-6" />
          Chats
        </button>

      </div>
    </nav>
  );
}