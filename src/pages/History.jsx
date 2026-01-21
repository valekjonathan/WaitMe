import React, { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
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
import { useAuth } from '@/lib/AuthContext';

export default function History() {
  const { user } = useAuth();
  const [nowTs, setNowTs] = useState(Date.now());
  const queryClient = useQueryClient();

  // ====== UI helpers ======
  const labelNoClick = 'cursor-default select-none pointer-events-none';
  const noScrollBar = '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

  // ====== Fotos fijas ======
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
    const s = String(addr || '').trim();
    if (!s) return 'Calle Gran Vía, n1, Oviedo';
    return s.includes('Oviedo') ? s : `${s}, Oviedo`;
  };

  const getCarFill = (color) => {
    const colors = { rojo: '#ef4444', azul: '#3b82f6', blanco: '#FFFFFF', negro: '#1a1a1a', amarillo: '#facc15', gris: '#6b7280' };
    return colors[String(color).toLowerCase()] || '#6b7280';
  };

  const CarIconProfile = ({ color }) => (
    <svg viewBox="0 0 48 24" className="w-16 h-10" fill="none">
      <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill={color} stroke="white" strokeWidth="1.5" />
      <path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="0.5" />
      <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
      <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
    </svg>
  );

  const PlateProfile = ({ plate }) => (
    <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
      <div className="bg-blue-600 h-full w-5 flex items-center justify-center text-white text-[8px] font-bold">E</div>
      <span className="px-2 text-black font-mono font-bold text-sm tracking-wider uppercase">
        {plate?.replace(/\s+/g, '') || '0000 XXX'}
      </span>
    </div>
  );

  const toMs = (v) => {
    if (!v) return null;
    const t = new Date(v).getTime();
    return isNaN(t) ? null : t;
  };

  const getWaitUntilTs = (alert) => {
    const created = toMs(alert.created_date || alert.createdAt);
    const wait = toMs(alert.wait_until || alert.expiresAt);
    if (wait) return wait;
    const mins = Number(alert.available_in_minutes || 0);
    return created && mins ? created + mins * 60000 : null;
  };

  const formatRemaining = (ms) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  // ✅ CORRECCIÓN: SectionTag sticky sin huecos
  const SectionTag = ({ variant, text }) => {
    const cls = variant === 'green' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400';
    return (
      <div className="sticky top-0 z-20 bg-black w-full flex justify-center py-2">
        <div className={`${cls} border rounded-md px-4 h-7 flex items-center justify-center font-bold text-xs ${labelNoClick}`}>
          {text}
        </div>
      </div>
    );
  };

  const MoneyChip = ({ mode = 'neutral', amountText }) => {
    const cls = mode === 'green' ? 'bg-green-500/20 border-green-500/30 text-green-400' : mode === 'red' ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-gray-500/10 border-gray-600 text-gray-400';
    return <div className={`${cls} rounded-lg px-2 py-1 flex items-center gap-1 h-7 border font-bold text-sm`}>{amountText}</div>;
  };

  // ✅ RECUPERADO: MarcoContent detallado
  const MarcoContent = ({ photoUrl, name, carLabel, plate, carColor, statusText, address, bright = false }) => {
    const isFinalized = !bright;
    // CORRECCIÓN: Borde encendido para finalizadas
    const cardBorder = bright ? 'border-purple-500/40' : 'border-gray-700/80';
    
    return (
      <div className={`${isFinalized ? 'opacity-90' : ''}`}>
        <div className="flex gap-2.5">
          <div className={`w-[95px] h-[85px] rounded-lg overflow-hidden border-2 flex-shrink-0 ${cardBorder} bg-gray-900`}>
            <img src={photoUrl || '/api/placeholder/95/85'} className={`w-full h-full object-cover ${!bright && 'grayscale opacity-60'}`} alt="" />
          </div>
          <div className="flex-1 flex flex-col justify-between py-0.5">
            <div>
              <p className={`font-bold text-xl leading-none ${bright ? 'text-white' : 'text-gray-300'}`}>{name?.split(' ')[0]}</p>
              <p className={`text-sm mt-1 ${bright ? 'text-gray-200' : 'text-gray-500'}`}>{carLabel}</p>
            </div>
            <div className="flex items-center gap-2">
              <PlateProfile plate={plate} />
              <div className={!bright ? 'opacity-60' : ''}>
                <CarIconProfile color={getCarFill(carColor)} />
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800/80 my-2 pt-2 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <MapPin className="w-3.5 h-3.5 text-purple-400" /> 
            <span className="truncate">{formatAddress(address)}</span>
          </div>
          <div className="flex gap-2 mt-1">
            <Button size="icon" className="h-8 w-11 bg-green-600 hover:bg-green-700"><MessageCircle className="w-4 h-4" /></Button>
            <Button size="icon" className="h-8 w-11 bg-white text-black hover:bg-gray-200"><Phone className="w-4 h-4" /></Button>
            <div className={`flex-1 h-8 rounded-lg border-2 flex items-center justify-center font-mono font-bold text-sm ${bright ? 'border-purple-500/40 bg-purple-500/10 text-purple-200' : 'border-purple-500/20 bg-purple-600/5 text-white/40'}`}>
              {statusText}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ====== Data & Queries ======
  const { data: myAlerts = [], isLoading } = useQuery({
    queryKey: ['myAlerts', user?.id],
    queryFn: () => base44.entities.ParkingAlert.filter({ user_id: user?.id }),
    enabled: !!user?.id
  });

  const cancelAlertMutation = useMutation({
    mutationFn: (id) => base44.entities.ParkingAlert.update(id, { status: 'cancelled' }),
    onSuccess: () => queryClient.invalidateQueries(['myAlerts'])
  });

  const activeAlerts = myAlerts.filter(a => a.status === 'active' || a.status === 'reserved');
  const finalizedAlerts = myAlerts.filter(a => ['completed', 'cancelled', 'expired'].includes(a.status));

  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Historial" showBackButton backTo="Home" />
      
      <main className="pt-14 pb-20 px-4">
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="w-full bg-gray-900 border border-gray-800 mt-4 h-11">
            <TabsTrigger value="alerts" className="flex-1 data-[state=active]:bg-purple-600">Tus alertas</TabsTrigger>
            <TabsTrigger value="reservations" className="flex-1 data-[state=active]:bg-purple-600">Tus reservas</TabsTrigger>
          </TabsList>

          {/* ================= TUS ALERTAS ================= */}
          <TabsContent value="alerts" className={`mt-0 space-y-1.5 ${noScrollBar} overflow-y-auto max-h-[75vh]`}>
            <SectionTag variant="green" text="Activas" />
            {activeAlerts.length === 0 ? (
              <div className="bg-gray-900/50 rounded-xl p-6 border-2 border-dashed border-gray-800 text-center text-gray-600">No hay alertas activas</div>
            ) : (
              activeAlerts.map(alert => {
                const rem = getWaitUntilTs(alert) - nowTs;
                return (
                  <div key={alert.id} className="bg-gray-900/50 rounded-xl p-3 border-2 border-purple-500/40">
                    <div className="flex justify-between items-center mb-2">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">ACTIVA</Badge>
                      <span className="text-[10px] text-gray-500">{formatCardDate(alert.created_date)}</span>
                      <div className="flex gap-1.5">
                        <MoneyChip mode="green" amountText={`${alert.price}€`} />
                        <Button size="icon" className="h-7 w-7 bg-red-600" onClick={() => cancelAlertMutation.mutate(alert.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="w-full h-9 rounded-lg border-2 border-purple-400/70 bg-purple-600/20 flex items-center justify-center font-mono font-bold text-purple-100">
                      {rem > 0 ? formatRemaining(rem) : 'EXPIRADA'}
                    </div>
                  </div>
                );
              })
            )}

            <SectionTag variant="red" text="Finalizadas" />
            {finalizedAlerts.map(alert => (
              <div key={alert.id} className="bg-gray-900/30 rounded-xl p-3 border border-gray-700/80">
                <div className="flex justify-between items-center mb-2">
                  <Badge className="bg-gray-800 text-gray-500 border-gray-700">FINALIZADA</Badge>
                  <span className="text-[10px] text-gray-500">{formatCardDate(alert.created_date)}</span>
                  <MoneyChip amountText={`${alert.price}€`} />
                </div>
                <div className="w-full h-8 rounded-lg border-2 border-purple-500/20 bg-purple-600/5 flex items-center justify-center text-white/40 font-mono text-sm">
                  {alert.status.toUpperCase()}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* ================= TUS RESERVAS ================= */}
          <TabsContent value="reservations" className="mt-0 space-y-1.5">
             <SectionTag variant="green" text="Activas" />
             <div className="bg-gray-900/50 rounded-xl p-6 border-2 border-dashed border-gray-800 text-center text-gray-600">No hay reservas activas</div>
             
             <SectionTag variant="red" text="Finalizadas" />
             {/* Tarjeta de ejemplo recuperada (Nuria) */}
             <div className="bg-gray-900/30 rounded-xl p-3 border border-gray-700/80">
                <div className="flex justify-between items-center mb-3">
                  <Badge className="bg-red-500/10 text-red-400 border-red-500/20">FINALIZADA</Badge>
                  <span className="text-[10px] text-gray-500">18 Enero - 17:32</span>
                  <div className="flex gap-1.5">
                    <MoneyChip amountText="3.00€" />
                    <Button size="icon" className="h-7 w-7 bg-red-600 opacity-50"><X className="w-4 h-4" /></Button>
                  </div>
                </div>
                <MarcoContent 
                  name="Nuria" 
                  photoUrl={avatarFor('Nuria')} 
                  carLabel="Audi A3" 
                  plate="1209 KLP" 
                  carColor="azul" 
                  statusText="CANCELADA" 
                  address="Calle Uría, n10, Oviedo" 
                  bright={false}
                />
             </div>

             {/* Tarjeta de ejemplo recuperada (Iván) */}
             <div className="bg-gray-900/30 rounded-xl p-3 border border-gray-700/80">
                <div className="flex justify-between items-center mb-3">
                  <Badge className="bg-red-500/10 text-red-400 border-red-500/20">FINALIZADA</Badge>
                  <span className="text-[10px] text-gray-500">16 Enero - 17:18</span>
                  <div className="flex gap-1.5">
                    <MoneyChip amountText="2.80€" />
                    <Button size="icon" className="h-7 w-7 bg-red-600 opacity-50"><X className="w-4 h-4" /></Button>
                  </div>
                </div>
                <MarcoContent 
                  name="Iván" 
                  photoUrl={avatarFor('Iván')} 
                  carLabel="Toyota Yaris" 
                  plate="4444 XYZ" 
                  carColor="blanco" 
                  statusText="EXPIRADA" 
                  address="Calle Campoamor, n15, Oviedo" 
                  bright={false}
                />
             </div>
          </TabsContent>
        </Tabs>
      </main>
      <BottomNav activeTab="history" />
    </div>
  );
}