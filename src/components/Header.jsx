import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { getWaitMeRequests } from '@/lib/waitmeRequests';
import { getBalance } from '@/lib/transactionEngine';

export default function Header({
  title = 'WaitMe!',
  showBackButton = false,
  backTo = null,
  onBack,
  titleClassName = 'text-[24px] leading-[24px]',
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [balance, setBalance] = useState(() => getBalance(user?.id));
  const [bannerReq, setBannerReq] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [creditsPulse, setCreditsPulse] = useState(null);
  const bannerTimerRef = useRef(null);
  const pulseTimerRef = useRef(null);

  // -------- BALANCE --------
  useEffect(() => {
    setBalance(getBalance(user?.id));
  }, [user?.id]);

  useEffect(() => {
    const handler = () => setBalance(getBalance(user?.id));
    window.addEventListener('balanceUpdated', handler);
    return () => window.removeEventListener('balanceUpdated', handler);
  }, [user?.id]);

  const creditsNumber = Number.isFinite(balance) ? balance : 0;

  // -------- BACK BUTTON --------
  const handleBack = useCallback(() => {
    if (onBack) return onBack();
    if (backTo) {
      navigate(`/${backTo.toLowerCase()}`);
    } else {
      navigate(-1);
    }
  }, [onBack, navigate, backTo]);

  // -------- TITLE (SIEMPRE PASIVO) --------
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

  const titleNode = (
    <span className={`${titleClassName} font-semibold select-none w-full truncate text-center`}>
      {innerTitle}
    </span>
  );

  // -------- BANNER REQUEST --------
  useEffect(() => {
    const load = () => {
      const list = getWaitMeRequests();
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
        clearTimeout(bannerTimerRef.current);
        bannerTimerRef.current = setTimeout(() => setShowBanner(false), 5000);
      }
    };

    window.addEventListener('waitme:requestsChanged', onChange);
    window.addEventListener('waitme:showIncomingBanner', onShow);

    return () => {
      window.removeEventListener('waitme:requestsChanged', onChange);
      window.removeEventListener('waitme:showIncomingBanner', onShow);
      clearTimeout(bannerTimerRef.current);
    };
  }, []);

  // -------- PAYMENT PULSE --------
  useEffect(() => {
    const onPayment = (e) => {
      const amount = Number(e?.detail?.amount ?? 0);
      if (!Number.isFinite(amount) || amount <= 0) return;
      setCreditsPulse({ id: Date.now(), amount });
      clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => setCreditsPulse(null), 1200);
    };

    window.addEventListener('waitme:paymentReleased', onPayment);
    return () => {
      window.removeEventListener('waitme:paymentReleased', onPayment);
      clearTimeout(pulseTimerRef.current);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[rgba(255,255,255,0.05)]" style={{ backgroundColor: '#0B0B0F' }}>
      
      <div className="px-4 py-3 relative">
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

            <div className="bg-purple-600/20 border border-purple-500/70 rounded-full px-3 py-1.5 flex items-center gap-1 relative overflow-visible cursor-pointer" onClick={() => navigate('/settings')}>
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
          </div>

          {/* DERECHA */}
          <div className="flex items-center justify-end gap-[11px]">
            <Link to="/settings">
              <Settings className="w-7 h-7 text-purple-400 hover:text-purple-300 transition-colors drop-shadow-[0_0_1px_rgba(255,255,255,0.85)] cursor-pointer" />
            </Link>

            <Link to="/profile">
              <User className="w-7 h-7 text-purple-400 hover:text-purple-300 transition-colors drop-shadow-[0_0_1px_rgba(255,255,255,0.85)] cursor-pointer ml-[8px]" />
            </Link>
          </div>
        </div>

        {/* TÍTULO CENTRADO (NO CLICKABLE) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            {titleNode}
          </div>
        </div>
      </div>

    </header>
  );
}