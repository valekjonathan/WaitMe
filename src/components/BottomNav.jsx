import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import base44 from '@/api/base44Client';
import { Bell, MessageCircle, MapPin } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isHome = location.pathname === createPageUrl('Home');

  const { data: activeAlerts = [] } = useQuery({
    queryKey: ['userActiveAlerts', user?.email],
    queryFn: async () =>
      base44.entities.ParkingAlert.filter({
        user_email: user?.email,
        status: 'active'
      }),
    enabled: !!user?.email,
    refetchInterval: 20000
  });

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['unreadNotifications', user?.email],
    queryFn: async () =>
      base44.entities.Notification.filter({
        recipient_email: user?.email,
        read: false
      }),
    enabled: !!user?.email,
    refetchInterval: 20000
  });

  const goHomeSafely = () => {
    if (!isHome) {
      navigate(createPageUrl('Home'), { replace: true });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/5 z-50">
      <div className="flex justify-around items-center py-2">

        {/* ALERTAS */}
        <Link
          to={createPageUrl('History')}
          className="relative flex flex-col items-center text-purple-400"
        >
          <Bell size={20} />
          <span className="text-xs">Alertas</span>
          {activeAlerts.length > 0 && (
            <span className="absolute top-0 right-1 bg-green-500 text-black text-xs rounded-full px-1">
              {activeAlerts.length}
            </span>
          )}
        </Link>

        {/* MAPA */}
        <button
          onClick={goHomeSafely}
          className={`flex flex-col items-center ${
            isHome ? 'text-purple-500' : 'text-purple-400'
          }`}
        >
          <MapPin size={22} />
          <span className="text-xs">Mapa</span>
        </button>

        {/* CHATS */}
        <Link
          to={createPageUrl('Chats')}
          className="relative flex flex-col items-center text-purple-400"
        >
          <MessageCircle size={20} />
          <span className="text-xs">Chats</span>
          {unreadNotifications.length > 0 && (
            <span className="absolute top-0 right-1 bg-red-500 text-white text-xs rounded-full px-1">
              {unreadNotifications.length}
            </span>
          )}
        </Link>

      </div>
    </div>
  );
}