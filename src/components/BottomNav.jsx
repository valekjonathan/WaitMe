import React, { useCallback, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, MessageCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { isDemoMode, getDemoAlerts } from '@/components/DemoFlowManager';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Una sola fuente de verdad: myAlerts (el badge se deriva de aquí)
  const { data: myAlerts = [] } = useQuery({
    queryKey: ['myAlerts'],
    enabled: true,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      if (isDemoMode()) {
        const list = getDemoAlerts();
        return (list || []).filter((a) => (a?.user_id === 'me' || a?.created_by === 'me'));
      }
      const uid = user?.id;
      const email = user?.email;
      if (!uid && !email) return [];

      let mine = [];
      if (uid) mine = await base44.entities.ParkingAlert.filter({ user_id: uid });
      else mine = await base44.entities.ParkingAlert.filter({ user_email: email });

      return (mine || []).slice();
    }
  });

  const activeAlertCount = (myAlerts || []).filter((a) => {
    const st = String(a?.status || '').toLowerCase();
    return st === 'active' || st === 'reserved';
  }).length;

  // Refresco inmediato (cuando se crea/cancela/expira una alerta)
  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
    };
    window.addEventListener('waitme:badgeRefresh', handler);
    return () => window.removeEventListener('waitme:badgeRefresh', handler);
  }, [queryClient]);

  const baseBtn =
    'flex-1 flex flex-col items-center justify-center text-purple-400 ' +
    'h-[60px] rounded-lg';

  const activeStyle = 'bg-purple-700/40 border border-purple-500/50';

  const labelClass =
    'text-[10px] font-bold leading-none mt-[2px] whitespace-nowrap';

  const labelClassLong =
    'text-[9px] font-bold leading-none mt-[2px] whitespace-nowrap tracking-tight';

  const divider = <div className="w-px h-8 bg-gray-700" />;

  const isMapActive = location.pathname === '/';

  const handleMapClick = useCallback(
    (e) => {
      // SIEMPRE: volver al logo + 2 botones (aunque ya estés en "/")
      e?.preventDefault?.();
      try {
        window.dispatchEvent(new Event('waitme:goLogo'));
      } catch {}
      navigate('/', { replace: false });
    },
    [navigate]
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-700 px-4 pt-[6px] pb-2 z-[2147483647] pointer-events-auto">
      <div className="flex items-center max-w-md mx-auto pointer-events-auto">
        <NavLink
          to="/history"
          className={({ isActive }) => `${baseBtn} ${isActive ? activeStyle : ''}`}
        >
          <div className="relative">
            {activeAlertCount > 0 && (
              <span
                // Ajuste fino: +4px derecha (número más centrado)
                className="absolute left-[-11px] top-[4px] w-5 h-5 rounded-full bg-green-500/25 border border-green-500/40 flex items-center justify-center text-[11px] font-extrabold text-green-200 shadow-md"
              >
                {activeAlertCount}
              </span>
            )}
            <svg
              className="w-10 h-10 drop-shadow-[0_0_1px_rgba(255,255,255,0.85)]"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path d="M30 8 L14 8 L14 5 L8 10 L14 15 L14 12 L30 12 Z" fill="currentColor" />
              <path d="M2 20 L18 20 L18 17 L24 22 L18 27 L18 24 L2 24 Z" fill="currentColor" />
            </svg>
          </div>
          <span className={labelClass}>Alertas</span>
        </NavLink>

        {divider}

        {/* MAPA: no usar NavLink aquí, porque si ya estás en "/" no fuerza el reset del Home */}
        <a
          href="/"
          onClick={handleMapClick}
          className={`${baseBtn} ${isMapActive ? activeStyle : ''}`}
        >
          <svg
            className="w-10 h-10 drop-shadow-[0_0_1px_rgba(255,255,255,0.85)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <span className={labelClass}>Mapa</span>
        </a>

        {divider}

        <NavLink
          to="/notifications"
          className={({ isActive }) => `${baseBtn} ${isActive ? activeStyle : ''}`}
        >
          <Bell className="w-10 h-10 drop-shadow-[0_0_1px_rgba(255,255,255,0.85)]" />
          <span className={labelClassLong}>Notificaciones</span>
        </NavLink>

        {divider}

        <NavLink
          to="/chats"
          className={({ isActive }) => `${baseBtn} ${isActive ? activeStyle : ''}`}
        >
          <MessageCircle className="w-10 h-10 drop-shadow-[0_0_1px_rgba(255,255,255,0.85)]" />
          <span className={labelClass}>Chats</span>
        </NavLink>
      </div>
    </nav>
  );
}
