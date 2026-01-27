import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Car, Bell, MessageCircle } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  const homeUrl = createPageUrl('Home');
  const chatsUrl = createPageUrl('Chats');
  const notificationsUrl = createPageUrl('Notifications');

  const isHome = currentPath === homeUrl;
  const isChats = currentPath === chatsUrl;
  const isNotifications = currentPath === notificationsUrl;

  // Para que al pulsar "Mapa" en Home te vuelva al modo principal SIN recargar:
  const mapTo = homeUrl + (homeUrl.includes('?') ? '&' : '?') + 'reset=1';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-800">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex justify-around items-center">
          <Link to={homeUrl} className="flex-1 min-w-0">
            <div className={`flex flex-col items-center gap-1 ${isHome ? 'text-purple-400' : 'text-gray-400'}`}>
              <Home className="w-6 h-6" />
              <span className="text-xs font-medium truncate">Alertas</span>
            </div>
          </Link>

          <div className="w-px h-10 bg-gray-700" />

          <Link to={mapTo} className="flex-1 min-w-0">
            <div className={`flex flex-col items-center gap-1 ${isHome ? 'text-purple-400' : 'text-gray-400'}`}>
              <Car className="w-6 h-6" />
              <span className="text-xs font-medium truncate">Mapa</span>
            </div>
          </Link>

          <div className="w-px h-10 bg-gray-700" />

          <Link to={notificationsUrl} className="flex-1 min-w-0">
            <div className={`flex flex-col items-center gap-1 ${isNotifications ? 'text-purple-400' : 'text-gray-400'}`}>
              <Bell className="w-6 h-6" />
              <span className="text-xs font-medium truncate">Avisos</span>
            </div>
          </Link>

          <div className="w-px h-10 bg-gray-700" />

          <Link to={chatsUrl} className="flex-1 min-w-0">
            <div className={`flex flex-col items-center gap-1 ${isChats ? 'text-purple-400' : 'text-gray-400'}`}>
              <MessageCircle className="w-6 h-6" />
              <span className="text-xs font-medium truncate">Chats</span>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}