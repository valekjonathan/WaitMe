import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header({
  title = 'WaitMe!',
  showBackButton = false,
  backTo = 'Home',
  onBack,
  unreadCount = 0
}) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        // no auth
      }
    };
    fetchUser();
  }, []);

  const renderTitle = () => {
    const t = (title || '').trim();
    const normalized = t.toLowerCase().replace(/\s+/g, '');
    const isWaitMe = normalized === 'waitme!' || normalized === 'waitme';

    if (isWaitMe) {
      return (
        <h1 className="text-lg font-semibold">
          <span className="text-white">Wait</span>
          <span className="text-purple-500">Me!</span>
        </h1>
      );
    }

    return <h1 className="text-lg font-semibold text-white">{title}</h1>;
  };

  const BackButton = () => (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => (onBack ? onBack() : null)}
      className="text-white"
    >
      <ArrowLeft className="w-6 h-6" />
    </Button>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-700">
      <div className="relative flex items-center justify-between px-4 py-3">
        {/* BOTÓN ATRÁS ABSOLUTO (no empuja el botón del dinero) */}
        {showBackButton && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2">
            {onBack ? (
              <BackButton />
            ) : (
              <Link to={createPageUrl(backTo)}>
                <BackButton />
              </Link>
            )}
          </div>
        )}

        {/* IZQUIERDA: dinero SIEMPRE centrado en la mitad izquierda */}
        <div className="flex items-center w-1/2">
          <div className="flex-1 flex justify-center">
            <Link to={createPageUrl('Settings')}>
              <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-1.5 flex items-center gap-1 hover:bg-purple-600/30 transition-colors cursor-pointer">
                <span className="text-purple-400 font-bold text-sm">
                  {(user?.credits || 0).toFixed(2)}€
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* TÍTULO centrado */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {renderTitle()}
        </div>

        {/* DERECHA: iconos morados */}
        <div className="flex items-center gap-1 w-1/2 justify-end">
          <Link to={createPageUrl('Settings')}>
            <Button
              variant="ghost"
              size="icon"
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </Link>

          <Link to={createPageUrl('Profile')} className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
            >
              <User className="w-5 h-5" />
            </Button>

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}