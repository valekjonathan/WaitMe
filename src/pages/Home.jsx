import React, { useState, useEffect } from 'react';
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

// TUS NUEVOS COMPONENTES
import { SearchAlertCard } from '@/components/cards/SearchAlertCard';
import { ActiveAlertCard } from '@/components/cards/ActiveAlertCard';

export default function Home() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialMode = urlParams.get('mode');

  const [mode, setMode] = useState(initialMode || null); 

  useEffect(() => {
    const checkReset = () => {
      const params = new URLSearchParams(window.location.search);
      if (!params.has('mode')) {
        setMode(null);
      }
    };
    checkReset();
  }, [window.location.search]);

  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, alert: null });
  const [user, setUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxPrice: 7,
    maxMinutes: 25,
    maxDistance: 1
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Usuario no autenticado');
      }
    };
    fetchUser();
  }, []);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadMessages', user?.email],
    queryFn: async () => {
      const messages = await base44.entities.ChatMessage.filter({ receiver_id: user?.email, read: false });
      return messages.length;
    },
    enabled: !!user?.email,
    refetchInterval: 5000
  });

  const { data: rawAlerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ['parkingAlerts'],
    queryFn: () => base44.entities.ParkingAlert.filter({ status: 'active' }),
    refetchInterval: mode === 'search' ? 5000 : false,
    enabled: mode === 'search'
  });

  const alerts = rawAlerts.filter((alert) => {
    if (alert.price > filters.maxPrice) return false;
    if (alert.available_in_minutes > filters.maxMinutes) return false;
    if (userLocation) {
      const distance = calculateDistance(userLocation[0], userLocation[1], alert.latitude, alert.longitude);
      if (distance > filters.maxDistance) return false;
    }
    return true;
  });

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const createAlertMutation = useMutation({
    mutationFn: async (alertData) => {
      const minutes = Number(alertData.minutes) || 0;
      const waitUntilIso = minutes > 0 ? new Date(Date.now() + minutes * 60000).toISOString() : null;
      return await base44.entities.ParkingAlert.create({
        user_id: user?.id,
        user_email: user?.email,
        user_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Usuario',
        user_photo: user?.photo_url,
        car_brand: user?.car_brand || 'Sin especificar',
        car_model: user?.car_model || '',
        car_color: user?.car_color || 'gris',
        car_plate: user?.car_plate || '',
        vehicle_type: user?.vehicle_type || 'car',
        latitude: selectedPosition?.lat || userLocation?.[0] || 40.4168,
        longitude: selectedPosition?.lng || userLocation?.[1] || -3.7038,
        address: address,
        price: alertData.price,
        available_in_minutes: minutes,
        ...(waitUntilIso ? { wait_until: waitUntilIso, expires_at: waitUntilIso } : {}),
        allow_phone_calls: user?.allow_phone_calls || false,
        phone: user?.phone,
        status: 'active'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkingAlerts'] });
      setMode(null);
      setSelectedPosition(null);
      setAddress('');
    }
  });

  const buyAlertMutation = useMutation({
    mutationFn: async (alert) => {
      await base44.entities.Notification.create({
        type: 'reservation_request',
        recipient_id: alert.user_id,
        recipient_email: alert.user_email || alert.created_by,
        sender_id: user?.id,
        sender_name: user?.display_name || user?.full_name?.split(' ')[0],
        sender_photo: user?.photo_url,
        alert_id: alert.id,
        amount: alert.price,
        status: 'pending'
      });
      return alert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkingAlerts'] });
      setConfirmDialog({ open: false, alert: null });
      setSelectedAlert(null);
    }
  });

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setSelectedPosition({ lat: latitude, lng: longitude });
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.address) {
              const road = data.address.road || data.address.street || '';
              const number = data.address.house_number || '';
              setAddress(number ? `${road}, ${number}` : road);
            }
          });
      });
    }
  };

  useEffect(() => { getCurrentLocation(); }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <NotificationManager user={user} />
      <Header 
        title="WaitMe!" 
        unreadCount={unreadCount} 
        showBackButton={!!mode} 
        onBack={() => { setMode(null); setSelectedAlert(null); }} 
      />

      <main className="fixed inset-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!mode && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center pt-20 px-6 pb-32">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png" className="w-40 h-40 object-contain mb-4" />
              <h1 className="text-xl font-bold mb-8">Aparca donde te <span className="text-purple-500">avisen!</span></h1>
              
              <div className="w-full max-w-sm space-y-4 mb-8">
                <Button onClick={() => setMode('search')} className="w-full h-16 bg-gray-900 border border-gray-700 rounded-2xl flex items-center justify-center gap-4 text-lg">
                  🔍 ¿Dónde quieres aparcar?
                </Button>
                <Button onClick={() => setMode('create')} className="w-full h-16 bg-purple-600 rounded-2xl flex items-center justify-center gap-4 text-lg">
                  <Car className="w-6 h-6" /> ¡Estoy aparcado aquí!
                </Button>
              </div>

              {/* TUS NUEVAS TARJETAS VISIBLES SIEMPRE */}
              <div className="w-full max-w-sm space-y-4 border-t border-gray-800 pt-8">
                <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Tus Alertas</h2>
                <SearchAlertCard />
                <ActiveAlertCard />
              </div>
            </motion.div>
          )}

          {mode === 'search' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-[60px] h-full flex flex-col">
              <div className="h-64 relative px-3 pt-2">
                <ParkingMap alerts={alerts} onAlertClick={setSelectedAlert} userLocation={userLocation} selectedAlert={selectedAlert} zoomControl={true} className="h-full rounded-2xl" />
              </div>
              <div className="p-4 flex-1">
                <UserAlertCard alert={selectedAlert} isEmpty={!selectedAlert} onBuyAlert={(a) => setConfirmDialog({open:true, alert:a})} onChat={(a) => window.location.href = createPageUrl(`Chat?alertId=${a.id}`)} userLocation={userLocation} />
              </div>
            </motion.div>
          )}

          {mode === 'create' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-[60px] p-4">
               <CreateAlertCard address={address} onAddressChange={setAddress} onUseCurrentLocation={getCurrentLocation} onCreateAlert={(data) => createAlertMutation.mutate(data)} isLoading={createAlertMutation.isPending} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader><DialogTitle>Confirmar reserva</DialogTitle></DialogHeader>
          <div className="py-4">¿Quieres reservar este sitio por {confirmDialog.alert?.price}€?</div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setConfirmDialog({open:false, alert:null})}>Cancelar</Button>
            <Button className="bg-purple-600" onClick={() => buyAlertMutation.mutate(confirmDialog.alert)}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}