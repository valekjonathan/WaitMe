import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Car, SlidersHorizontal, Clock, Navigation, MessageCircle, CreditCard, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import ParkingMap from '@/components/map/ParkingMap';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import MapFilters from '@/components/map/MapFilters';
import BottomNav from '@/components/BottomNav';
import NotificationManager from '@/components/NotificationManager';
import Header from '@/components/Header';

// --- MINI COMPONENTE INTERNO (Para que no falle por rutas externas) ---
const LocalUserCard = ({ alert, userLocation, onBuy, onChat }) => {
  if (!alert) return (
    <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-gray-900/40 rounded-3xl border border-dashed border-gray-800 p-4">
      <Car className="w-8 h-8 opacity-20 mb-2" />
      <p className="text-xs">Selecciona un coche en el mapa</p>
    </div>
  );

  const dist = () => {
    if (!userLocation || !alert.latitude) return "Distancia...";
    const R = 6371;
    const dLat = (alert.latitude - userLocation[0]) * Math.PI / 180;
    const dLon = (alert.longitude - userLocation[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(userLocation[0]*Math.PI/180)*Math.cos(alert.latitude*Math.PI/180)*Math.sin(dLon/2)**2;
    const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return d < 1 ? `${Math.round(d*1000)}m` : `${d.toFixed(1)}km`;
  };

  return (
    <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="h-full bg-gray-900 border border-white/10 rounded-3xl flex flex-col overflow-hidden">
      <div className="p-3 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <img src={alert.user_photo || `https://ui-avatars.com/api/?name=${alert.user_name || 'U'}&background=8b5cf6&color=fff`} className="w-10 h-10 rounded-xl object-cover" />
          <div>
            <h4 className="font-bold text-sm">{alert.user_name || 'Usuario'}</h4>
            <div className="flex items-center gap-1 text-[10px] text-yellow-500"><Star className="w-2 h-2 fill-current"/> 4.9</div>
          </div>
        </div>
        <span className="text-xl font-black text-purple-400">{alert.price || 0}€</span>
      </div>
      <div className="flex-1 p-3 grid grid-cols-2 gap-2 text-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-purple-400"/> {alert.available_in_minutes || '?'} min</div>
          <div className="flex items-center gap-1"><Navigation className="w-3 h-3 text-blue-400"/> {dist()}</div>
        </div>
        <div className="bg-black/40 p-2 rounded-xl border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase">Vehículo</p>
          <p className="font-bold truncate">{alert.car_brand} {alert.car_model}</p>
        </div>
      </div>
      <div className="p-3 pt-0 flex gap-2">
        <Button onClick={() => onChat(alert)} variant="outline" className="w-12 h-12 rounded-xl border-gray-700"><MessageCircle className="w-5 h-5"/></Button>
        <Button onClick={() => onBuy(alert)} className="flex-1 h-12 rounded-xl bg-purple-600 font-bold">RESERVAR</Button>
      </div>
    </motion.div>
  );
};

export default function Home() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState(null);
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState([43.3619, -5.8494]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ maxPrice: 10, maxMinutes: 30, maxDistance: 5 });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, alert: null });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(p => {
        const coords = [p.coords.latitude, p.coords.longitude];
        setUserLocation(coords);
        setSelectedPosition({ lat: coords[0], lng: coords[1] });
      });
    }
  }, []);

  const { data: rawAlerts = [] } = useQuery({
    queryKey: ['parkingAlerts'],
    queryFn: () => base44.entities.ParkingAlert.filter({ status: 'active' }),
    enabled: mode === 'search',
  });

  const searchAlerts = useMemo(() => {
    const list = Array.isArray(rawAlerts) ? rawAlerts : [];
    return list.length > 0 ? list : []; 
  }, [rawAlerts]);

  const buyAlertMutation = useMutation({
    mutationFn: async (alert) => {
      // Lógica de compra
    },
    onSuccess: () => setConfirmDialog({ open: false, alert: null })
  });

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col overflow-hidden">
      <Header title="WaitMe!" showBackButton={!!mode} onBack={() => setMode(null)} />

      <main className="flex-1 relative overflow-hidden flex flex-col">
        {!mode ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png" className="w-48 h-48 object-contain" />
            <div className="w-full max-w-xs space-y-4">
              <Button onClick={() => setMode('search')} className="w-full h-20 bg-gray-900 border-gray-800 rounded-3xl text-lg flex gap-3">
                <MapPin className="text-purple-500" /> ¿Dónde aparcar?
              </Button>
              <Button onClick={() => setMode('create')} className="w-full h-20 bg-purple-600 rounded-3xl text-lg flex gap-3">
                <Car /> ¡Estoy aquí!
              </Button>
            </div>
          </div>
        ) : mode === 'search' ? (
          <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
            <div className="flex-[1.2] bg-gray-900 rounded-3xl overflow-hidden relative border border-white/5">
              <ParkingMap alerts={searchAlerts} onAlertClick={setSelectedAlert} userLocation={userLocation} />
              <Button onClick={() => setShowFilters(true)} className="absolute top-2 right-2 bg-black/50" size="icon"><SlidersHorizontal className="w-4 h-4" /></Button>
            </div>
            <div className="flex-1 min-h-0">
              <LocalUserCard 
                alert={selectedAlert} 
                userLocation={userLocation} 
                onChat={(a) => window.location.href = createPageUrl(`Chat?alertId=${a.id}`)}
                onBuy={(a) => setConfirmDialog({ open: true, alert: a })}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-4 gap-4">
             <div className="flex-1 bg-gray-900 rounded-3xl overflow-hidden border border-white/5">
                <ParkingMap isSelecting={true} selectedPosition={selectedPosition} setSelectedPosition={setSelectedPosition} userLocation={userLocation} />
             </div>
             <CreateAlertCard onCreateAlert={(d) => console.log(d)} />
          </div>
        )}
      </main>

      <BottomNav />

      <Dialog open={confirmDialog.open} onOpenChange={(o) => setConfirmDialog(p => ({...p, open: o}))}>
        <DialogContent className="bg-gray-900 text-white border-gray-800">
          <DialogHeader><DialogTitle>Confirmar</DialogTitle></DialogHeader>
          <Button onClick={() => buyAlertMutation.mutate(confirmDialog.alert)} className="bg-purple-600">Confirmar Reserva</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}