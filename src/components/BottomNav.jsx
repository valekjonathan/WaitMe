import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Bell, MessageCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BottomNav() {
  const navigate = useNavigate();

  const [alertsCount, setAlertsCount] = useState(0);
  const homeUrl = createPageUrl('Home');
  const alertsUrl = createPageUrl('History');
  const notificationsUrl = createPageUrl('Notifications');
  const chatUrl = createPageUrl('ChatList');
  const settingsUrl = createPageUrl('Settings');

  useEffect(() => {
    let mounted = true;

    const fetchAlertsCount = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return;

        const { data } = await base44.table('alerts').select({
          filter: { created_by: user.id, status: 'active' }
        });

        if (!mounted) return;
        setAlertsCount(Array.isArray(data) ? data.length : 0);
      } catch (e) {
        // ignore
      }
    };

    fetchAlertsCount();
    const t = setInterval(fetchAlertsCount, 15000);

    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  const baseBtn =
    'w-full h-full flex flex-col items-center justify-center gap-1 text-gray-300 hover:text-purple-300';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-purple-500/20 z-50">
      <div className="max-w-md mx-auto flex items-stretch h-[76px] px-2">
        {/* Alertas */}
        <Link to={alertsUrl} className="flex-1 min-w-0">
          <Button variant="ghost" className={baseBtn}>
            <div className="relative">
              <Bell className="w-7 h-7" />
              {alertsCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-green-500 text-black text-[10px] font-bold rounded-full px-1.5 py-0.5">
                  {alertsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold whitespace-nowrap truncate">
              Alertas
            </span>
          </Button>
        </Link>

        {/* Mapa (SIN recarga, instantáneo) */}
        <button
          type="button"
          className="flex-1 min-w-0"
          onClick={() => {
            // Fuerza volver al Home principal incluso si ya estás en /home
            navigate(homeUrl, { state: { resetHome: Date.now() } });
          }}
        >
          <Button variant="ghost" className={baseBtn}>
            <svg
              className="w-8 h-8"
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
            <span className="text-[10px] font-bold whitespace-nowrap truncate">
              Mapa
            </span>
          </Button>
        </button>

        {/* Notificaciones */}
        <Link to={notificationsUrl} className="flex-1 min-w-0">
          <Button variant="ghost" className={baseBtn}>
            <Bell className="w-7 h-7" />
            <span className="text-[10px] font-bold whitespace-nowrap truncate">
              Notificaciones
            </span>
          </Button>
        </Link>

        {/* Chats */}
        <Link to={chatUrl} className="flex-1 min-w-0">
          <Button variant="ghost" className={baseBtn}>
            <MessageCircle className="w-7 h-7" />
            <span className="text-[10px] font-bold whitespace-nowrap truncate">
              Chats
            </span>
          </Button>
        </Link>

        {/* Dinero (Settings) */}
        <Link to={settingsUrl} className="flex-1 min-w-0">
          <Button variant="ghost" className={baseBtn}>
            <DollarSign className="w-7 h-7" />
            <span className="text-[10px] font-bold whitespace-nowrap truncate">
              Dinero
            </span>
          </Button>
        </Link>
      </div>
    </div>
  );
}