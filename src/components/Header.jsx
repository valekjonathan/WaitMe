import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Settings } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getWaitMeRequests } from '@/lib/waitmeRequests';

export default function Header({
  title = 'WaitMe!',
  showBackButton = false,
  backTo = 'Home',
  onBack,
  titleClassName = 'text-[24px] leading-[24px]',
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // base44 puede devolver credits como string -> forzar number para evitar pantallazo negro
  const creditsNumber = (() => {
    const n = Number(user?.credits ?? 0);
    return Number.isFinite(n) ? n : 0;
  })();

  // Banner tipo WhatsApp (petición entrante)
  const [bannerReq, setBannerReq] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  const handleBack = useCallback(() => {
    if (onBack) return onBack();
    navigate(createPageUrl(backTo));
  }, [onBack, navigate, backTo]);

  const innerTitle = useMemo(() => {
    const t = (title || '').trim();
    const normalized = t.toLowerCase().replace(/\s+/g, '');
    const isWaitMe = normalized === 'waitme!' || normalized === 'waitme';

    return isWaitMe ? (
      <>
        <span className="text-white">Wait</span>
        <span className="text-purple-500">Me!</span>
      </>
    ) : (
      <span className="text-white">{title}</span>
    );
  }, [title]);

  const titleNode = useMemo(() => {
    return (
      <button
        type="button"
        onClick={() => navigate(createPageUrl('Home'))}
        className={`${titleClassName} font-semibold select-none w-full truncate text-center`}
      >
        {innerTitle}
      </button>
    );
  }, [navigate, titleClassName, innerTitle]);

  useEffect(() => {
    const load = () => {
      const list = getWaitMeRequests();
      const pending = (list || []).find((r) => String(r?.status || '') === 'pending');
      setBannerReq(pending || null);
    };

    load();

    const onChange = () => load();
    const onShow = () => {
      load();
      setShowBanner(true);
      // auto-hide estilo WhatsApp
      setTimeout(() => setShowBanner(false), 7000);
    };

    window.addEventListener('waitme:requestsChanged', onChange);
    window.addEventListener('waitme:showIncomingBanner', onShow);

    return () => {
      window.removeEventListener('waitme:requestsChanged', onChange);
      window.removeEventListener('waitme:showIncomingBanner', onShow);
    };
  }, []);

  useEffect(() => {
    // si hay pending al entrar, lo mostramos una vez
    if (bannerReq) {
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 7000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bannerReq?.id]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-600 shadow-[0_1px_0_rgba(255,255,255,0.08)]">
      {/* barra superior */}
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
                  {creditsNumber.toFixed(2)}€
                </span>
              </div>
            </Link>
          </div>

          {/* CENTRO */}
          <div className="min-w-0 px-1">{titleNode}</div>

          {/* DERECHA */}
          <div className="flex items-center justify-end gap-[11px]">
            <Link to={createPageUrl('Settings')}>
              <div className="cursor-pointer ml-[31px]">
                <Settings className="w-7 h-7 text-purple-400 hover:text-purple-300 transition-colors drop-shadow-[0_0_1px_rgba(255,255,255,0.85)]" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* banner tipo WhatsApp: SIEMPRE debajo del menú superior */}
      {showBanner && bannerReq && (
        <div className="absolute top-full left-0 right-0 px-4 pt-2">
          <button
            type="button"
            onClick={() => navigate(createPageUrl('Notifications'))}
            className="w-full text-left bg-gray-900/95 border border-gray-800 rounded-lg px-3 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.55)]"
          >
            <span className="text-white text-sm font-semibold">
              Usuario quiere tu Wait<span className="text-purple-500">Me!</span>
            </span>
          </button>
        </div>
      )}
    </header>
  );
}
