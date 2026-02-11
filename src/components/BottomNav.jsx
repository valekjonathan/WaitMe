import React, { useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Bell, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function BottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ FIX: en Base44 a veces el path viene con hash / query / mayúsculas.
  // Esto hace que el "activo" funcione SIEMPRE.
  const norm = (p) =>
    (p || '')
      .toLowerCase()
      .replace(/^#/, '')
      .replace(/\?.*$/, '')
      .replace(/\/+$/, '');

  const current = norm(location.pathname || '') || norm(location.hash || '');

  const isActive = (page) => {
    const target = norm(createPageUrl(page));
    // match exacto o terminación (por si Base44 mete prefijos)
    return current === target || current.endsWith(target);
  };

  const homeUrl = useMemo(() => createPageUrl('Home'), []);

  useQuery({
    queryKey: ['userActiveAlerts', user?.id],
    queryFn: async () =>
      base44.entities.ParkingAlert.filter({ user_id: user?.id, status: 'active' }),
    enabled: !!user?.id
  });

  useQuery({
    queryKey: ['unreadNotifications', user?.id],
    queryFn: async () =>
      base44.entities.Notification.filter({ recipient_id: user?.id, read: false }),
    enabled: !!user?.id
  });

  // Base (sin hover blanco, sin sombras)
  const baseBtn =
    "flex-1 flex flex-col items-center justify-center text-purple-400 " +
    "h-[60px] bg-transparent shadow-none outline-none border-none " +
    "hover:bg-transparent hover:shadow-none hover:text-purple-400 " +
    "focus:bg-transparent focus:shadow-none focus:ring-0 active:bg-transparent " +
    "rounded-lg transition-colors";

  // ✅ EXACTO lo que pides: “fondo como el botón del tiempo”
  // (morado apagado + borde morado suave, sin sombras)
  const activeStyle =
    "bg-purple-700/30 border border-purple-500/40";

  const labelClass =
    "text-[10px] font-bold leading-none mt-[2px] whitespace-nowrap";

  const labelClassLong =
    "text-[9px] font-bold leading-none mt-[2px] whitespace-nowrap tracking-tight";

  const divider = <div className="w-px h-8 bg-gray-700" />;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-700 px-4 pt-[6px] pb-2 z-50">
      <div className="flex items-center max-w-md mx-auto">

        {/* ALERTAS */}
        <Link to={createPageUrl('History')} className="flex-1">
          <div className={`${baseBtn} ${isActive('History') ? activeStyle : ''}`}>
            <svg className="w-10 h-10" viewBox="0 0 32 32" fill="none">
              <path d="M30 8 L14 8 L14 5 L8 10 L14 15 L14 12 L30 12 Z" fill="currentColor"/>
              <path d="M2 20 L18 20 L18 17 L24 22 L18 27 L18 24 L2 24 Z" fill="currentColor"/>
            </svg>
            <span className={labelClass}>Alertas</span>
          </div>
        </Link>

        {divider}

        {/* MAPA */}
        <button
          type="button"
          className="flex-1"
          onClick={() => navigate(`${homeUrl}?reset=${Date.now()}`)}
        >
          <div className={`${baseBtn} ${isActive('Home') ? activeStyle : ''}`}>
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <span className={labelClass}>Mapa</span>
          </div>
        </button>

        {divider}

        {/* NOTIFICACIONES */}
        <Link to={createPageUrl('Notifications')} className="flex-1">
          <div className={`${baseBtn} ${isActive('Notifications') ? activeStyle : ''}`}>
            <Bell className="w-10 h-10" />
            <span className={labelClassLong}>Notificaciones</span>
          </div>
        </Link>

        {divider}

        {/* CHATS */}
        <Link to={createPageUrl('Chats')} className="flex-1">
          <div className={`${baseBtn} ${isActive('Chats') ? activeStyle : ''}`}>
            <MessageCircle className="w-10 h-10" />
            <span className={labelClass}>Chats</span>
          </div>
        </Link>

      </div>
    </nav>
  );
}