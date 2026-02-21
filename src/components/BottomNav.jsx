import React, { useCallback, useEffect, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, MessageCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import NavPillButton from '@/components/navigation/NavPillButton';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Una sola fuente de verdad: myAlerts (el badge se deriva de aquí)
  const { data: myAlerts = [], isFetched, isFetching } = useQuery({
    queryKey: ['myAlerts'],
    enabled: true,
    // Evita flashes con datos antiguos al navegar entre pantallas.
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const uid = user?.id;
      const email = user?.email;
      if (!uid && !email) return [];

      let mine = [];
      if (uid) mine = await base44.entities.ParkingAlert.filter({ user_id: uid });
      else mine = await base44.entities.ParkingAlert.filter({ user_email: email });

      return (mine || []).slice();
    }
  });

  // Objetivo de navegación (lo usaremos para mostrar el botón y el mapa)
  const navTarget = useMemo(() => {
    const list = myAlerts || [];
    // Preferimos 'reserved' (alguien en camino) y si no, 'active'
    const pick = list.find((a) => String(a?.status || '').toLowerCase() === 'reserved')
      || list.find((a) => String(a?.status || '').toLowerCase() === 'active');
    const lat = Number(pick?.latitude);
    const lng = Number(pick?.longitude);
    if (!pick || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { ...pick, latitude: lat, longitude: lng };
  }, [myAlerts]);

  const showNavButton = !!navTarget;

  const openNavigation = useCallback(() => {
    if (!navTarget) return;
    // Persistimos el objetivo para que se mantenga al navegar por pantallas
    try {
      localStorage.setItem('waitme:navTarget', JSON.stringify({ alert: navTarget }));
    } catch {}
    window.dispatchEvent(new CustomEvent('waitme:navigationSetTarget', { detail: { alert: navTarget } }));
    window.dispatchEvent(new Event('waitme:navigationOpen'));
  }, [navTarget]);


  // La app solo permite 1 alerta activa.
  // Badge binario y SOLO cuando tenemos datos frescos (sin "2" fugaz).
  const hasActiveAlert = (myAlerts || []).some((a) => {
    const st = String(a?.status || '').toLowerCase();
    return st === 'active' || st === 'reserved';
  });
  const showActiveBadge = isFetched ? hasActiveAlert : false;
  // Mantener el badge estable incluso mientras refresca (sin parpadeos)
  // Usamos placeholderData para conservar myAlerts durante fetch.

  // Refresco inmediato (cuando se crea/cancela/expira una alerta)
  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['myAlerts'], refetchType: 'none' });
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
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-700 px-4 pt-[6px] pb-2 z-[2147483647] pointer-events-auto relative">
      <NavPillButton visible={showNavButton} onClick={openNavigation} label="Navegación" />
      <div className="flex items-center max-w-md mx-auto pointer-events-auto">
        <NavLink
          to="/history"
          className={({ isActive }) => `${baseBtn} ${isActive ? activeStyle : ''}`}
        >
          <div className="relative">
            {showActiveBadge && (
              <span
                // Ajuste fino: +4px derecha (número más centrado)
                className="absolute left-[-16px] top-[4px] w-5 h-5 rounded-full bg-green-500/25 border border-green-500/40 flex items-center justify-center text-[11px] font-extrabold text-green-200 shadow-md"
              >
                1
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
