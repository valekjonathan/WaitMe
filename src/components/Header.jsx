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
  bordered = true
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

    return <div className="text-lg font-semibold select-none">{TitleInner}</div>;
  };

  const BackButton = () => (
    <Button variant="ghost" size="icon" onClick={() => (onBack ? onBack() : null)} className="text-white">
      <ArrowLeft className="w-6 h-6" />
    </Button>
  );

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm',
        bordered ? 'border-b-0' : 'border-b-0'
      ].join(' ')}
    >
      <div className="px-4 py-2">
        {/* Barra superior: izquierda (atrás + dinero) / derecha (iconos). El título va centrado REAL (absoluto). */}
        <div className="relative flex items-center justify-between">
          {/* IZQUIERDA: atrás + dinero */}
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

            {/* DINERO: se queda donde está (entre atrás y título) */}
            <div className="flex items-center justify-center px-2">
              <Link to={createPageUrl('Settings')}>
                <div className="bg-purple-600/20 border border-purple-500/70 rounded-full px-3 py-1.5 flex items-center gap-1 hover:bg-purple-600/30 transition-colors cursor-pointer">
                  <span className="text-purple-400 font-bold text-sm">{(user?.credits || 0).toFixed(2)}€</span>
                </div>
              </Link>
            </div>
          </div>

          {/* TÍTULO CENTRADO REAL: click recarga */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">{renderTitle()}</div>
          </div>

          {/* DERECHA: iconos morados */}
          <div className="flex items-center gap-1 justify-end">
            <Link to={createPageUrl('Settings')}>
              <Button
                variant="ghost"
                size="icon"
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
              >
                <Settings className="w-7 h-7" />
              </Button>
            </Link>

            {/* Perfil SIN circulito (no lleva notificaciones) */}
            <Link to={createPageUrl('Profile')}>
              <Button
                variant="ghost"
                size="icon"
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
              >
                <User className="w-7 h-7" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}