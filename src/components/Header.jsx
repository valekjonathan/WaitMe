import React, { useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Settings, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

// Icono morado con una fina línea blanca exterior (sin sombras)
function OutlinedLucideIcon({ Icon, sizeClass = 'w-7 h-7', className = '' }) {
  return (
    <span className={`relative inline-block ${sizeClass} ${className}`} aria-hidden="true">
      {/* contorno blanco */}
      <Icon className={`absolute inset-0 ${sizeClass} text-white`} strokeWidth={3} />
      {/* icono principal morado */}
      <Icon
        className={`relative ${sizeClass} text-purple-500 group-hover:text-purple-400 transition-colors`}
        strokeWidth={2}
      />
    </span>
  );
}

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
        onClick={() => navigate(0)}
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
              <div className="w-10" />
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
              <div className="cursor-pointer ml-[31px] group">
                <OutlinedLucideIcon Icon={Settings} />
              </div>
            </Link>

            <Link to={createPageUrl('Profile')}>
              <div className="cursor-pointer group">
                <OutlinedLucideIcon Icon={User} />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
