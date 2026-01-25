import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Car, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import ParkingMap from '@/components/map/ParkingMap';
import UserAlertCard from '@/components/cards/UserAlertCard';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import MapFilters from '@/components/map/MapFilters';
import BottomNav from '@/components/BottomNav';
import NotificationManager from '@/components/NotificationManager';
import Header from '@/components/Header';

// --- UTILIDADES ---
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildDemoAlerts(centerLat, centerLng) {
  const offsets = [[0.0009, 0.0006], [-0.0007, 0.0008], [0.0011, -0.0005], [-0.0010, -0.0007], [0.0004, -0.0011], [-0.0004, 0.0012]];
  const base = [
    { id: 'demo_1', user_name: 'Sofía', user_photo: 'https://randomuser.me/api/portraits/women/44.jpg', car_brand: 'SEAT', car_model: 'Ibiza', car_color: 'blanco', car_plate: '1234 KLM', vehicle_type: 'car', price: 3, available_in_minutes: 6, address: 'Calle Uría' },
    { id: 'demo_2', user_name: 'Marco', user_photo: 'https://randomuser.me/api/portraits/men/32.jpg', car_brand: 'VW', car_model: 'Golf', car_color: 'negro', car_plate: '5678 HJP', vehicle_type: 'car', price: 5, available_in_minutes: 10, address: 'Fray Ceferino' },
    { id: 'demo_3', user_name: 'Nerea', car_brand: 'Toyota', car_model: 'RAV4', price: 7, available_in_minutes: 14, address: 'Campoamor' }
  ];
  return base.map((a, i) => ({
    ...a,
    latitude: centerLat + (offsets[i]?.[0] || 0),
    longitude: centerLng + (offsets[i]?.[1] || 0),
    is_demo: true
  }));
}

export default function Home() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState(null);
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState([43.3619, -5.8494]); // Oviedo default
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ maxPrice: 7, maxMinutes: 25, maxDistance: 2 });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, alert: null });

  // 1. CARGA DE USUARIO (Optimizado)
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  // 2. GEOLOCALIZACIÓN (Memoizada para evitar re-renders infinitos)
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        if (!selectedPosition) setSelectedPosition({ lat: coords[0], lng: coords[1] });
      },
      null,
      { enableHighAccuracy: true }
    );
  }, [selectedPosition]);

  useEffect(() => { getCurrentLocation(); }, [getCurrentLocation]);

  // 3. QUERIES (TanStack Query para velocidad y caché)
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread', user?.email],
    queryFn: async () => (await base44.entities.ChatMessage.filter({ receiver_id: user?.email, read: false })).length,
    enabled: !!user?.email,
    refetchInterval: 10000
  });

  const { data: rawAlerts = [] } = useQuery({
    queryKey: ['parkingAlerts'],
    queryFn: () => base44.entities.ParkingAlert.filter({ status: 'active' }),
    enabled: mode === 'search',
    refetchInterval: 10000
  });

  // 4. LÓGICA DE FILTRADO Y DEMO
  const searchAlerts = useMemo(() => {
    let list = Array.isArray(rawAlerts) ? rawAlerts : [];
    const filtered = list.filter(a => {
      const dist = calculateDistance(userLocation[0], userLocation[1], a.latitude, a.longitude);
      return dist <= filters.maxDistance && a.price <= filters.maxPrice;
    });
    return filtered.length > 0 ? filtered : buildDemoAlerts(userLocation[0], userLocation[1]);
  }, [rawAlerts, userLocation, filters]);

  // 5. MUTACIONES (Acciones de botones)
  const buyAlertMutation = useMutation({
    mutationFn: async (alert) => {
      const currentUser = await base44.auth.me();
      await base44.entities.Transaction.create({
        alert_id: alert.id,
        buyer_id: currentUser?.email,
        seller_id: alert.user_email,
        amount: alert.price,
        status: 'pending'
      });
      return base44.entities.ChatMessage.create({
        alert_id: alert.id,
        sender_id: currentUser?.email,
        receiver_id: alert.user_email,
        message: `¡Hola! Me interesa tu plaza (${alert.price}€).`,
        read: false
      });
    },
    onSuccess: () => {
      setConfirmDialog({ open: false, alert: null });
      alert("Solicitud enviada con éxito");
    }
  });

  const createAlertMutation = useMutation({
    mutationFn: async (data) => {
      const currentUser = await base44.auth.me();
      return base44.entities.ParkingAlert.create({
        ...data,
        status: 'active',
        user_email: currentUser?.email,
        user_name: currentUser?.name || 'Usuario'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parkingAlerts']);
      setMode(null);
    }
  });

  // 6. HANDLERS
  const handleBuyRequest = (alert) => {
    if (alert.is_demo) return alert("Esto es una demo");
    setConfirmDialog({ open: true, alert });
  };

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col overflow-hidden">
      <NotificationManager user={user} />
      
      <Header 
        title="WaitMe!" 
        unreadCount={unreadCount} 
        showBackButton={!!mode} 
        onBack={() => setMode(null)} 
      />

      <main className="flex-1 relative flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {/* VISTA HOME */}
          {!mode && (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center px-6 space-y-8 relative"
            >
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <ParkingMap alerts={buildDemoAlerts(userLocation[0], userLocation[1])} userLocation={userLocation} zoomControl={false} />
              </div>
              
              <div className="relative z-10 flex flex-col items-center">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png" className="w-56 h-56 object-contain" alt="Logo" />
                <h1 className="text-2xl font-bold -mt-4">Aparca donde te <span className="text-purple-500">avisen!</span></h1>
              </div>

              <div className="w-full max-w-sm space-y-4 relative z-10">
                <Button onClick={() => setMode('search')} className="w-full h-24 bg-gray-900 border-gray-700 text-xl rounded-3xl flex gap-4">
                  <MapPin className="w-10 h-10 text-purple-500" /> ¿Dónde quieres aparcar?
                </Button>
                <Button onClick={() => setMode('create')} className="w-full h-24 bg-purple-600 hover:bg-purple-700 text-xl rounded-3xl flex gap-4">
                  <Car className="w-10 h-10" /> ¡Estoy aparcado aquí!
                </Button>
              </div>
            </motion.div>
          )}

          {/* VISTA BUSCAR (CENTRADO VERTICAL, SIN SCROLL) */}
          {mode === 'search' && (
            <motion.div 
              key="search"
              initial={{ x: 100 }} animate={{ x: 0 }} exit={{ x: -100 }}
              className="flex-1 flex flex-col p-4 gap-4"
            >
              <div className="flex-1 bg-gray-900 rounded-3xl overflow-hidden relative shadow-2xl border border-white/5">
                <ParkingMap 
                  alerts={searchAlerts} 
                  onAlertClick={setSelectedAlert} 
                  userLocation={userLocation} 
                  selectedAlert={selectedAlert}
                />
                <Button 
                  onClick={() => setShowFilters(true)}
                  className="absolute top-4 right-4 z-[10] bg-black/50 backdrop-blur-md border border-purple-500/50"
                  size="icon"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </Button>
                <AnimatePresence>
                  {showFilters && (
                    <MapFilters filters={filters} onFilterChange={setFilters} onClose={() => setShowFilters(false)} alertsCount={searchAlerts.length} />
                  )}
                </AnimatePresence>
              </div>

              <div className="h-[40%] flex flex-col gap-3">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-purple-500" />
                  <input className="w-full bg-gray-900 border border-gray-800 p-3 pl-10 rounded-2xl" placeholder="Buscar zona..." />
                </div>
                <div className="flex-1 min-h-0">
                  <UserAlertCard 
                    alert={selectedAlert} 
                    isEmpty={!selectedAlert} 
                    onBuyAlert={handleBuyRequest}
                    onChat={(a) => window.location.href = createPageUrl(`Chat?alertId=${a.id}`)}
                    userLocation={userLocation}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* VISTA CREAR */}
          {mode === 'create' && (
            <motion.div 
              key="create"
              initial={{ x: 100 }} animate={{ x: 0 }} exit={{ x: -100 }}
              className="flex-1 flex flex-col p-4 gap-4"
            >
              <div className="flex-1 bg-gray-900 rounded-3xl overflow-hidden border border-white/5">
                <ParkingMap 
                  isSelecting={true} 
                  selectedPosition={selectedPosition} 
                  setSelectedPosition={setSelectedPosition} 
                  userLocation={userLocation} 
                />
              </div>
              <div className="bg-gray-900/50 p-4 rounded-3xl">
                <CreateAlertCard 
                  address={address} 
                  onAddressChange={setAddress} 
                  onUseCurrentLocation={getCurrentLocation}
                  onCreateAlert={(data) => createAlertMutation.mutate({ ...data, ...selectedPosition })}
                  isLoading={createAlertMutation.isPending}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />

      {/* DIALOGO CONFIRMACIÓN */}
      <Dialog open={confirmDialog.open} onOpenChange={(o) => setConfirmDialog({ ...confirmDialog, open: o })}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle>Confirmar Reserva</DialogTitle>
            <DialogDescription className="text-gray-400">
              Vas a pagar {confirmDialog.alert?.price}€ por la plaza de {confirmDialog.alert?.user_name}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="ghost" onClick={() => setConfirmDialog({ open: false, alert: null })}>Cancelar</Button>
            <Button className="bg-purple-600 flex-1" onClick={() => buyAlertMutation.mutate(confirmDialog.alert)}>
              {buyAlertMutation.isPending ? "Procesando..." : "Confirmar Pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}