import React, { useMemo, useCallback } from 'react';
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
  iconVariant = 'default'
}) {

  const navigate = useNavigate();
  const { user } = useAuth();

  const renderTitle = useMemo(() => {

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

    return (
      <button
        type="button"
        onClick={() => navigate(0)}
        className="text-[28px] leading-[28px] font-semibold select-none"
        aria-label="Recargar página"
      >
        {TitleInner}
      </button>
    );

  }, [title, navigate]);

  const handleBack = useCallback(() => {
    if (onBack) onBack();
  }, [onBack]);

  const BackButton = useMemo(() => (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleBack}
      className="text-white"
    >
      <ArrowLeft className="w-6 h-6" />
    </Button>
  ), [handleBack]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-700">
      <div className="px-4 py-3">

        <div className="relative flex items-center justify-between">

          <div className="flex items-center">

            {showBackButton ? (
              onBack ? (
                BackButton
              ) : (
                <Link to={createPageUrl(backTo)}>
                  {BackButton}
                </Link>
              )
            ) : (
              <div className="w-10" />
            )}

            <div className="flex items-center justify-center px-2">
              <Link to={createPageUrl('Settings')}>
                <div className="bg-purple-600/20 border border-purple-500/70 rounded-full px-3 py-1.5 flex items-center gap-1 hover:bg-purple-600/30 transition-colors cursor-pointer">
                  <span className="text-purple-400 font-bold text-sm">
                    {(user?.credits || 0).toFixed(2)}€
                  </span>
                </div>
              </Link>
            </div>

          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              {renderTitle}
            </div>
          </div>

          <div className="flex items-center gap-1 justify-end">

            {iconVariant === 'bottom' ? (
              <>
                <Link to={createPageUrl('Settings')}>
                  <button
                    type="button"
                    className="text-purple-400 hover:text-purple-300 rounded-lg p-2 hover:bg-purple-700/40 hover:border hover:border-purple-500/50 transition-colors"
                    aria-label="Ajustes"
                  >
                    <Settings className="w-6 h-6 ml-[15px]" strokeWidth={2} />
                  </button>
                </Link>

                <Link to={createPageUrl('Profile')}>
                  <button
                    type="button"
                    className="text-purple-400 hover:text-purple-300 rounded-lg p-2 hover:bg-purple-700/40 hover:border hover:border-purple-500/50 transition-colors"
                    aria-label="Perfil"
                  >
                    <User className="w-6 h-6" strokeWidth={2} />
                  </button>
                </Link>
              </>
            ) : (
              <>
                <Link to={createPageUrl('Settings')}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 ml-[15px]"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </Link>

                <Link to={createPageUrl('Profile')}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                  >
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
              </>
            )}

          </div>

        </div>

      </div>
    </header>
  );
}