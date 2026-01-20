import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

export default function Header({
  title = 'WaitMe!',
  showBackButton = false,
  backTo = 'Home',
  onBack,
  unreadCount = 0
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const renderTitle = () => {
    const t = (title || '').trim();
    const normalized = t.toLowerCase().replace(/\s+/g, '');
    const isWaitMe = normalized === 'waitme!' || normalized === 'waitme';

    const TitleInner = isWaitMe ? (
      <>
        <span className="text-white">Wait</span>
        <span className="text-purple-500">Me!</span>
      </>
    ) : (
      <span className="text-white">{title}</span>
    );

    // Click en el título = recarga de la página actual
    return (
      <button
        type="button"
        onClick={() => navigate(0)}
        className="text-lg font-semibold select-none"
        aria-label="Recargar página"
      >
        {TitleInner}
      </button>
    );
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
      <div className="px-4 py-3">
        {/* Grid para garantizar: atrás | dinero | título | iconos */}
        <div className="grid grid-cols-[auto_auto_1fr_auto] items-center">
          {/* IZQUIERDA: atrás */}
          <div className="flex items-center">
            {showBackButton ? (
              onBack ? (
                <BackButton />
              ) : (
                <Link to={createPageUrl(backTo)}>
                  <BackButton />
                </Link>
              )
            ) : (
              // placeholder para que el dinero no cambie de sitio entre pantallas
              <div className="w-10" />
            )}
          </div>

          {/* DINERO: siempre entre atrás y título */}
          <div className="flex items-center justify-center px-2">
            <Link to={createPageUrl('Settings')}>
              <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-1.5 flex items-center gap-1 hover:bg-purple-600/30 transition-colors cursor-pointer">
                <span className="text-purple-400 font-bold text-sm">{(user?.credits || 0).toFixed(2)}€</span>
              </div>
            </Link>
          </div>

          {/* TÍTULO: click recarga */}
          <div className="flex items-center justify-center">
            {renderTitle()}
          </div>

          {/* DERECHA: iconos morados */}
          <div className="flex items-center gap-1 justify-end">
          <Link to={createPageUrl('Settings')}>
            <Button
              variant="ghost"
              size="icon"
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
            >
              <Settings className="w-6 h-6" />
            </Button>
          </Link>

          <Link to={createPageUrl('Profile')} className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
            >
              <User className="w-6 h-6" />
            </Button>

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          </div>
        </div>
      </div>
    </header>
  );
}