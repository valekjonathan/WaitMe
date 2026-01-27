import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Bell, MessageCircle, Map, Car } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const { data: activeAlerts = [] } = useQuery({
    queryKey: ['userActiveAlerts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.ParkingAlert.filter({
        created_by: user.email,
        status: 'active'
      });
    },
    enabled: !!user?.email
  });

  const go = (path) => {
    if (location.pathname !== path) {
      navigate(path, { replace: false });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[88px] bg-black border-t border-gray-800 flex items-center justify-around z-50">
      <button onClick={() => go('/Home')} className="flex flex-col items-center gap-1 text-purple-500">
        <Car className="w-6 h-6" />
        <span className="text-xs">Alertas</span>
      </button>

      <button onClick={() => go('/Navigate')} className="flex flex-col items-center gap-1 text-purple-500">
        <Map className="w-6 h-6" />
        <span className="text-xs">Mapa</span>
      </button>

      <button onClick={() => go('/Notifications')} className="flex flex-col items-center gap-1 text-purple-500">
        <Bell className="w-6 h-6" />
        <span className="text-xs">Avisos</span>
      </button>

      <button onClick={() => go('/Chats')} className="flex flex-col items-center gap-1 text-purple-500">
        <MessageCircle className="w-6 h-6" />
        <span className="text-xs">Chats</span>
      </button>
    </div>
  );
}