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
  onBack
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
        <Link to={createPageUrl('Home')} className="cursor-pointer select-none">
          <h1 className="text-lg font-semibold truncate">
            <span className="text-white">Wait</span>
            <span className="text-purple-500">Me!</span>
          </h1>
        </Link>
      );
    }

    return <h1 className="text-lg font-semibold text-white truncate">{title}</h1>;
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
        {/* IZQUIERDA */}
        <div className="flex items-center w-1/2">
          {showBackButton && (
            onBack ? (
              <BackButton />
            ) : (
              <Link to={createPageUrl(backTo)}>
                <BackButton />
              </Link>
            )
          )}

          {/* ✅ DINERO: mismo sitio en todas, pero un pelín a la izquierda */}
          <div className="flex-1 flex justify-center -translate-x-2">
            <Link to={createPageUrl('Settings')}>
              <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-1.5 flex items-center gap-1 hover:bg-purple-600/30 transition-colors cursor-pointer">
                <span className="text-purple-400 font-bold text-sm">
                  {(user?.credits || 0).toFixed(2)}€
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* ✅ TÍTULO centrado + truncado para que nunca choque */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[55%] px-2 text-center">
          {renderTitle()}
        </div>

        {/* DERECHA */}
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

          {/* ✅ SIN BADGE AQUÍ */}
          <Link to={createPageUrl('Profile')} className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
            >
              <User className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}