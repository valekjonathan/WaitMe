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
  titleClassName = 'text-[24px] leading-[24px]',
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBack = useCallback(() => {
    if (onBack) return onBack();
    navigate(createPageUrl(backTo));
  }, [onBack, navigate, backTo]);

  const titleNode = useMemo(() => {
    const t = (title || '').trim();
    const normalized = t.toLowerCase().replace(/\s+/g, '');
    const isWaitMe = normalized === 'waitme!' || normalized === 'waitme';

    const inner = isWaitMe ? (
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
        onClick={() => navigate(createPageUrl('Home'))}
        className={`${titleClassName} font-semibold select-none w-full truncate text-center`}
      >
        {inner}
      </button>
    );
  }, [title, navigate, titleClassName]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-700">
      <div className="px-4 py-3">
        {/* ✅ Grid 3 columnas: el centro nunca pisa izquierda/derecha */}
        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-2">
          {/* IZQUIERDA */}
          <div className="flex items-center gap-2">
            {showBackButton ? (
              <button onClick={handleBack} className="text-white p-2">
                <ArrowLeft className="w-6 h-6" />
              </button>
            ) : (
              <div className="w-10 h-10" />
            )}

            <Link to={createPageUrl('Settings')}>
              <div className="bg-purple-600/20 border border-purple-500/70 rounded-full px-3 py-1.5 flex items-center gap-1 hover:bg-purple-600/30 transition-colors cursor-pointer">
                <span className="text-purple-400 font-bold text-sm">
                  {(user?.credits || 0).toFixed(2)}€
                </span>
              </div>
            </Link>
          </div>

          {/* CENTRO */}
          <div className="min-w-0 px-1">
            {titleNode}
          </div>

          {/* DERECHA */}
          <div className="flex items-center justify-end gap-[11px]">
            <Link to={createPageUrl('Settings')}>
              <div className="cursor-pointer ml-[31px]">
                <Settings className="w-7 h-7 text-purple-400 hover:text-purple-300 transition-colors drop-shadow-[0_0_1px_rgba(255,255,255,0.85)]" />
              </div>
            </Link>

            <Link to={createPageUrl('Profile')}>
              <div className="cursor-pointer">
                <User className="w-7 h-7 text-purple-400 hover:text-purple-300 transition-colors drop-shadow-[0_0_1px_rgba(255,255,255,0.85)]" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
