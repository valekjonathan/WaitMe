import { useLocation, useNavigate } from 'react-router-dom';
import { Map, Bell, MessageCircle, Car } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const go = (path) => {
    if (location.pathname !== path) {
      navigate(path, { replace: false });
    }
  };

  const isActive = (path) => location.pathname === `/${path}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[88px] bg-black border-t border-gray-800 flex items-center justify-around z-50">
      <button
        onClick={() => go('/Home')}
        className={`flex flex-col items-center gap-1 ${
          isActive('Home') ? 'text-purple-500' : 'text-gray-400'
        }`}
      >
        <Car className="w-6 h-6" />
        <span className="text-xs">Alertas</span>
      </button>

      <button
        onClick={() => go('/Navigate')}
        className={`flex flex-col items-center gap-1 ${
          isActive('Navigate') ? 'text-purple-500' : 'text-gray-400'
        }`}
      >
        <Map className="w-6 h-6" />
        <span className="text-xs">Mapa</span>
      </button>

      <button
        onClick={() => go('/Notifications')}
        className={`flex flex-col items-center gap-1 ${
          isActive('Notifications') ? 'text-purple-500' : 'text-gray-400'
        }`}
      >
        <Bell className="w-6 h-6" />
        <span className="text-xs">Avisos</span>
      </button>

      <button
        onClick={() => go('/Chats')}
        className={`flex flex-col items-center gap-1 ${
          isActive('Chats') ? 'text-purple-500' : 'text-gray-400'
        }`}
      >
        <MessageCircle className="w-6 h-6" />
        <span className="text-xs">Chats</span>
      </button>
    </nav>
  );
}