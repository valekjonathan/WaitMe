
================================================================
FILE: src/components/Header.jsx
================================================================
```jsx
import { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { getWaitMeRequests } from '@/lib/waitmeRequests';
import { getBalance } from '@/lib/transactionEngine';

export default function Header({
  title = 'WaitMe!',
  showBackButton = false,
  backTo = null,
  onBack,
  onTitleClick = null,
  titleClassName = 'text-[24px] leading-[24px]',
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [balance, setBalance] = useState(() => getBalance(user?.id));
  const [, setBannerReq] = useState(null);
  const [, setShowBanner] = useState(false);
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

  const titleNode = onTitleClick ? (
    <button
      type="button"
      onClick={onTitleClick}
      className={`${titleClassName} font-semibold select-none w-full truncate text-center cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity`}
    >
      {innerTitle}
    </button>
  ) : (
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
    <header data-waitme-header className="fixed top-0 left-0 right-0 z-50 border-b border-[rgba(255,255,255,0.05)]" style={{ backgroundColor: '#0B0B0F' }}>
      
      <div className="px-4 py-3 relative">
        <div className="flex items-center justify-between">

          {/* IZQUIERDA */}
          <div className="flex items-center gap-2">
            {showBackButton ? (
              <button type="button" onClick={handleBack} className="text-white p-2">
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
            <button type="button" onClick={(e) => { e.preventDefault(); navigate('/settings'); }} className="p-0 border-0 bg-transparent cursor-pointer">
              <Settings className="w-7 h-7 text-purple-400 hover:text-purple-300 transition-colors drop-shadow-[0_0_1px_rgba(255,255,255,0.85)] cursor-pointer" />
            </button>

            <button type="button" onClick={(e) => { e.preventDefault(); navigate('/profile'); }} className="p-0 border-0 bg-transparent cursor-pointer ml-[8px]">
              <User className="w-7 h-7 text-purple-400 hover:text-purple-300 transition-colors drop-shadow-[0_0_1px_rgba(255,255,255,0.85)] cursor-pointer" />
            </button>
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
```

================================================================
FILE: src/components/IncomingRequestModal.jsx
================================================================
```jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { setWaitMeRequestStatus } from '@/lib/waitmeRequests';
import * as alerts from '@/data/alerts';
import * as chat from '@/data/chat';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { MapPin, Clock, MessageCircle, Phone, PhoneOff, Navigation, X, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function formatAddress(addr){
  const s=String(addr||'').trim();
  if(!s)return'Ubicación marcada';
  if(/oviedo/i.test(s))return s;
  return`${s}, Oviedo`;
}

const CAR_COLOR_MAP_MODAL={
  blanco:'#ffffff',negro:'#1a1a1a',gris:'#9ca3af',plata:'#d1d5db',
  rojo:'#ef4444',azul:'#3b82f6',verde:'#22c55e',amarillo:'#eab308',
  naranja:'#f97316',marron:'#92400e',morado:'#7c3aed',rosa:'#ec4899',
  beige:'#d4b483',
};

function getCarFill(color){
  const key=String(color||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  return CAR_COLOR_MAP_MODAL[key]||'#9ca3af';
}

export default function IncomingRequestModal(){
  const navigate=useNavigate();
  const queryClient=useQueryClient();
  const { user: currentUser }=useAuth();

  const[open,setOpen]=useState(false);
  const[request,setRequest]=useState(null);
  const[alert,setAlert]=useState(null);
  const[loading,setLoading]=useState(false);
  const[nowTs,setNowTs]=useState(Date.now());

  useEffect(()=>{
    const id=setInterval(()=>setNowTs(Date.now()),1000);
    return()=>clearInterval(id);
  },[]);

  useEffect(()=>{
    const handler=(e)=>{
      const req=e?.detail?.request||null;
      const alt=e?.detail?.alert||null;
      if(req){setRequest(req);setAlert(alt);setOpen(true);}
    };
    window.addEventListener('waitme:showIncomingRequestModal',handler);
    return()=>window.removeEventListener('waitme:showIncomingRequestModal',handler);
  },[]);

  const handleClose=useCallback(()=>{setOpen(false);setRequest(null);setAlert(null);setLoading(false);},[]);

  const acceptRequest=async()=>{
    if(!request?.alertId)return;
    setLoading(true);

    const buyer=request?.buyer||{};
    const payload={
      status:'reserved',
      reserved_by_id:buyer?.id||'buyer',
      reserved_by_email:null,
      reserved_by_name:buyer?.name||'Usuario',
      reserved_by_photo:buyer?.photo||null,
      reserved_by_car:`${buyer?.brand || ''} ${buyer?.model || ''}`.trim(),
      reserved_by_car_color:buyer?.color||'gris',
      reserved_by_plate:buyer?.plate||'',
      reserved_by_vehicle_type:buyer?.vehicle_type||'car'
    };

    setWaitMeRequestStatus(request?.id,'accepted');
    // Clear ALL thinking requests (accepted one wins, rest are dismissed)
    try{
      localStorage.setItem('waitme:thinking_requests',JSON.stringify([]));
      window.dispatchEvent(new Event('waitme:thinkingUpdated'));
    }catch{}
    // Optimistically update the alert in cache so it appears immediately in Activas
    queryClient.setQueryData(['myAlerts'], (old=[]) =>
      Array.isArray(old) ? old.map(a => a.id === request.alertId ? {...a,...payload} : a) : old
    );
    try{window.dispatchEvent(new Event('waitme:badgeRefresh'));}catch{}
    handleClose();
    navigate(createPageUrl('History'));

    // Disparar bolita en botón Chats del menú inferior
    try {
      const current = parseInt(localStorage.getItem('waitme:chat_unread') || '0', 10);
      localStorage.setItem('waitme:chat_unread', String(current + 1));
      window.dispatchEvent(new Event('waitme:chatUnreadUpdate'));
    } catch {}

    // Guardar conversación demo en localStorage para que Chats la muestre
    try {
      const convKey = 'waitme:demo_conversations';
      const existing = JSON.parse(localStorage.getItem(convKey) || '[]');
      const buyerName = buyer?.name || 'Usuario';
      const convId = `demo_conv_${request.alertId}_${Date.now()}`;
      const newConv = {
        id: convId,
        alert_id: request.alertId,
        buyer_name: buyerName,
        buyer_photo: buyer?.photo || null,
        buyer_id: buyer?.id || 'buyer',
        model: buyer?.model || '',
        brand: buyer?.brand || '',
        color: buyer?.color || 'gris',
        plate: buyer?.plate || '',
        address: request?.address || '',
        price: request?.price || 3,
        allow_phone_calls: Boolean(buyer?.phone),
        phone: buyer?.phone || null,
        first_message: `ey ! te he enviado un waitme`,
        created_at: Date.now(),
        unread: 1,
      };
      existing.unshift(newConv);
      localStorage.setItem(convKey, JSON.stringify(existing));
      window.dispatchEvent(new CustomEvent('waitme:newDemoConversation', { detail: newConv }));
    } catch {}

    try{
      const { error: updateErr } = await alerts.updateAlert(request.alertId, payload);
      if (updateErr) throw updateErr;
      queryClient.invalidateQueries({queryKey:['alerts']});
      queryClient.invalidateQueries({queryKey:['myAlerts']});

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if(currentUser?.id && buyer?.id && uuidRegex.test(buyer.id)){
        const convRes = await chat.createConversation({
          buyerId: buyer.id,
          sellerId: currentUser.id,
          alertId: request.alertId
        }).catch(()=>({}));
        const conv = convRes?.data;
        if(conv?.id){
          await chat.sendMessage({
            conversationId: conv.id,
            senderId: buyer.id,
            body: 'ey ! te he enviado un waitme'
          }).catch(()=>{});
        }
      }
    }catch{setLoading(false);}
  };

  const handleMeLoPienso=()=>{
    if(request?.id){
      setWaitMeRequestStatus(request.id,'thinking');
      // Save to localStorage so Alertas page can show it
      try{
        const thinking=JSON.parse(localStorage.getItem('waitme:thinking_requests')||'[]');
        const exists=thinking.find(r=>r.id===request.id);
        if(!exists){
          thinking.push({id:request.id,request,alert,savedAt:Date.now()});
          localStorage.setItem('waitme:thinking_requests',JSON.stringify(thinking));
          window.dispatchEvent(new Event('waitme:thinkingUpdated'));
        }
      }catch{}
    }
    handleClose();
    navigate(createPageUrl('History'));
  };

  const handleRechazar=()=>{
    if(request?.id){
      setWaitMeRequestStatus(request.id,'rejected');
      // Save to localStorage so Alertas page shows it as Finalizada
      try{
        const rejected=JSON.parse(localStorage.getItem('waitme:rejected_requests')||'[]');
        rejected.push({id:request.id,request,alert,savedAt:Date.now(),finalized_at:Date.now()});
        localStorage.setItem('waitme:rejected_requests',JSON.stringify(rejected));
        window.dispatchEvent(new Event('waitme:rejectedUpdated'));
      }catch{}
    }
    handleClose();
  };

  // Stable values that only depend on alert/request — not on the 1-second nowTs tick
  const stableInfo = useMemo(() => {
    if (!request) return null;
    const buyer = request.buyer || {};
    const userName = buyer?.name || 'Usuario';
    const firstName = userName.split(' ')[0];
    const carLabel = `${buyer?.brand || ''} ${buyer?.model || ''}`.trim() || 'Sin datos';
    const plate = buyer?.plate || '';
    const carFill = getCarFill(buyer?.color || 'gris');
    const photo = buyer?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=7c3aed&color=fff&size=128`;
    const phoneEnabled = Boolean(buyer?.phone);
    const mins = Number(alert?.available_in_minutes) || 0;
    const alertCreatedKey = alert?.id ? `alert-created-${alert.id}` : null;
    const storedCreated = alertCreatedKey ? Number(localStorage.getItem(alertCreatedKey) || '0') : 0;
    const createdTs = storedCreated > 0 ? storedCreated : (alert?.created_date ? new Date(alert.created_date).getTime() : Date.now());
    const waitUntilTs = createdTs + mins * 60 * 1000;
    const waitUntilLabel = new Date(waitUntilTs).toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false });
    return { buyer, userName, firstName, carLabel, plate, carFill, photo, phoneEnabled, mins, waitUntilTs, waitUntilLabel };
  }, [request, alert]);

  if (!request || !stableInfo) return null;

  const { buyer, userName, firstName, carLabel, plate, carFill, photo, phoneEnabled, mins, waitUntilTs, waitUntilLabel } = stableInfo;

  // Dynamic — only these depend on the 1-second tick
  const remainingMs=Math.max(0,waitUntilTs-nowTs);
  const remSec=Math.floor(remainingMs/1000);
  const remHrs=Math.floor(remSec/3600);
  const remMin=Math.floor((remSec%3600)/60);
  const remSecRem=remSec%60;
  const mm=String(remHrs>0?remHrs:remMin).padStart(2,'0');
  const ss=String(remHrs>0?remMin:remSecRem).padStart(2,'0');
  const ss2=remHrs>0?`:${String(remSecRem).padStart(2,'0')}`:'';
  const countdownText=remainingMs>0?`${mm}:${ss}${ss2}`:'00:00';
  const isCountdown=remainingMs>0;

  return(
    <AnimatePresence>
      {open&&(
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="fixed inset-0 z-[200] flex items-center justify-center px-4"
          style={{backgroundColor:'rgba(0,0,0,0.75)'}}>

          <motion.div initial={{scale:0.9,y:30,opacity:0}} animate={{scale:1,y:0,opacity:1}}
            exit={{scale:0.9,y:30,opacity:0}} transition={{type:'spring',damping:22,stiffness:300}}
            className="w-full max-w-sm bg-gray-900 rounded-2xl border-2 border-purple-500 overflow-hidden">

            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <p className="text-white font-semibold text-lg">
                {firstName} quiere un <span className="text-2xl font-bold">Wait</span>
                <span className="text-purple-400 text-2xl font-bold">Me!</span>
              </p>

              <button onClick={handleMeLoPienso}
                className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="px-3 pb-3">
              <div className="bg-gray-800/60 rounded-xl p-2 border border-purple-500">

                <div className="flex items-center justify-between mb-2">
                  <div className="bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold text-xs rounded-md px-3 py-1">
                    Te reservó:
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
                      <Navigation className="w-3 h-3 text-purple-400"/>
                      <span className="text-white font-bold text-xs">300m</span>
                    </div>
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-2 py-0.5 flex items-center gap-1 h-7">
                      <TrendingUp className="w-4 h-4 text-green-400"/>
                      <span className="text-green-400 font-bold text-sm">3€</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-700/80 mb-2"/>

                <div className="flex gap-2.5">
                  <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500/40 bg-gray-900 flex-shrink-0">
                    <img src={photo} alt={userName} className="w-full h-full object-cover" loading="eager" decoding="sync"/>
                  </div>

                  <div className="flex-1 h-[85px] flex flex-col">
                    <p className="font-bold text-xl text-white leading-none">{firstName}</p>
                    <p className="text-sm font-medium text-gray-200 flex-1 flex items-center truncate relative top-[6px]">{carLabel}</p>

                    <div className="flex items-end gap-2 mt-1 min-h-[28px]">
                      <div className="flex-shrink-0">
                        <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
                          <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
                            <span className="text-white text-[8px] font-bold">E</span>
                          </div>
                          <span className="px-1.5 text-black font-mono font-bold text-sm tracking-wider">{plate}</span>
                        </div>
                      </div>
                      <div className="flex-1 flex justify-center">
                        <div className="flex-shrink-0 relative top-[2px]">
                          <svg viewBox="0 0 48 24" className="w-16 h-10" fill="none">
                            <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill={carFill} stroke="white" strokeWidth="1.5"/>
                            <path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="0.5"/>
                            <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1"/>
                            <circle cx="14" cy="18" r="2" fill="#666"/>
                            <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1"/>
                            <circle cx="36" cy="18" r="2" fill="#666"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-gray-700/80 mt-2 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs min-h-[20px]">
                    <MapPin className="w-4 h-4 flex-shrink-0 text-purple-400"/>
                    <span className="text-gray-200 line-clamp-1 leading-none">{formatAddress(alert?.address)}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] min-h-[20px]">
                    <Clock className="w-4 h-4 flex-shrink-0 text-purple-400"/>
                    <span className="leading-none">
                      <span className="text-white">Te vas en {mins} min · </span>
                      <span className="text-purple-400">Debes esperar hasta las:</span>
                      {' '}<span className="text-white font-bold" style={{fontSize:'14px'}}>{waitUntilLabel}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <Button size="icon" className="h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg border-2 border-green-400" style={{width:'46px',flexShrink:0}}>
                    <MessageCircle className="w-4 h-4"/>
                  </Button>

                  {phoneEnabled?(
                    <Button size="icon" className="h-8 bg-white hover:bg-gray-200 text-black rounded-lg border-2 border-gray-300" style={{width:'46px',flexShrink:0}}
                      onClick={()=>window.location.href=`tel:${buyer.phone}`}>
                      <Phone className="w-4 h-4"/>
                    </Button>
                  ):(
                    <Button size="icon" className="h-8 border-2 border-white/30 bg-white/10 text-white rounded-lg opacity-70" style={{width:'46px',flexShrink:0}} disabled>
                      <PhoneOff className="w-4 h-4"/>
                    </Button>
                  )}

                  <Button size="icon" className="h-8 rounded-lg bg-blue-600 text-white opacity-40 flex items-center justify-center gap-1 border-2 border-blue-400" style={{width:'46px',flexShrink:0}} disabled>
                    <Navigation className="w-4 h-4"/>
                  </Button>

                  <div className="flex-1">
                    <div className={`w-full h-8 rounded-lg border-2 flex items-center justify-center ${isCountdown?'border-purple-400/70 bg-purple-600/25':'border-purple-500/30 bg-purple-600/10'}`}>
                      <span className={`font-mono font-extrabold ${isCountdown?'text-purple-100':'text-purple-300'}`}>
                        {countdownText}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="px-3 pb-4 grid grid-cols-3 gap-2">
              <Button className="bg-purple-600 hover:bg-purple-700 font-semibold" onClick={acceptRequest} disabled={loading}>
                Aceptar
              </Button>
              <Button variant="outline" className="border-gray-600 text-white font-semibold" onClick={handleMeLoPienso} disabled={loading}>
                Me lo pienso
              </Button>
              <Button className="bg-red-600/80 hover:bg-red-700 font-semibold" onClick={handleRechazar} disabled={loading}>
                Rechazar
              </Button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

================================================================
FILE: src/components/Logo.jsx
================================================================
```jsx

// Preload the logo image so it's always instant
let _logoPreloaded = false;
function preloadLogo() {
  if (_logoPreloaded || typeof window === 'undefined') return;
  _logoPreloaded = true;
  try {
    const img = new window.Image();
    img.src = '/assets/d2ae993d3_WaitMe.png';
  } catch {}
}
preloadLogo();

export default function Logo({ size = 'md', className = '', iconOnly = false }) {
  const iconSizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const arrowSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const squareSizes = {
    sm: 'w-2.5 h-2',
    md: 'w-3.5 h-2.5',
    lg: 'w-6 h-4',
    xl: 'w-8 h-5'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {/* Icono cuadrado estilo iOS */}
      <div className={`${iconSizes[size]} bg-black rounded-[22%] flex items-center justify-center gap-1 shadow-lg`}>
        {/* Flechas de intercambio */}
        <svg className={`${arrowSizes[size]} text-purple-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        
        {/* Cuadradito blanco (coche entrando) */}
        <div className={`${squareSizes[size]} bg-white rounded-sm`}></div>
      </div>
      
      {/* Texto WaitMe! solo si NO es iconOnly */}
      {!iconOnly && (
        <span className="text-white font-bold ml-3 text-xl tracking-tight">
          Wait<span className="text-purple-500">Me!</span>
        </span>
      )}
    </div>
  );
}
```

================================================================
FILE: src/components/MapZoomControls.jsx
================================================================
```jsx
/**
 * Botones de zoom (+/-) para el mapa.
 * Usa mapRef.current (instancia visible real). Fallback a easeTo si zoomIn/zoomOut no existen.
 */
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

function zoomIn(map) {
  if (!map) return;
  if (typeof map.zoomIn === 'function') {
    map.zoomIn();
  } else if (typeof map.easeTo === 'function' && typeof map.getZoom === 'function') {
    map.easeTo({ zoom: map.getZoom() + 1 });
  }
}

function zoomOut(map) {
  if (!map) return;
  if (typeof map.zoomOut === 'function') {
    map.zoomOut();
  } else if (typeof map.easeTo === 'function' && typeof map.getZoom === 'function') {
    map.easeTo({ zoom: map.getZoom() - 1 });
  }
}

export default function MapZoomControls({ mapRef, className = '' }) {
  return (
    <div
      className={`absolute z-20 flex flex-col gap-1 pointer-events-auto ${className}`.trim()}
      style={{ top: 80 }}
    >
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="h-9 w-9 rounded-lg border border-purple-500/50 text-white bg-purple-600/50 hover:bg-purple-600/70"
        onClick={() => zoomIn(mapRef?.current)}
      >
        <Plus className="w-5 h-5" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="h-9 w-9 rounded-lg border border-purple-500/50 text-white bg-purple-600/50 hover:bg-purple-600/70"
        onClick={() => zoomOut(mapRef?.current)}
      >
        <Minus className="w-5 h-5" />
      </Button>
    </div>
  );
}

```

================================================================
FILE: src/components/MapZoomControls.stories.jsx
================================================================
```jsx
import MapZoomControls from './MapZoomControls';

export default {
  title: 'Components/MapZoomControls',
  component: MapZoomControls,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#0a0a0a' }] },
  },
};

export const Default = {
  args: {
    mapRef: { current: null },
    className: '',
  },
};

export const WithCustomPosition = {
  args: {
    ...Default.args,
    className: 'left-[4%]',
  },
};

```

================================================================
FILE: src/components/MapboxMap.jsx
================================================================
```jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { getCarWithPriceHtml } from '@/lib/vehicleIcons';
import CenterPin from '@/components/CenterPin';

const RENDER_LOG = (msg, extra) => {
  if (import.meta.env.DEV) {
    try {
      console.log(`[RENDER:MapboxMap] ${msg}`, extra ?? '');
    } catch {}
  }
};

const OVIEDO_CENTER = [-5.8494, 43.3619]; // [lng, lat]
const FALLBACK_ZOOM = 14;
const DEFAULT_ZOOM = 16.5;
const DEFAULT_PITCH = 30;
const DARK_STYLE = 'mapbox://styles/mapbox/dark-v11';
const GPS_TIMEOUT_MS = 2500;
const ACCURACY_RECENTER_THRESHOLD = 80;

export default function MapboxMap({
  className = '',
  alerts = [],
  onAlertClick,
  onMapLoad,
  onRecenterRef,
  mapRef: externalMapRef,
  useCenterPin = false,
  centerPinFromOverlay = false,
  centerPaddingBottom = 0,
  onMapMove,
  onMapMoveEnd,
  children,
  ...rest
}) {
  RENDER_LOG('MapboxMap ENTER');
  const containerRef = useRef(null);
  const internalMapRef = useRef(null);
  const mapRef = externalMapRef ?? internalMapRef;
  const mapboxglRef = useRef(null);
  const markersRef = useRef([]);
  const resizeObserverRef = useRef(null);
  const centerRef = useRef(OVIEDO_CENTER);
  const accuracyRef = useRef(null);
  const watchIdRef = useRef(null);
  const gpsTimeoutRef = useRef(null);
  const hasFlownToUserRef = useRef(false);

  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [location, setLocation] = useState(() => ({
    lat: null,
    lng: null,
    accuracy: null,
    timestamp: null,
  }));

  const effectiveCenter = location.lat != null && location.lng != null
    ? [location.lng, location.lat]
    : OVIEDO_CENTER;

  const flyToUser = useCallback((coords) => {
    const map = mapRef.current;
    if (!map?.flyTo) return;
    const [lng, lat] = Array.isArray(coords) && coords.length >= 2
      ? [coords[1], coords[0]]
      : (coords?.lat != null && coords?.lng != null
        ? [coords.lng, coords.lat]
        : (location.lat != null && location.lng != null ? [location.lng, location.lat] : OVIEDO_CENTER));
    const c = [lng, lat];
    const padding = centerPaddingBottom > 0 ? { top: 0, bottom: 120, left: 0, right: 0 } : undefined;
    map.flyTo({
      center: c,
      zoom: DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH,
      duration: 800,
      essential: true,
      speed: 0.8,
      ...(padding && { padding }),
    });
  }, [location.lat, location.lng, centerPaddingBottom]);

  useEffect(() => {
    if (onRecenterRef) onRecenterRef.current = flyToUser;
    return () => { if (onRecenterRef) onRecenterRef.current = null; };
  }, [onRecenterRef, flyToUser]);

  useEffect(() => {
    const handler = () => flyToUser();
    window.addEventListener('waitme:goLogo', handler);
    return () => window.removeEventListener('waitme:goLogo', handler);
  }, [flyToUser]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: 43.3619, lng: -5.8494, accuracy: 500, timestamp: Date.now() });
      return;
    }

    // Obtener ubicación al cargar para centrar mapa inmediatamente
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLocation({
          lat: latitude,
          lng: longitude,
          accuracy: typeof accuracy === 'number' ? accuracy : 100,
          timestamp: Date.now(),
        });
      },
      () => {
        setLocation({ lat: 43.3619, lng: -5.8494, accuracy: 500, timestamp: Date.now() });
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 8000 }
    );

    let resolved = false;
    gpsTimeoutRef.current = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      setLocation((prev) => {
        if (prev.lat != null && prev.lng != null) return prev;
        return { lat: 43.3619, lng: -5.8494, accuracy: 500, timestamp: Date.now() };
      });
    }, GPS_TIMEOUT_MS);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const acc = typeof accuracy === 'number' ? accuracy : 100;
        setLocation({
          lat: latitude,
          lng: longitude,
          accuracy: acc,
          timestamp: Date.now(),
        });
        if (!resolved) {
          resolved = true;
          clearTimeout(gpsTimeoutRef.current);
        }
      },
      () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(gpsTimeoutRef.current);
          setLocation({ lat: 43.3619, lng: -5.8494, accuracy: 500, timestamp: Date.now() });
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    return () => {
      clearTimeout(gpsTimeoutRef.current);
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    const tokenStr = token ? String(token).trim() : '';
    const isPlaceholder = !tokenStr ||
      tokenStr === 'PEGA_AQUI_EL_TOKEN' ||
      tokenStr === 'YOUR_MAPBOX_PUBLIC_TOKEN';

    if (isPlaceholder) {
      setError('no_token');
      return;
    }

    if (!containerRef.current) return;
    const container = containerRef.current;

    let map = null;
    let cancelled = false;

    import('mapbox-gl')
      .then((mod) => {
        if (cancelled || !containerRef.current) return;
        const mapboxgl = mod.default;
        mapboxglRef.current = mapboxgl;
        import('mapbox-gl/dist/mapbox-gl.css');
        mapboxgl.accessToken = token;

        try {
          map = new mapboxgl.Map({
            container: container,
            style: DARK_STYLE,
            center: OVIEDO_CENTER,
            zoom: DEFAULT_ZOOM,
            pitch: DEFAULT_PITCH,
            bearing: 0,
            antialias: true,
            attributionControl: false,
            dragPan: true,
            touchZoomRotate: true,
            scrollZoom: true,
          });

          if (mapRef) mapRef.current = map;

          map.on('load', () => {
            if (cancelled) return;
            if (mapRef) mapRef.current = map;
            if (onMapLoad) onMapLoad(map);
            if (import.meta.env.DEV) {
              try {
                window.__DEV_DIAG = { ...(window.__DEV_DIAG || {}), mapboxMounted: true, mapRefAvailable: !!mapRef?.current };
              } catch {}
            }

            // Estilo Uber/Bolt nocturno: desactivar relieve y árboles
            try {
              if (map.getTerrain()) map.setTerrain(null);
            } catch {}
            const style = map.getStyle();
            if (style?.layers) {
              for (const layer of style.layers) {
                const id = (layer.id || '').toLowerCase();
                if (id.includes('tree') || id.includes('park') || id.includes('landcover') || id.includes('land-use')) {
                  try { map.setLayoutProperty(layer.id, 'visibility', 'none'); } catch {}
                }
              }
            }

            map.resize();
            setMapReady(true);

            const resizeDelayed = () => {
              if (mapRef.current) mapRef.current.resize();
            };
            setTimeout(resizeDelayed, 100);
            setTimeout(resizeDelayed, 400);
            setTimeout(resizeDelayed, 800);

            if (container && typeof ResizeObserver !== 'undefined') {
              const ro = new ResizeObserver(resizeDelayed);
              resizeObserverRef.current = ro;
              ro.observe(container);
            }
          });

          map.on('error', (e) => {
            const msg = e?.error?.message || String(e);
            if (msg.includes('token') || msg.includes('401') || msg.includes('Unauthorized')) setError('no_token');
          });
        } catch (err) {
          setError('no_token');
        }
      })
      .catch(() => {
        setError('no_token');
      });

    return () => {
      if (import.meta.env.DEV) {
        try {
          window.__DEV_DIAG = { ...(window.__DEV_DIAG || {}), mapboxMounted: false, mapRefAvailable: false };
        } catch {}
      }
      cancelled = true;
      resizeObserverRef.current?.disconnect?.();
      resizeObserverRef.current = null;
      markersRef.current.forEach((m) => m?.remove?.());
      markersRef.current = [];
      if (map) {
        try { map.remove(); } catch {}
      }
      mapRef.current = null;
      mapboxglRef.current = null;
      setMapReady(false);
    };
  }, []);

  const lastFlownCenterRef = useRef(null);
  useEffect(() => {
    if (!mapReady || !mapRef.current || error) return;
    const map = mapRef.current;
    const [lng, lat] = effectiveCenter;
    const accuracy = location.accuracy ?? 50;
    centerRef.current = [lng, lat];
    accuracyRef.current = accuracy;

    const key = `${lng.toFixed(5)}_${lat.toFixed(5)}`;
    if (lastFlownCenterRef.current === key) return;
    lastFlownCenterRef.current = key;

    if (useCenterPin) {
      const padding = centerPaddingBottom > 0
        ? { top: 0, bottom: 120, left: 0, right: 0 }
        : undefined;
      map.flyTo({
        center: [lng, lat],
        zoom: DEFAULT_ZOOM,
        pitch: DEFAULT_PITCH,
        duration: 500,
        padding,
      });
      return;
    }

    const shouldRecenter = accuracy <= ACCURACY_RECENTER_THRESHOLD && lat !== 43.3619 && lng !== -5.8494;
    if (shouldRecenter && !hasFlownToUserRef.current) {
      hasFlownToUserRef.current = true;
      map.flyTo({ center: [lng, lat], zoom: DEFAULT_ZOOM, pitch: DEFAULT_PITCH, duration: 600, speed: 0.8 });
    } else if (shouldRecenter) {
      map.flyTo({ center: [lng, lat], zoom: DEFAULT_ZOOM, pitch: DEFAULT_PITCH, duration: 400, speed: 0.8 });
    }
  }, [mapReady, effectiveCenter, location.accuracy, error, useCenterPin, centerPaddingBottom]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || error || !mapboxglRef.current) return;
    const map = mapRef.current;
    const mapboxgl = mapboxglRef.current;

    markersRef.current.forEach((m) => m?.remove?.());
    markersRef.current = [];

    const userLng = location.lng;
    const userLat = location.lat;
    if (userLat != null && userLng != null && !useCenterPin) {
      const userPinHtml = `<div style="position:relative;width:40px;height:100px;">
        <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:2px;height:45px;background:#a855f7;"></div>
        <div style="position:absolute;bottom:40px;left:50%;transform:translateX(-50%);width:20px;height:20px;background:#a855f7;border-radius:50%;"></div>
      </div>`;
      const userEl = document.createElement('div');
      userEl.innerHTML = userPinHtml;
      const userMarkerEl = userEl.firstElementChild || userEl;
      const userMarker = new mapboxgl.Marker({ element: userMarkerEl, anchor: 'bottom' })
        .setLngLat([userLng, userLat])
        .addTo(map);
      markersRef.current.push(userMarker);
    }

    const list = Array.isArray(alerts) ? alerts : [];
    list.forEach((alert) => {
      const lat = alert.latitude ?? alert.lat;
      const lng = alert.longitude ?? alert.lng;
      if (lat == null || lng == null) return;

      const type = alert.vehicle_type || 'car';
      const color = alert.vehicle_color ?? alert.color ?? 'gray';
      const price = alert.price ?? 0;
      const html = getCarWithPriceHtml(type, color, price);

      const el = document.createElement('div');
      el.innerHTML = html;
      const markerEl = el.firstElementChild || el;
      markerEl.className = 'mapboxgl-marker-vehicle';

      const marker = new mapboxgl.Marker({ element: markerEl })
        .setLngLat([lng, lat])
        .addTo(map);

      if (onAlertClick) {
        markerEl.style.cursor = 'pointer';
        markerEl.addEventListener('click', () => onAlertClick(alert));
      }

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m?.remove?.());
      markersRef.current = [];
    };
  }, [mapReady, error, alerts, onAlertClick, location.lat, location.lng, useCenterPin]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || error || !useCenterPin) return;
    const map = mapRef.current;
    if (centerPaddingBottom > 0) {
      map.setPadding({ top: 0, bottom: 120, left: 0, right: 0 });
    } else {
      map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
    }
  }, [mapReady, error, useCenterPin, centerPaddingBottom]);

  // Brillo y contraste de calles cuando create (centerPaddingBottom > 0)
  useEffect(() => {
    if (!mapReady || !mapRef.current || error || centerPaddingBottom <= 0) return;
    const map = mapRef.current;
    const style = map.getStyle();
    if (!style?.layers) return;
    const ROAD_COLOR = '#8b5cf6';
    for (const layer of style.layers) {
      const id = (layer.id || '').toLowerCase();
      if (id.includes('road') && layer.type === 'line') {
        try {
          map.setPaintProperty(layer.id, 'line-color', ROAD_COLOR);
          map.setPaintProperty(layer.id, 'line-opacity', 1);
          const w = map.getPaintProperty(layer.id, 'line-width');
          if (typeof w === 'number') map.setPaintProperty(layer.id, 'line-width', w + 0.5);
        } catch {}
      }
    }
  }, [mapReady, error, centerPaddingBottom]);

  const onMapMoveRef = useRef(onMapMove);
  const onMapMoveEndRef = useRef(onMapMoveEnd);
  onMapMoveRef.current = onMapMove;
  onMapMoveEndRef.current = onMapMoveEnd;

  useEffect(() => {
    if (!mapReady || !mapRef.current || error || !useCenterPin) return;
    const map = mapRef.current;
    const onMove = () => {
      const c = map.getCenter();
      onMapMoveRef.current?.([c.lat, c.lng]);
    };
    const onMoveEnd = () => {
      const c = map.getCenter();
      onMapMoveEndRef.current?.([c.lat, c.lng]);
    };
    map.on('move', onMove);
    map.on('moveend', onMoveEnd);
    return () => {
      map.off('move', onMove);
      map.off('moveend', onMoveEnd);
    };
  }, [mapReady, error, useCenterPin]);


  if (error) {
    RENDER_LOG('MapboxMap RETURNS error state', error);
    return (
      <div className="relative w-full h-full min-h-[200px]" style={{ minHeight: '100vh' }}>
        <div
          className={`flex items-center justify-center bg-[#0B0B0F] text-gray-500 text-sm ${className}`}
          style={{ width: '100%', height: '100%', minHeight: '100vh' }}
        >
          Mapa no disponible
        </div>
      </div>
    );
  }

  const isZeroSize = false;
  const containerStyle = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    minHeight: isZeroSize ? '100vh' : '100dvh',
    minWidth: '100%',
    touchAction: 'manipulation',
  };

  const { style: restStyle, ...restProps } = rest;
  RENDER_LOG('MapboxMap RETURNS map container', { mapReady });
  return (
    <div
      ref={containerRef}
      className={`${className} w-full h-full relative`}
      style={{ ...containerStyle, ...restStyle }}
      {...restProps}
    >
      {useCenterPin && !centerPinFromOverlay && <CenterPin />}
      {children}
    </div>
  );
}

```

================================================================
FILE: src/components/SearchMapOverlay.jsx
================================================================
```jsx
/**
 * Overlay "¿Dónde quieres aparcar?" — CON StreetSearch arriba.
 * Pin fijo entre buscador y tarjeta. Mapa arrastrable. Zoom controls.
 */
import { useEffect, useRef, useState } from 'react';
import StreetSearch from '@/components/StreetSearch';
import CenterPin from '@/components/CenterPin';
import MapZoomControls from '@/components/MapZoomControls';

const PIN_HEIGHT = 54;
const HEADER_BOTTOM = 60;

export default function SearchMapOverlay({
  onStreetSelect,
  mapRef,
  filtersButton,
  filtersContent,
  alertCard,
}) {
  const overlayRef = useRef(null);
  const searchRef = useRef(null);
  const cardRef = useRef(null);
  const [pinTop, setPinTop] = useState(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const search = searchRef.current;
    const card = cardRef.current;
    if (!overlay || !search || !card) return;

    const updatePinPosition = () => {
      const overlayRect = overlay.getBoundingClientRect();
      const searchRect = search.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const searchBottom = searchRect.bottom;
      const cardTop = cardRect.top;
      const midPoint = (searchBottom + cardTop) / 2;
      const pinTopFromOverlay = midPoint - overlayRect.top - PIN_HEIGHT;
      setPinTop(Math.max(0, pinTopFromOverlay));
    };

    updatePinPosition();
    const ro = new ResizeObserver(updatePinPosition);
    ro.observe(overlay);
    ro.observe(search);
    ro.observe(card);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 top-[60px] flex flex-col pointer-events-none"
      style={{ overflow: 'hidden', height: 'calc(100dvh - 60px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}
    >
      {/* Botón filtros */}
      <div className="absolute top-3 right-3 z-[1000] pointer-events-auto">
        {filtersButton}
        {filtersContent}
      </div>

      {/* StreetSearch */}
      <div
        ref={searchRef}
        className="px-4 pt-3 pb-2 flex-shrink-0 pointer-events-auto"
      >
        <StreetSearch
          onSelect={onStreetSelect}
          placeholder="Buscar calle o dirección..."
        />
      </div>

      {/* Área UserAlertCard */}
      <div
        ref={cardRef}
        className="flex-1 px-4 pt-2 pb-3 min-h-0 overflow-hidden flex items-start pointer-events-auto"
      >
        <div className="w-full h-full">{alertCard}</div>
      </div>

      {/* Pin fijo */}
      {pinTop != null && <CenterPin top={pinTop} />}

      {/* Zoom controls */}
      <MapZoomControls mapRef={mapRef} />
    </div>
  );
}

```

================================================================
FILE: src/components/SellerLocationTracker.jsx
================================================================
```jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as alerts from '@/data/alerts';
import * as userLocations from '@/data/userLocations';
import { motion } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

function createUserMarkerHtml() {
  return `
    <div style="position:relative;width:40px;height:60px;">
      <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:2px;height:35px;background:#a855f7;"></div>
      <div style="position:absolute;bottom:30px;left:50%;transform:translateX(-50%);width:18px;height:18px;background:#a855f7;border-radius:50%;box-shadow:0 0 15px rgba(168,85,247,0.8);animation:pulse-purple 1.5s ease-in-out infinite;"></div>
    </div>
  `;
}

function createBuyerMarkerHtml() {
  return `
    <div style="width:40px;height:40px;background:linear-gradient(135deg,#3b82f6,#2563eb);border:3px solid white;border-radius:50%;box-shadow:0 4px 12px rgba(59,130,246,0.6);display:flex;align-items:center;justify-content:center;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 19h20L12 2z"/></svg>
    </div>
  `;
}

export default function SellerLocationTracker({ alertId, userLocation }) {
  const [alert, setAlert] = useState(null);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!alertId) return;
    let cancelled = false;
    alerts.getAlert(alertId).then(({ data }) => {
      if (!cancelled && data) setAlert(data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [alertId]);

  const { data: buyerLocations = [] } = useQuery({
    queryKey: ['buyerLocations', alertId],
    queryFn: async () => {
      return await userLocations.getLocationsByAlert(alertId);
    },
    enabled: !!alertId,
    refetchInterval: 5000,
  });

  const calculateDistance = useCallback((buyerLoc) => {
    if (!userLocation) return null;
    const R = 6371;
    const dLat = ((buyerLoc.latitude - userLocation[0]) * Math.PI) / 180;
    const dLon = ((buyerLoc.longitude - userLocation[1]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation[0] * Math.PI) / 180) *
        Math.cos((buyerLoc.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;
    if (distanceKm < 1) return { value: Math.round(distanceKm * 1000), unit: 'm' };
    return { value: distanceKm.toFixed(1), unit: 'km' };
  }, [userLocation]);

  const closestBuyer = buyerLocations.length > 0 ? buyerLocations[0] : null;
  const distance = closestBuyer ? calculateDistance(closestBuyer) : null;

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token || token === 'PEGA_AQUI_EL_TOKEN' || !containerRef.current || !alert) return;

    mapboxgl.accessToken = token;
    const center = userLocation || [alert.latitude, alert.longitude];
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [center[1], center[0]],
      zoom: 16,
      pitch: 45,
      bearing: 0,
      attributionControl: false,
    });

    map.on('load', () => {
      mapRef.current = map;
      map.resize();
    });
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m?.remove?.());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [alert?.id]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded?.() || !alert) return;

    markersRef.current.forEach((m) => m?.remove?.());
    markersRef.current = [];

    const addMarker = (lngLat, html) => {
      const el = document.createElement('div');
      el.innerHTML = html;
      const marker = new mapboxgl.Marker({ element: el.firstElementChild || el })
        .setLngLat([lngLat[1], lngLat[0]])
        .addTo(map);
      markersRef.current.push(marker);
    };

    if (userLocation) addMarker(userLocation, createUserMarkerHtml());
    buyerLocations.forEach((loc) => addMarker([loc.latitude, loc.longitude], createBuyerMarkerHtml()));
  }, [alert, userLocation, buyerLocations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded?.()) return;
    const center = userLocation || (alert ? [alert.latitude, alert.longitude] : null);
    if (center) map.flyTo({ center: [center[1], center[0]], zoom: 16, duration: 500 });
  }, [userLocation, alert]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const t = setTimeout(() => map.resize(), 150);
    return () => clearTimeout(t);
  }, [buyerLocations]);

  if (!alert || buyerLocations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-24 left-4 right-4 z-40 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 border-2 border-blue-500 shadow-2xl"
    >
      <div className="mb-2">
        <p className="text-white font-bold text-lg">¡El comprador viene hacia ti!</p>
        {distance && (
          <p className="text-blue-100 text-sm">
            Está a {distance.value}
            {distance.unit} de distancia
          </p>
        )}
      </div>

      <div className="h-48 rounded-xl overflow-hidden border-2 border-white/30 relative">
        <style>{`
          @keyframes pulse-purple {
            0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
            50% { opacity: 0.7; transform: translateX(-50%) scale(1.1); }
          }
        `}</style>
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </motion.div>
  );
}

```

================================================================
FILE: src/components/StreetSearch.jsx
================================================================
```jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

const MAPBOX_GEOCODE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
const OVIEDO_PROXIMITY = '-5.8494,43.3619';
const LIMIT = 6;

/**
 * Formatea place_name de Mapbox a formato corto.
 * "Calle Campoamor, Asturias, Spain" → "C/ Campoamor, Oviedo"
 * "Calle Campoamor 13, Asturias, Spain" → "C/ Campoamor 13, Oviedo"
 */
function formatStreetName(placeName) {
  if (!placeName || typeof placeName !== 'string') return placeName || '';
  const parts = placeName.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return placeName;

  let street = parts[0] || '';
  street = street.replace(/^Calle\s+/i, 'C/ ').replace(/^Avenida\s+/i, 'Av. ').replace(/^Plaza\s+/i, 'Pl. ');

  return `${street}, Oviedo`;
}

/**
 * Buscador de calles con Mapbox Geocoding.
 * - Al escribir → sugerencias automáticas
 * - Al seleccionar → centrar mapa (callback con [lng, lat])
 * - Ubicación: debajo del header
 */
export default function StreetSearch({ onSelect, placeholder = 'Buscar calle o dirección...', className = '' }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const abortRef = useRef(null);

  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  const hasToken = token && String(token).trim() && !['PEGA_AQUI_EL_TOKEN', 'YOUR_MAPBOX_PUBLIC_TOKEN'].includes(String(token).trim());

  const fetchSuggestions = useCallback(async (q) => {
    if (!hasToken || !q || q.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const url = new URL(`${MAPBOX_GEOCODE_URL}/${encodeURIComponent(q.trim())}.json`);
      url.searchParams.set('access_token', token);
      url.searchParams.set('limit', String(LIMIT));
      url.searchParams.set('proximity', OVIEDO_PROXIMITY);
      url.searchParams.set('country', 'ES');
      url.searchParams.set('language', 'es');

      const res = await fetch(url.toString(), { signal: controller.signal });
      if (!res.ok) throw new Error('Geocode failed');

      const data = await res.json();
      const features = Array.isArray(data?.features) ? data.features : [];
      setSuggestions(features);
    } catch (err) {
      if (err?.name !== 'AbortError') setSuggestions([]);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [hasToken]);

  useEffect(() => {
    const q = (query || '').trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    const t = setTimeout(() => fetchSuggestions(q), 250);
    return () => clearTimeout(t);
  }, [query, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelect = (feature) => {
    const center = feature?.geometry?.coordinates;
    if (Array.isArray(center) && center.length >= 2) {
      const [lng, lat] = center;
      const formatted = formatStreetName(feature.place_name || feature.text || '');
      setQuery(formatted);
      setSuggestions([]);
      setOpen(false);
      onSelect?.({ lng, lat, place_name: formatted });
    }
  };

  if (!hasToken) return null;

  return (
    <div ref={containerRef} className={`relative mt-[10px] ${className}`}>
      <div className="bg-gray-900/80 backdrop-blur-sm border-2 border-purple-500/50 rounded-xl px-3 py-2 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-purple-400 flex-shrink-0" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="bg-transparent border-0 text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-8 text-sm p-0 flex-1"
          autoComplete="off"
        />
      </div>

      {open && (suggestions.length > 0 || loading) && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-gray-900/95 backdrop-blur-md border-2 border-purple-500/50 rounded-xl overflow-hidden z-[100] max-h-[220px] overflow-y-auto">
          {loading && suggestions.length === 0 && (
            <li className="px-4 py-3 text-gray-400 text-sm">Buscando...</li>
          )}
          {suggestions.map((f) => (
            <li
              key={f.id || f.place_name}
              role="button"
              tabIndex={0}
              className="px-4 py-3 text-white text-sm hover:bg-purple-600/30 cursor-pointer border-b border-gray-700/50 last:border-b-0"
              onClick={() => handleSelect(f)}
              onKeyDown={(e) => e.key === 'Enter' && handleSelect(f)}
            >
              {formatStreetName(f.place_name || f.text || '')}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

```

================================================================
FILE: src/components/WaitMeRequestScheduler.jsx
================================================================
```jsx
import { useEffect, useRef } from 'react';
import { upsertWaitMeRequest } from '@/lib/waitmeRequests';
import { MOCK_USERS } from '@/lib/mockNearby';
import { addDemoAlert, addIncomingWaitMeConversation } from '@/components/DemoFlowManager';
import * as alerts from '@/data/alerts';

// Dispara la petición demo SOLO 30 segundos después de que el usuario publique una alerta.
export default function WaitMeRequestScheduler() {
  const timerRef = useRef(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const handleAlertPublished = (e) => {
      // Solo disparar una vez por sesión
      if (firedRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);

      const publishedAlertId = e?.detail?.alertId || null;

      timerRef.current = setTimeout(async () => {
        if (firedRef.current) return;

        // Guard: only fire if the published alert is still active
        if (publishedAlertId) {
          try {
            const { data: a } = await alerts.getAlert(publishedAlertId);
            const st = String(a?.status || '').toLowerCase();
            if (st !== 'active' && st !== 'reserved') return; // alert was cancelled/expired
          } catch {}
        }

        firedRef.current = true;

        try {
          const buyer = MOCK_USERS[0];

          // Intentar usar la alerta real recién publicada
          let alertData = null;
          if (publishedAlertId) {
            try {
              alertData = (await alerts.getAlert(publishedAlertId)).data;
            } catch {}
          }

          if (!alertData) {
            alertData = {
              id: publishedAlertId || 'demo_1',
              address: 'Calle Uría, Oviedo',
              available_in_minutes: 6,
              price: 3,
              latitude: 43.3629,
              longitude: -5.8488,
              created_date: new Date().toISOString()
            };
          }

          addDemoAlert(alertData);

          const req = {
            id: `req_${Date.now()}`,
            type: 'incoming_waitme_request',
            title: 'Usuario quiere tu WaitMe!',
            createdAt: Date.now(),
            status: 'pending',
            alertId: alertData.id,
            buyer: {
              id: buyer.id,
              name: buyer.name,
              photo: buyer.photo,
              vehicle_type: buyer.vehicle_type,
              model: buyer.model,
              color: buyer.color,
              plate: buyer.plate,
              phone: buyer.phone
            }
          };

          upsertWaitMeRequest(req);
          addIncomingWaitMeConversation(alertData.id, req.buyer);

          window.dispatchEvent(new CustomEvent('waitme:showIncomingRequestModal', { detail: { request: req, alert: alertData } }));
          window.dispatchEvent(new Event('waitme:showIncomingBanner'));
        } catch {}
      }, 30_000);
    };

    window.addEventListener('waitme:alertPublished', handleAlertPublished);

    return () => {
      window.removeEventListener('waitme:alertPublished', handleAlertPublished);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return null;
}
```

================================================================
FILE: src/components/cards/CreateAlertCard.jsx
================================================================
```jsx
import { useState } from 'react';
import { MapPin, Clock, Euro, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddressAutocompleteInput from '@/components/AddressAutocompleteInput';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export default function CreateAlertCard({
  address,
  onAddressChange,
  onRecenter,
  onCreateAlert,
  isLoading = false,
  mapRef,
}) {
  const [price, setPrice] = useState(3);
  const [minutes, setMinutes] = useState(10);

  const handleCreate = () => {
    onCreateAlert({ price, minutes });
  };

  const flyToCoords = (lng, lat) => {
    if (!mapRef?.current) return;
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 17,
      duration: 1200,
      essential: true,
      padding: { top: 0, bottom: 120, left: 0, right: 0 },
    });
  };

  const fallbackToMapCenter = () => {
    if (!mapRef?.current) return;
    try {
      const c = mapRef.current.getCenter?.();
      if (c && typeof c.lat === 'number' && typeof c.lng === 'number') {
        onRecenter?.({ lat: c.lat, lng: c.lng });
        mapRef.current.flyTo({
          center: [c.lng, c.lat],
          zoom: 17,
          duration: 1200,
          essential: true,
          padding: { top: 0, bottom: 120, left: 0, right: 0 },
        });
      }
    } catch (err) {
      // fallback silencioso si getCenter/flyTo fallan
    }
  };

  const handleUbicite = () => {
    if (!mapRef?.current) {
      console.warn('[Ubícate] mapRef no disponible');
      return;
    }

    if (!navigator.geolocation) {
      fallbackToMapCenter();
      return;
    }

    let resolved = false;
    let fallbackTimer;

    const resolve = (fn) => {
      if (resolved) return;
      resolved = true;
      if (fallbackTimer != null) clearTimeout(fallbackTimer);
      try {
        fn?.();
      } catch (err) {
        try {
          fallbackToMapCenter();
        } catch {
          // último recurso si todo falla
        }
      }
    };

    fallbackTimer = setTimeout(() => resolve(fallbackToMapCenter), 2000);

    const onSuccess = (pos) => {
      const coords = pos?.coords;
      if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
        resolve(fallbackToMapCenter);
        return;
      }
      resolve(() => {
        const { latitude, longitude } = coords;
        const map = mapRef?.current;
        if (map?.flyTo) {
          onRecenter?.({ lat: latitude, lng: longitude });
          map.flyTo({
            center: [longitude, latitude],
            zoom: 17,
            duration: 1200,
            essential: true,
            padding: { top: 0, bottom: 120, left: 0, right: 0 },
          });
        } else {
          fallbackToMapCenter();
        }
      });
    };

    const onError = () => {
      resolve(fallbackToMapCenter);
    };

    try {
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        onError,
        { enableHighAccuracy: true, timeout: 2000, maximumAge: 0 }
      );
    } catch (err) {
      resolve(fallbackToMapCenter);
    }
  };

  return (
    <div
      className="pointer-events-auto bg-gray-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border-2 border-purple-500/70 shadow-xl flex flex-col"
      style={{
        boxShadow:
          '0 0 30px rgba(168, 85, 247, 0.4), inset 0 0 20px rgba(168, 85, 247, 0.15)',
      }}
    >
      <div className="flex flex-col justify-between flex-1 min-h-0 gap-y-6">
        {/* Ubicación */}
        <div className="flex items-center gap-2">
          <MapPin className="w-[22px] h-[22px] text-purple-400 flex-shrink-0" />

          <AddressAutocompleteInput
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="C/ Campoamor, 13"
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 flex-1 h-8 text-xs"
            idPrefix="waitme-address"
          />

          <Button
            className="pointer-events-auto h-8 w-8 min-h-[32px] min-w-[32px] p-0 border border-purple-500/50 text-white bg-purple-600/50 hover:bg-purple-600/70 flex items-center justify-center"
            onClick={handleUbicite}
            type="button"
          >
            <LocateFixed className="w-5 h-5" />
          </Button>
        </div>

        {/* Tiempo */}
        <div className="flex items-center gap-2">
          <Clock className="w-[22px] h-[22px] text-purple-400 flex-shrink-0 self-center translate-y-[4px]" />

          <div className="flex-1 space-y-0.5 mt-2">
            <Label className="text-white text-xs font-medium">
              Me voy en:
              <span className="text-purple-400 font-bold text-[22px] leading-none ml-2">
                {minutes} minutos
              </span>
            </Label>

            <Slider
              value={[minutes]}
              onValueChange={(v) => setMinutes(v[0])}
              min={5}
              max={60}
              step={5}
              className="py-0.5 [&_[data-orientation=horizontal]]:bg-gray-700 [&_[data-orientation=horizontal]>span]:bg-purple-500 [&_[role=slider]]:border-purple-400 [&_[role=slider]]:bg-purple-500"
            />
          </div>
        </div>

        {/* Precio */}
        <div className="flex items-center gap-2">
          <Euro className="w-[22px] h-[22px] text-purple-400 flex-shrink-0 self-center translate-y-[4px]" />

          <div className="flex-1 space-y-0.5 mt-2">
            <Label className="text-white text-xs font-medium">
              Precio:
              <span className="text-purple-400 font-bold text-[22px] leading-none ml-[42px]">
                {price} euros
              </span>
            </Label>

            <Slider
              value={[price]}
              onValueChange={(v) => setPrice(v[0])}
              min={3}
              max={20}
              step={1}
              className="py-0.5 [&_[data-orientation=horizontal]]:bg-gray-700 [&_[data-orientation=horizontal]>span]:bg-purple-500 [&_[role=slider]]:border-purple-400 [&_[role=slider]]:bg-purple-500"
            />
          </div>
        </div>

        {/* Botón publicar — self-center evita stretch del padre flex */}
        <Button
          className="inline-flex px-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold h-8 text-sm self-center w-fit"
          onClick={handleCreate}
          disabled={isLoading || !address}
        >
          {isLoading ? 'Publicando...' : 'Publicar mi WaitMe!'}
        </Button>
      </div>
    </div>
  );
}
```

================================================================
FILE: src/components/cards/CreateAlertCard.stories.jsx
================================================================
```jsx
import CreateAlertCard from './CreateAlertCard';

export default {
  title: 'Cards/CreateAlertCard',
  component: CreateAlertCard,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#0a0a0a' }] },
  },
  argTypes: {
    address: { control: 'text' },
    isLoading: { control: 'boolean' },
  },
};

export const Default = {
  args: {
    address: 'C/ Campoamor, 13',
    onAddressChange: () => {},
    onRecenter: () => {},
    onCreateAlert: () => {},
    isLoading: false,
    mapRef: { current: null },
  },
};

export const Loading = {
  args: {
    ...Default.args,
    isLoading: true,
  },
};

export const EmptyAddress = {
  args: {
    ...Default.args,
    address: '',
  },
};

```

================================================================
FILE: src/components/cards/MarcoCard.jsx
================================================================
```jsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, MessageCircle, Phone, PhoneOff } from 'lucide-react';

function MarcoCard({
  photoUrl,
  name,
  carLabel,
  plate,
  carColor,
  onChat,
  statusText = 'COMPLETADA',
  address,
  timeLine,
  priceChip,
  phoneEnabled = false,
  onCall,
  statusEnabled = false,
  bright = false,
  dimmed = false,
  conversationId,
  role
}) {
  const stUpper = String(statusText || '').trim().toUpperCase();
  const isCountdownLike =
    typeof statusText === 'string' && /^\d{2}:\d{2}(?::\d{2})?$/.test(String(statusText).trim());
  const isCompleted = stUpper === 'COMPLETADA';
  const isDimStatus = stUpper === 'CANCELADA' || stUpper === 'EXPIRADA';
  const statusOn = statusEnabled || isCompleted || isDimStatus || isCountdownLike;

  const photoCls = dimmed ? 'w-full h-full object-cover opacity-40 grayscale' : 'w-full h-full object-cover';

  const nameCls = dimmed ? 'font-bold text-xl text-gray-300 leading-none opacity-70 min-h-[22px]' : 'font-bold text-xl text-white leading-none min-h-[22px]';

  const carCls = dimmed ? 'text-sm font-medium text-gray-400 leading-none opacity-70 flex-1 flex items-center truncate relative top-[6px]' : 'text-sm font-medium text-white leading-none flex-1 flex items-center truncate relative top-[6px]';

  const plateWrapCls = dimmed ? 'opacity-45 flex-shrink-0' : 'flex-shrink-0';
  const carIconWrapCls = dimmed ? 'opacity-45 flex-shrink-0 relative -top-[1px]' : 'flex-shrink-0 relative -top-[1px]';

  const lineTextCls = dimmed ? 'text-gray-400 leading-5 opacity-80' : 'text-white leading-5';

  const isTimeObj =
    timeLine && typeof timeLine === 'object' && !Array.isArray(timeLine) && 'main' in timeLine;

  const statusBoxCls = statusOn
    ? isCountdownLike
      ? 'border-purple-400/70 bg-purple-600/25'
      : 'border-purple-500/30 bg-purple-600/10'
    : 'border-gray-700 bg-gray-800/60';

  const statusTextCls = statusOn
    ? isCountdownLike
      ? 'text-purple-100'
      : isDimStatus
      ? 'text-gray-400/70'
      : 'text-purple-300'
    : 'text-gray-400 opacity-70';

  const getCarFill = (colorValue) => {
    const carColors = [
      { value: 'blanco', fill: '#FFFFFF' },
      { value: 'negro', fill: '#1a1a1a' },
      { value: 'rojo', fill: '#ef4444' },
      { value: 'azul', fill: '#3b82f6' },
      { value: 'amarillo', fill: '#facc15' },
      { value: 'gris', fill: '#6b7280' }
    ];
    const c = carColors.find((x) => x.value === (colorValue || '').toLowerCase());
    return c?.fill || '#6b7280';
  };

  const PlateProfile = ({ plate }) => {
    const formatPlate = (p) => {
      const clean = String(p || '').replace(/\s+/g, '').toUpperCase();
      if (!clean) return '0000 XXX';
      return `${clean.slice(0, 4)} ${clean.slice(4)}`.trim();
    };

    return (
      <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
        <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
          <span className="text-white text-[8px] font-bold">E</span>
        </div>
        <span className="px-2 text-black font-mono font-bold text-sm tracking-wider">
          {formatPlate(plate)}
        </span>
      </div>
    );
  };

  const CarIconProfile = ({ color, size = 'w-16 h-10' }) => (
    <svg viewBox="0 0 48 24" className={size} fill="none" style={{ transform: 'translateY(3px)' }}>
      <path
        d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
      />
      <path
        d="M16 9 L18 12 L30 12 L32 9 Z"
        fill="rgba(255,255,255,0.3)"
        stroke="white"
        strokeWidth="0.5"
      />
      <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
      <circle cx="14" cy="18" r="2" fill="#666" />
      <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
      <circle cx="36" cy="18" r="2" fill="#666" />
    </svg>
  );

  return (
    <>
      <div className="flex gap-2.5">
        <div
          className={`w-[95px] h-[85px] rounded-lg overflow-hidden border-2 flex-shrink-0 ${
            dimmed ? 'border-gray-600/70 bg-gray-800/30' : bright ? 'border-purple-500/40 bg-gray-900' : 'border-gray-600/70 bg-gray-800/30'
          }`}
        >
          {photoUrl ? (
            <img src={photoUrl} alt={name} className={photoCls} />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center text-3xl ${
                bright ? 'text-gray-300' : 'text-gray-600 opacity-40'
              }`}
            >
              👤
            </div>
          )}
        </div>

        <div className="flex-1 h-[85px] flex flex-col">
          <p className={nameCls}>{(name || '').split(' ')[0] || 'Usuario'}</p>
          <p className={carCls}>{carLabel || 'Sin datos'}</p>

          <div className="flex items-end gap-2 mt-1 min-h-[28px]">
            <div className={plateWrapCls}>
              <PlateProfile plate={plate} />
            </div>

            <div className="flex-1 flex justify-center">
              <div className={carIconWrapCls}>
                <CarIconProfile color={getCarFill(carColor)} size="w-16 h-10" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-1.5 border-t border-gray-700/80 mt-2">
        <div className={dimmed ? 'space-y-1.5 opacity-80' : bright ? 'space-y-1.5' : 'space-y-1.5 opacity-80'}>
          {address ? (
            <div className="flex items-start gap-1.5 text-xs">
              <MapPin className={`w-4 h-4 flex-shrink-0 mt-0.5 ${dimmed ? 'text-gray-500' : 'text-purple-400'}`} />
              <span className={`${dimmed ? 'text-gray-400' : 'text-white'} leading-5 line-clamp-1`}>{address ? `${address}, Oviedo` : 'Calle del Paseo, 25, Oviedo'}</span>
            </div>
          ) : null}

          {timeLine ? (
            <div className="flex items-start gap-1.5 text-xs">
              <Clock className={`w-4 h-4 flex-shrink-0 mt-0.5 ${dimmed ? 'text-gray-500' : 'text-purple-400'}`} />
              {isTimeObj ? (
                <span className={lineTextCls}>
                  <span className="text-white">{timeLine.main}</span>
                  <span className="text-purple-400">{timeLine.accent}</span>
                </span>
              ) : (
                <span className={lineTextCls}>
                  <span className="text-purple-400">{timeLine}</span>
                </span>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2">
        <div className="flex gap-2">
          <Button
            size="icon"
            className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-8 w-[42px]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChat?.();
            }}
          >
            <MessageCircle className="w-4 h-4" />
          </Button>

          {phoneEnabled ? (
            <Button
              size="icon"
              className="bg-white hover:bg-gray-200 text-black rounded-lg h-8 w-[42px]"
              onClick={onCall}
            >
              <Phone className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="border-white/30 bg-white/10 text-white rounded-lg h-8 w-[42px] opacity-70 cursor-not-allowed"
              disabled
            >
              <PhoneOff className="w-4 h-4 text-white" />
            </Button>
          )}

          <div className="flex-1">
            <div
              className={`w-full h-8 rounded-lg border-2 flex items-center justify-center px-3 ${statusBoxCls}`}
            >
              <span className={`text-sm font-mono font-extrabold ${statusTextCls}`}>
                {statusText}
              </span>
            </div>
          </div>

        </div>
      </div>


    </>
  );
}
export default React.memo(MarcoCard);

```
