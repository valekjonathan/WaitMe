import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Settings, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { isDemoMode, startDemoFlow, subscribeDemoFlow, getDemoToasts, dismissDemoToast } from '@/components/DemoFlowManager';

export default function Header({
  title = 'WaitMe!',
  showBackButton = false,
  backTo = 'Home',
  onBack,
  titleClassName = 'text-[24px] leading-[24px]',
}) {
  const navigate = useNavigate();
  const { user } = useAuth();


  // Toast “tipo WhatsApp” (demo)
  const [toastTick, setToastTick] = useState(0);
  // Toast “tipo WhatsApp” (app real)
  const [appToast, setAppToast] = useState(null);
  // Toast “tipo WhatsApp” (app real)
  const [appToast, setAppToast] = useState(null);

  useEffect(() => {
    if (!isDemoMode()) return;
    startDemoFlow();
    const unsub = subscribeDemoFlow(() => setToastTick((t) => t + 1));
    return () => unsub?.();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const d = e?.detail || {};
      const id = String(Date.now());
      setAppToast({ id, title: d.title || 'WaitMe!', text: d.text || '' });
      window.clearTimeout(window.__waitmeToastT);
      window.__waitmeToastT = window.setTimeout(() => setAppToast(null), 3500);
    };
    window.addEventListener('waitme:toast', handler);
    return () => window.removeEventListener('waitme:toast', handler);
  }, []);

  const toasts = useMemo(() => {
    if (!isDemoMode()) return [];
    return getDemoToasts?.() || [];
  }, [toastTick]);

  const activeToast = appToast || (toasts?.[0] || null);
  const isAppToast = !!appToast;

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
    <header className="fixed relative top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-600 shadow-[0_1px_0_rgba(255,255,255,0.08)]">
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

        {/* Toast bajo el header (desliza hacia arriba para quitar) */}
        <AnimatePresence>
          {activeToast ? (
            <motion.div
              key={activeToast.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 right-0 top-full px-3 pt-2 z-[60]"
            >
              <motion.div
                drag="y"
                dragConstraints={{ top: -90, bottom: 0 }}
                dragElastic={0.12}
                onDragEnd={(e, info) => {
                  if (info?.offset?.y < -50) dismissDemoToast?.(activeToast.id);
                }}
                className="mx-auto max-w-[520px] bg-gray-900/95 border border-gray-700 rounded-2xl shadow-lg backdrop-blur px-4 py-3 flex items-center gap-3"
              >
                {activeToast.fromPhoto ? (
                  <img
                    src={activeToast.fromPhoto}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-gray-700"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/60" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white font-semibold text-sm truncate">
                      {activeToast.fromName || activeToast.title || 'WaitMe!'}
                    </span>
                    <span className="text-gray-400 text-xs flex-none">
                      ahora
                    </span>
                  </div>
                  <div className="text-gray-200 text-sm truncate">
                    {activeToast.text}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

      </div>
    </header>
  );
}
