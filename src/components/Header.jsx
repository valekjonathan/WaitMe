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
  useAuth(); // mantiene compatibilidad si el proyecto lo usa

  const handleBack = useCallback(() => {
    if (onBack) return onBack();
    navigate(createPageUrl(backTo));
  }, [onBack, navigate, backTo]);

  const titleNode = useMemo(() => {
    const normalized = (title || '').toLowerCase().replace(/\s+/g, '');
    const isWaitMe = normalized === 'waitme!' || normalized === 'waitme';

    return (
      <button
        type="button"
        onClick={() => navigate(0)}
        className={`${titleClassName} font-semibold w-full text-center truncate`}
      >
        {isWaitMe ? (
          <>
            <span className="text-white">Wait</span>
            <span className="text-purple-500">Me!</span>
          </>
        ) : (
          <span className="text-white">{title}</span>
        )}
      </button>
    );
  }, [title, navigate, titleClassName]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-700 h-[64px]">
      <div className="px-4 h-full">
        <div className="grid grid-cols-[56px,1fr,96px] items-center h-full">
          {/* IZQUIERDA: back o hueco fijo */}
          <div className="flex items-center justify-start">
            {showBackButton ? (
              <button onClick={handleBack} className="text-white p-2">
                <ArrowLeft className="w-6 h-6" />
              </button>
            ) : (
              <div className="w-[40px]" />
            )}
          </div>

          {/* CENTRO: título siempre centrado */}
          <div className="flex items-center justify-center">
            {titleNode}
          </div>

          {/* DERECHA: SIEMPRE pegado a la derecha */}
          <div className="flex items-center justify-end gap-2">
            <Link to={createPageUrl('Settings')} className="text-white p-2">
              <Settings className="w-6 h-6" />
            </Link>
            <Link to={createPageUrl('Profile')} className="text-white p-2">
              <User className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
