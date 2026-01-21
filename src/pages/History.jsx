import React, { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  Loader,
  X,
  MessageCircle,
  PhoneOff,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import UserCard from '@/components/cards/UserCard';
import SellerLocationTracker from '@/components/SellerLocationTracker';
import { useAuth } from '@/lib/AuthContext';

export default function History() {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState(null);
  const [nowTs, setNowTs] = useState(Date.now());
  const queryClient = useQueryClient();

  // ====== UI helpers ======
  const labelNoClick = 'cursor-default select-none pointer-events-none';
  const noScrollBar =
    '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

  // ====== Fotos fijas (NO rotan) ======
  const fixedAvatars = {
    Sofía: 'https://randomuser.me/api/portraits/women/68.jpg',
    Hugo: 'https://randomuser.me/api/portraits/men/32.jpg',
    Nuria: 'https://randomuser.me/api/portraits/women/44.jpg',
    Iván: 'https://randomuser.me/api/portraits/men/75.jpg',
    Marco: 'https://randomuser.me/api/portraits/men/12.jpg'
  };
  const avatarFor = (name) => fixedAvatars[String(name || '').trim()] || null;

  const formatCardDate = (ts) => {
    if (!ts) return '--';
    const raw = format(new Date(ts), 'd MMMM - HH:mm', { locale: es });
    return raw.replace(/^\d+\s+([a-záéíóúñ]+)/i, (m, mon) => {
      const cap = mon.charAt(0).toUpperCase() + mon.slice(1);
      return m.replace(mon, cap);
    });
  };

  const formatAddress = (addr) => {
    const fallback = 'Calle Gran Vía, n1, Oviedo';
    const s = String(addr || '').trim();
    if (!s) return fallback;
    const hasOviedo = /oviedo/i.test(s);
    const m = s.match(/^(.+?),\s*(?:n\s*)?(\d+)\s*(?:,.*)?$/i);
    if (m) {
      const street = m[1].trim();
      const num = m[2].trim();
      return `${street}, n${num}, Oviedo`;
    }
    if (!hasOviedo) return `${s}, Oviedo`;
    return s;
  };

  const carColors = [
    { value: 'blanco', fill: '#FFFFFF' },
    { value: 'negro', fill: '#1a1a1a' },
    { value: 'rojo', fill: '#ef4444' },
    { value: 'azul', fill: '#3b82f6' },
    { value: 'amarillo', fill: '#facc15' },
    { value: 'gris', fill: '#6b7280' }
  ];

  const getCarFill = (colorValue) => {
    const c = carColors.find((x) => x.value === (colorValue || '').toLowerCase());
    return c?.fill || '#6b7280';
  };

  const formatPlate = (plate) => {
    const p = String(plate || '').replace(/\s+/g, '').toUpperCase();
    if (!p) return '0000 XXX';
    const a = p.slice(0, 4);
    const b = p.slice(4);
    return `${a} ${b}`.trim();
  };

  const CarIconProfile = ({ color, size = 'w-16 h-10' }) => (
    <svg viewBox="0 0 48 24" className={size} fill="none">
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

  const PlateProfile = ({ plate }) => (
    <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
      <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
        <span className="text-white text-[8px] font-bold">E</span>
      </div>
      <span className="px-2 text-black font-mono font-bold text-sm tracking-wider">
        {formatPlate(plate)}
      </span>
    </div>
  );

  const toMs = (v) => {
    if (v == null) return null;
    if (v instanceof Date) return v.getTime();
    if (typeof v === 'number') return v < 1e12 ? v * 1000 : v;
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return null;
      const n = Number(s);
      if (!Number.isNaN(n) && /^\d+(?:\.\d+)?$/.test(s)) return n < 1e12 ? n * 1000 : n;
      const t = new Date(s).getTime();
      return Number.isNaN(t) ? null : t;
    }
    return null;
  };

  const getCreatedTs = (alert) => {
    const candidates = [alert?.created_date, alert?.createdDate, alert?.created_at, alert?.createdAt];
    for (const v of candidates) {
      const t = toMs(v);
      if (typeof t === 'number' && t > 0) return t;
    }
    return null;
  };

  const getWaitUntilTs = (alert) => {
    const createdTs = getCreatedTs(alert);
    if (!createdTs) return null;
    const dateFields = [alert.wait_until, alert.waitUntil, alert.expires_at, alert.expiresAt];
    for (const v of dateFields) {
      const t = toMs(v);
      if (typeof t === 'number' && t > 0) return t;
    }
    const mins = Number(alert.available_in_minutes) || Number(alert.availableInMinutes);
    if (Number.isFinite(mins) && mins > 0) return createdTs + mins * 60000;
    return null;
  };

  const formatRemaining = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    if (h > 0) {
      const hh = String(h).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  const CountdownButton = ({ text, dimmed = false }) => (
    <Button
      type="button"
      variant="outline"
      disabled
      className={[
        'w-full h-9 flex items-center justify-center font-mono font-extrabold text-sm',
        'pointer-events-none cursor-default',
        dimmed
          ? '!border-white/10 !bg-white/5 !text-white/35 !shadow-none !opacity-60 hover:!bg-white/5'
          : '!border-purple-400/70 !bg-purple-600/25 !text-purple-100 hover:!bg-purple-600/25 hover:!text-purple-100 ' +
            '!shadow-[0_0_0_1px_rgba(168,85,247,0.25),0_0_18px_rgba(168,85,247,0.12)]'
      ].join(' ')}
    >
      {text}
    </Button>
  );

  const FinalizedStatusBox = ({ text = 'EXPIRADA' }) => (
    <div className="w-full h-8 rounded-lg border-2 flex items-center justify-center px-3 border-purple-500/30 bg-purple-600/10 opacity-60">
      <span className="text-sm font-mono font-extrabold text-white/35">{text}</span>
    </div>
  );

  const SectionTag = ({ variant, text }) => {
    const cls =
      variant === 'green'
        ? 'bg-green-500/20 border-green-500/30 text-green-400'
        : 'bg-red-500/20 border-red-500/30 text-red-400';
    return (
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-sm w-full flex justify-center py-2">
        <div
          className={`${cls} border rounded-md px-4 h-7 flex items-center justify-center font-bold text-xs text-center ${labelNoClick}`}
        >
          {text}
        </div>
      </div>
    );
  };

  const CardHeaderRow = ({ left, dateText, dateClassName, right }) => (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex-shrink-0">{left}</div>
      <div className={`flex-1 text-center text-xs ${dateClassName || ''}`}>{dateText}</div>
      <div className="flex-shrink-0">{right}</div>
    </div>
  );

  const MoneyChip = ({ mode = 'neutral', amountText, showDownIcon = false, showUpIcon = false }) => {
    const isGreen = mode === 'green';
    const isRed = mode === 'red';
    const wrapCls = isGreen
      ? 'bg-green-500/20 border border-green-500/30'
      : isRed
      ? 'bg-red-500/20 border border-red-500/30'
      : 'bg-gray-500/10 border border-gray-600';
    const textCls = isGreen ? 'text-green-400' : isRed ? 'text-red-400' : 'text-gray-400';
    return (
      <div className={`${wrapCls} rounded-lg px-2 py-1 flex items-center gap-1 h-7`}>
        {showUpIcon ? <TrendingUp className={`w-4 h-4 ${textCls}`} /> : null}
        {showDownIcon ? <TrendingDown className={`w-4 h-4 ${textCls}`} /> : null}
        <span className={`font-bold text-sm ${textCls}`}>{amountText}</span>
      </div>
    );
  };

  const MarcoContent = ({
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
    bright = false
  }) => {
    const isCompleted = String(statusText || '').toUpperCase() === 'COMPLETADA';
    const statusOn = statusEnabled || isCompleted;
    const isCountdownLike = typeof statusText === 'string' && /^\d{2}:\d{2}(?::\d{2})?$/.test(statusText.trim());

    const photoCls = bright ? 'w-full h-full object-cover' : 'w-full h-full object-cover opacity-40 grayscale';
    const nameCls = bright ? 'font-bold text-xl text-white' : 'font-bold text-xl text-gray-300 opacity-70';
    const carCls = bright ? 'text-sm font-medium text-gray-200 truncate top-[6px]' : 'text-sm font-medium text-gray-400 opacity-70 truncate top-[6px]';
    const plateWrapCls = bright ? 'flex-shrink-0' : 'opacity-45 flex-shrink-0';
    const carIconWrapCls = bright ? 'flex-shrink-0' : 'opacity-45 flex-shrink-0';
    const lineTextCls = bright ? 'text-gray-200' : 'text-gray-300';

    const isTimeObj = timeLine && typeof timeLine === 'object' && 'main' in timeLine;

    const statusBoxCls = statusOn
      ? isCountdownLike ? 'border-purple-400/70 bg-purple-600/25' : 'border-purple-500/30 bg-purple-600/10'
      : 'border-gray-700 bg-gray-800/60';

    const statusTextCls = statusOn ? (isCountdownLike ? 'text-purple-100' : 'text-purple-300') : 'text-gray-400 opacity-70';

    return (
      <>
        <div className="flex gap-2.5">
          <div className={`w-[95px] h-[85px] rounded-lg overflow-hidden border-2 flex-shrink-0 ${bright ? 'border-purple-500/40 bg-gray-900' : 'border-gray-600/70 bg-gray-800/30'}`}>
            {photoUrl ? <img src={photoUrl} alt={name} className={photoCls} /> : <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>}
          </div>
          <div className="flex-1 h-[85px] flex flex-col">
            <p className={nameCls + " leading-none"}>{(name || '').split(' ')[0] || 'Usuario'}</p>
            <p className={carCls + " leading-none flex items-center relative"}>{carLabel || 'Sin datos'}</p>
            <div className="flex items-end gap-2 mt-1 min-h-[28px]">
              <div className={plateWrapCls}><PlateProfile plate={plate} /></div>
              <div className="flex-1 flex justify-center"><div className={carIconWrapCls}><CarIconProfile color={getCarFill(carColor)} size="w-16 h-10" /></div></div>
            </div>
          </div>
        </div>
        <div className="pt-1.5 border-t border-gray-700/80 mt-2">
          <div className={bright ? 'space-y-1.5' : 'space-y-1.5 opacity-80'}>
            {address && (
              <div className="flex items-start gap-1.5 text-xs">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                <span className={lineTextCls + ' line-clamp-1'}>{formatAddress(address)}</span>
              </div>
            )}
            {timeLine && (
              <div className="flex items-start gap-1.5 text-xs">
                <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                <span className={lineTextCls}>
                  {isTimeObj ? <>{timeLine.main} <span className={bright ? 'text-purple-400' : lineTextCls}>{timeLine.accent}</span></> : timeLine}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <Button size="icon" className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-8 w-[42px]" onClick={onChat}><MessageCircle className="w-4 h-4" /></Button>
          {phoneEnabled ? (
            <Button size="icon" className="bg-white hover:bg-gray-200 text-black rounded-lg h-8 w-[42px]" onClick={onCall}><Phone className="w-4 h-4" /></Button>
          ) : (
            <Button variant="outline" size="icon" className="border-white/30 bg-white/10 text-white rounded-lg h-8 w-[42px] opacity-70 cursor-not-allowed" disabled><PhoneOff className="w-4 h-4" /></Button>
          )}
          <div className="flex-1">
            {statusOn ? (
              <div className={`w-full h-8 rounded-lg border-2 flex items-center justify-center px-3 ${statusBoxCls}`}>
                <span className={`text-sm font-mono font-extrabold ${statusTextCls}`}>{statusText}</span>
              </div>
            ) : (
              <FinalizedStatusBox text={statusText} />
            )}
          </div>
        </div>
      </>
    );
  };

  const [hiddenKeys, setHiddenKeys] = useState(() => new Set());
  const hideKey = (key) => setHiddenKeys(prev => { const n = new Set(prev); n.add(key); return n; });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(p => setUserLocation([p.coords.latitude, p.coords.longitude]), () => {});
    }
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: myAlerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ['myAlerts', user?.id],
    queryFn: () => base44.entities.ParkingAlert.filter({ user_id: user?.id }),
    enabled: !!user?.id
  });

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['myTransactions', user?.id],
    queryFn: async () => {
      const [asSeller, asBuyer] = await Promise.all([
        base44.entities.Transaction.filter({ seller_id: user?.id }),
        base44.entities.Transaction.filter({ buyer_id: user?.id })
      ]);
      return [...asSeller, ...asBuyer];
    },
    enabled: !!user?.id
  });

  const myActiveAlerts = myAlerts.filter(a => a.user_id === user?.id && (a.status === 'active' || a.status === 'reserved'));
  const myFinalizedAlerts = myAlerts.filter(a => a.user_id === user?.id && ['expired', 'cancelled', 'completed'].includes(a.status));
  const myReservationsReal = myAlerts.filter(a => a.reserved_by_id === user?.id && a.status === 'reserved');

  const mockReservationsActive = useMemo(() => [{
    id: 'mock-res-1', status: 'reserved', reserved_by_id: user?.id, user_name: 'Sofía', user_photo: avatarFor('Sofía'),
    car_brand: 'Seat', car_model: 'Ibiza', car_color: 'rojo', car_plate: '7780KLP', address: 'Calle Gran Vía, 1',
    available_in_minutes: 6, price: 2.5, allow_phone_calls: true, created_date: new Date(Date.now() - 120000).toISOString(),
    wait_until: new Date(Date.now() + 600000).toISOString()
  }], [user?.id]);

  const mockReservationsFinal = useMemo(() => [
    { id: 'm-f-1', status: 'completed', user_name: 'Hugo', user_photo: avatarFor('Hugo'), car_brand: 'BMW', car_model: 'Serie 1', car_color: 'gris', car_plate: '2847BNM', address: 'Calle Gran Vía, 25', available_in_minutes: 8, price: 4.0, created_date: new Date(Date.now() - 172800000).toISOString() },
    { id: 'm-f-2', status: 'cancelled', user_name: 'Nuria', user_photo: avatarFor('Nuria'), car_brand: 'Audi', car_model: 'A3', car_color: 'azul', car_plate: '1209KLP', address: 'Calle Uría, 10', available_in_minutes: 12, price: 3.0, created_date: new Date(Date.now() - 259200000).toISOString() },
    { id: 'm-f-3', status: 'expired', user_name: 'Iván', user_photo: avatarFor('Iván'), car_brand: 'Toyota', car_model: 'Yaris', car_color: 'blanco', car_plate: '4444XYZ', address: 'Calle Campoamor, 15', available_in_minutes: 10, price: 2.8, created_date: new Date(Date.now() - 432000000).toISOString() }
  ], [user?.id]);

  const myFinalizedAll = [...myFinalizedAlerts.map(a => ({ type: 'alert', id: `f-a-${a.id}`, created_date: a.created_date, data: a })), 
    ...transactions.filter(t => t.seller_id === user?.id).map(t => ({ type: 'transaction', id: `f-t-${t.id}`, created_date: t.created_date, data: t }))
  ].sort((a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0));

  const reservationsActiveAll = [...myReservationsReal, ...mockReservationsActive];
  const reservationsFinalAll = [...myAlerts.filter(a => a.reserved_by_id === user?.id && a.status !== 'reserved').map(a => ({ type: 'alert', id: `r-f-a-${a.id}`, created_date: a.created_date, data: a })),
    ...transactions.filter(t => t.buyer_id === user?.id).map(t => ({ type: 'transaction', id: `r-f-t-${t.id}`, created_date: t.created_date, data: t })),
    ...mockReservationsFinal.map(m => ({ type: 'alert', id: `r-f-m-${m.id}`, created_date: m.created_date, data: m }))
  ].sort((a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0));

  const cancelAlertMutation = useMutation({ mutationFn: async (id) => base44.entities.ParkingAlert.update(id, { status: 'cancelled' }), onSuccess: () => queryClient.invalidateQueries(['myAlerts']) });
  const expireAlertMutation = useMutation({ mutationFn: async (id) => base44.entities.ParkingAlert.update(id, { status: 'expired' }), onSuccess: () => queryClient.invalidateQueries(['myAlerts']) });

  const statusLabelFrom = (s) => {
    const st = String(s || '').toUpperCase();
    return ['COMPLETADA', 'CANCELADA', 'EXPIRADA'].includes(st) ? st : 'COMPLETADA';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Historial" showBackButton={true} backTo="Home" />
      <main className="pt-[56px] pb-20 px-4">
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="w-full bg-gray-900 border border-gray-800 mt-4 mb-1">
            <TabsTrigger value="alerts" className="flex-1 data-[state=active]:bg-purple-600">Tus alertas</TabsTrigger>
            <TabsTrigger value="reservations" className="flex-1 data-[state=active]:bg-purple-600">Tus reservas</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className={`space-y-1.5 max-h-[calc(100vh-140px)] overflow-y-auto ${noScrollBar}`}>
            {loadingAlerts ? <div className="text-center py-12"><Loader className="w-8 h-8 animate-spin mx-auto" /></div> : (
              <>
                <SectionTag variant="green" text="Activas" />
                {myActiveAlerts.length === 0 ? <div className="bg-gray-900 rounded-xl p-4 border-2 border-purple-500/50 text-center text-gray-500">No hay alertas activas</div> : (
                  myActiveAlerts.map((alert, i) => {
                    const waitTs = getWaitUntilTs(alert);
                    const rem = waitTs ? Math.max(0, waitTs - nowTs) : null;
                    const cardKey = `active-${alert.id}`;
                    if (hiddenKeys.has(cardKey)) return null;
                    return (
                      <motion.div key={cardKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50">
                        <CardHeaderRow left={<Badge variant="outline" className="border-green-500 text-green-500">ACTIVA</Badge>} dateText={formatCardDate(getCreatedTs(alert))} right={<div className="flex gap-1"><MoneyChip mode="green" amountText={`${alert.price}€`} /><Button size="icon" className="h-7 w-7 bg-red-600" onClick={() => cancelAlertMutation.mutate(alert.id)}><X className="w-4 h-4" /></Button></div>} />
                        <div className="space-y-1.5 opacity-80 text-xs"><div className="flex gap-1.5"><MapPin className="w-4 h-4 text-purple-400" />{formatAddress(alert.address)}</div></div>
                        <div className="mt-2"><CountdownButton text={rem !== null ? formatRemaining(rem) : '--:--'} dimmed={rem <= 0} /></div>
                      </motion.div>
                    );
                  })
                )}
                <SectionTag variant="red" text="Finalizadas" />
                <div className="space-y-1.5">
                  {myFinalizedAll.map(item => (
                    <div key={item.id} className="bg-gray-900 rounded-xl p-2 border border-gray-700">
                      <CardHeaderRow left={<Badge className="bg-red-500/10 text-red-400 border-red-500/20">Finalizada</Badge>} dateText={formatCardDate(toMs(item.created_date))} right={<MoneyChip amountText={`${item.data.price || item.data.amount}€`} />} />
                      <div className="mt-2"><FinalizedStatusBox text={statusLabelFrom(item.data.status)} /></div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="reservations" className={`space-y-1.5 max-h-[calc(100vh-140px)] overflow-y-auto ${noScrollBar}`}>
            <SectionTag variant="green" text="En curso" />
            {reservationsActiveAll.map((res, i) => (
              <div key={res.id} className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50">
                <CardHeaderRow left={<Badge variant="outline" className="border-purple-500 text-purple-500">RESERVA</Badge>} dateText={formatCardDate(toMs(res.created_date))} right={<div className="flex gap-1"><MoneyChip mode="red" amountText={`${res.price}€`} /><Button size="icon" className="h-7 w-7 bg-red-600" onClick={() => cancelAlertMutation.mutate(res.id)}><X className="w-4 h-4" /></Button></div>} />
                <MarcoContent photoUrl={res.user_photo} name={res.user_name} carLabel={`${res.car_brand} ${res.car_model}`} plate={res.car_plate} carColor={res.car_color} address={res.address} statusText="EN CURSO" statusEnabled={true} bright={true} />
              </div>
            ))}
            <SectionTag variant="red" text="Finalizadas" />
            <div className="space-y-1.5">
              {reservationsFinalAll.map(item => (
                <div key={item.id} className="bg-gray-900 rounded-xl p-2 border border-gray-700">
                  <CardHeaderRow left={<Badge className="bg-red-500/10 text-red-400 border-red-500/20">Finalizada</Badge>} dateText={formatCardDate(toMs(item.created_date))} right={<MoneyChip amountText={`${item.data.price || item.data.amount}€`} />} />
                  <MarcoContent photoUrl={item.data.user_photo} name={item.data.user_name} carLabel={`${item.data.car_brand} ${item.data.car_model}`} plate={item.data.car_plate} carColor={item.data.car_color} address={item.data.address} statusText={statusLabelFrom(item.data.status)} statusEnabled={false} />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <BottomNav activeTab="history" />
    </div>
  );
}