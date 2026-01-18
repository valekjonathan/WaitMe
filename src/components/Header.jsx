import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Settings, User } from 'lucide-react';

export default function Header({
  title = 'WaitMe!',
  showBackButton = false,
  backTo = 'Home',
}) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const currentUser = await base44.auth.me();
        if (mounted) setUser(currentUser);
      } catch (e) {
        // silencioso
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="relative z-50 w-full h-14 px-4 flex items-center bg-black/60 backdrop-blur border-b border-white/10">
      {/* Back (fuera del flujo para que NO empuje nada) */}
      {showBackButton && (
        <Link
          to={createPageUrl(backTo)}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/5"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5 text-white/90" />
        </Link>
      )}

      {/* Centro: dinero + titulo (SIEMPRE igual en todas las pantallas) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
        <Link
          to={createPageUrl('Settings')}
          className="bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-1.5 flex items-center gap-1 hover:bg-purple-600/30 transition-colors"
          aria-label="Créditos"
        >
          <span className="text-purple-400 font-bold text-sm">
            {(user?.credits || 0).toFixed(2)}€
          </span>
        </Link>

        <div className="text-white font-semibold text-base whitespace-nowrap">
          {title}
        </div>
      </div>

      {/* Derecha (fuera del flujo) */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <Link
          to={createPageUrl('Settings')}
          className="p-2 rounded-full hover:bg-white/5"
          aria-label="Ajustes"
        >
          <Settings className="w-5 h-5 text-white/80" />
        </Link>

        <Link
          to={createPageUrl('Profile')}
          className="p-2 rounded-full hover:bg-white/5"
          aria-label="Perfil"
        >
          <User className="w-5 h-5 text-white/80" />
        </Link>
      </div>
    </header>
  );
}