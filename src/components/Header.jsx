import React, { useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Settings, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function Header({
  title = 'WaitMe!',
  showBackButton = false,
  backTo = 'Home',
  onBack,
  // ✅ NUEVO: permite ajustar tamaño SOLO donde lo pases
  titleClassName = 'text-[24px] leading-[24px]',
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
        className={`${titleClassName} font-semibold select-none`}
      >
        {TitleInner}
      </button>
    );
  }, [title, navigate, titleClassName]);

  const handleBack = useCallback(() => {
    if (onBack) onBack();
  }, [onBack]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-700">
      <div className="px-4 py-3">
        <div className="relative flex items-center justify-between">
          <div className="flex items-center">
            {showBackButton ? (
              <button onClick={handleBack} className="text-white p-2">
                <ArrowLeft className="w-6 h-6" />
              </button>
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
            <div className="pointer-events-auto">{renderTitle}</div>
          </div>

          <div className="flex items-center justify-end gap-[11px]">
            <Link to={createPageUrl('Settings')}>
              <div className="cursor-pointer ml-[31px]">
                <Settings className="w-7 h-7 text-purple-400 hover:text-purple-300 transition-colors" />
              </div>
            </Link>

            <Link to={createPageUrl('Profile')}>
              <div className="cursor-pointer">
                <User className="w-7 h-7 text-purple-400 hover:text-purple-300 transition-colors" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
