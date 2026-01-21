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

// IMPORTACIÓN CORREGIDA
import { SearchAlertCard } from '@/components/cards/SearchAlertCard';
import { ActiveAlertCard } from '@/components/cards/ActiveAlertCard';

export default function Home() {
  const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const initialMode = urlParams.get('mode');
  const [mode, setMode] = useState(initialMode || null);
  const [userLocation, setUserLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [user, setUser] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, alert: null });

  useEffect(() => {
    const fetchUser = async () => {
      try { const currentUser = await base44.auth.me(); setUser(currentUser); } catch (e) {}
    };
    fetchUser();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]));
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <NotificationManager user={user} />
      <Header title="WaitMe!" showBackButton={!!mode} onBack={() => setMode(null)} />

      <main className="fixed inset-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!mode && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center pt-20 px-6 pb-32">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png" className="w-40 h-40 object-contain mb-4" />
              <h1 className="text-xl font-bold mb-8 text-center">Aparca donde te <span className="text-purple-500">avisen!</span></h1>
              
              <div className="w-full max-w-sm space-y-4 mb-8">
                <Button onClick={() => setMode('search')} className="w-full h-16 bg-gray-900 border border-gray-700 rounded-2xl flex items-center justify-center gap-4 text-lg">🔍 ¿Dónde quieres aparcar?</Button>
                <Button onClick={() => setMode('create')} className="w-full h-16 bg-purple-600 rounded-2xl flex items-center justify-center gap-4 text-lg"><Car className="w-6 h-6" /> ¡Estoy aparcado aquí!</Button>
              </div>

              <div className="w-full max-w-sm space-y-4 border-t border-gray-800 pt-8">
                <h2 className="text-gray-400 text-sm font-medium uppercase mb-2">Tus Alertas</h2>
                <SearchAlertCard />
                <ActiveAlertCard />
              </div>
            </motion.div>
          )}

          {mode === 'search' && (
            <div className="pt-[60px] p-4 text-center">Modo Búsqueda Activo (Mapa cargando...)</div>
          )}
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}