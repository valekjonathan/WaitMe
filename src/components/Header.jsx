import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Settings, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { getWaitMeRequests } from '@/lib/waitmeRequests';
import { getBalance } from '@/lib/transactionEngine';

export default function Header({
  title = 'WaitMe!',
  showBackButton = false,
  backTo = 'Home',
  onBack,
  titleClassName = 'text-[24px] leading-[24px]',
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [balance, setBalance] = useState(() => getBalance(user?.id));

  useEffect(() => {
    setBalance(getBalance(user?.id));
  }, [user?.id]);

  useEffect(() => {
    const handler = () => setBalance(getBalance(user?.id));
    window.addEventListener('balanceUpdated', handler);
    return () => window.removeEventListener('balanceUpdated', handler);
  }, [user?.id]);

  const creditsNumber = Number.isFinite(balance) ? balance : 0;

  // Banner tipo WhatsApp (petición entrante)
  const [bannerReq, setBannerReq] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  // Animación: dinero subiendo en el botón de créditos
  const [creditsPulse, setCreditsPulse] = useState(null);

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
      // Solo mostrar si está pendiente (no aceptada ni rechazada)
      const pending = (list || []).find((r) => String(r?.status || '') === 'pending');
      setBannerReq(pending || null);
    };

    load();

    const onChange = () => load();
    const onShow = () => {
      const list = getWaitMeRequests();
      const pending = (list || []).find((r) => String(r?.status || '') === 'pending');
      setBannerReq(pending || null);
      if (pending) {
        setShowBanner(true);
        setTimeout(() => setShowBanner(false), 5000);
      }
    };

    window.addEventListener('waitme:requestsChanged', onChange);
    window.addEventListener('waitme:showIncomingBanner', onShow);

    return () => {
      window.removeEventListener('waitme:requestsChanged', onChange);
      window.removeEventListener('waitme:showIncomingBanner', onShow);
    };
  }, []);

  // Lectura cada segundo de showBanner en localStorage (botón azul en Navigate)
  useEffect(() => {
    const id = setInterval(() => {
      try {
        if (window.localStorage.getItem('showBanner') === 'true') {
          window.localStorage.setItem('showBanner', 'false');
          const list = getWaitMeRequests();
          const pending = (list || []).find((r) => String(r?.status || '') === 'pending');
          setBannerReq(pending || null);
          setShowBanner(true);
          setTimeout(() => setShowBanner(false), 5000);
        }
      } catch {}
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onPayment = (e) => {
      const amount = Number(e?.detail?.amount ?? 0);
      if (!Number.isFinite(amount) || amount <= 0) return;
      setCreditsPulse({ id: Date.now(), amount });
      // se auto-oculta
      setTimeout(() => setCreditsPulse(null), 1200);
    };

    window.addEventListener('waitme:paymentReleased', onPayment);
    return () => window.removeEventListener('waitme:paymentReleased', onPayment);
  }, []);

  useEffect(() => {
    // si hay pending al entrar, lo mostramos UNA vez
    if (bannerReq && String(bannerReq?.status || '') === 'pending') {
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 5000);
    } else {
      setShowBanner(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bannerReq?.id]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-600 shadow-[0_1px_0_rgba(255,255,255,0.08)]">
      {/* barra superior */}
      <div className="px-4 py-3 relative">
        {/* Grid 3 columnas: izq y der */}
        <div className="flex items-center justify-between">
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
                            <div className="bg-purple-600/20 border border-purple-500/70 rounded-full px-3 py-1.5 flex items-center gap-1 hover:bg-purple-600/30 transition-colors cursor-pointer relative overflow-visible">
                <span className="text-purple-400 font-bold text-sm relative">
                  {creditsNumber.toFixed(2)}€
                  <AnimatePresence>
                    {creditsPulse && (
                      <motion.span
                        key={creditsPulse.id}
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: -18, scale: 1 }}
                        exit={{ opacity: 0, y: -28, scale: 0.95 }}
                        transition={{ duration: 0.6 }}
                        className="absolute -right-1 -top-1 text-green-300 text-xs font-extrabold drop-shadow"
                      >
                        +{creditsPulse.amount.toFixed(2)}€
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </div>
            </Link>
          </div>

          {/* DERECHA */}
          <div className="flex items-center justify-end gap-[11px]">
            <Link to={createPageUrl('Settings')}>
              <div className="cursor-pointer">
                <Settings className="w-7 h-7 text-purple-400 hover:text-purple-300 transition-colors drop-shadow-[0_0_1px_rgba(255,255,255,0.85)]" />
              </div>
            </Link>
            <Link to={createPageUrl('Profile')}>
              <div className="cursor-pointer ml-[8px]">
                <User className="w-7 h-7 text-purple-400 hover:text-purple-300 transition-colors drop-shadow-[0_0_1px_rgba(255,255,255,0.85)]" />
              </div>
            </Link>
          </div>
        </div>

        {/* CENTRO: título absolutamente centrado */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">{titleNode}</div>
        </div>
      </div>

      {/* banner tipo WhatsApp: DESACTIVADO */}
      {false && showBanner && bannerReq && (
        <div className="absolute top-full left-0 right-0 px-4 pt-2">
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              // Nunca navegar a rutas inexistentes (pantalla negra). Abrimos la pantalla real de /notifications.
              try {
                setShowBanner(false);
                navigate(createPageUrl('Notifications'));
              } catch {
                // noop
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                try {
                  setShowBanner(false);
                  navigate(createPageUrl('Notifications'));
                } catch {}
              }
            }}
            className="relative w-full text-left bg-gray-900/95 border border-gray-800 rounded-xl px-3 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.55)]"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowBanner(false);
              }}
              className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              {/* avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-700 flex-shrink-0 bg-gray-800">
                {bannerReq?.buyer?.photo ? (
                  <img
                    src={bannerReq.buyer.photo}
                    alt={bannerReq?.buyer?.name || 'Usuario'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg text-gray-500">👤</div>
                )}
              </div>

              {/* texto */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-white text-[14px] font-semibold truncate">
                    {bannerReq?.buyer?.name || 'Usuario'}
                  </div>
                  <div className="text-gray-400 text-[12px] flex-shrink-0">Ahora</div>
                </div>
                <div className="text-white text-[13px] truncate">
                  Usuario quiere tu Wait<span className="text-purple-500 font-semibold">Me!</span>
                </div>
                <div className="text-gray-400 text-[12px] truncate">Pulsa para ver la solicitud</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}