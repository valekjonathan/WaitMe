import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Car, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import ParkingMap from '@/components/map/ParkingMap';
import UserAlertCard from '@/components/cards/UserAlertCard';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import MapFilters from '@/components/map/MapFilters';
import BottomNav from '@/components/BottomNav';
import NotificationManager from '@/components/NotificationManager';
import Header from '@/components/Header';

/* DEMO ALERTS */
function buildDemoAlerts(lat, lng) {
  const offsets = [
    [0.0009, 0.0006], [-0.0007, 0.0008], [0.0011, -0.0005],
    [-0.0010, -0.0007], [0.0004, -0.0011], [-0.0004, 0.0012]
  ];

  return offsets.map((o, i) => ({
    id: `demo_${i}`,
    user_name: ['Sofía','Marco','Nerea','David','Lucía','Álvaro'][i],
    user_photo: i % 2 ? 'https://randomuser.me/api/portraits/men/32.jpg' : 'https://randomuser.me/api/portraits/women/44.jpg',
    car_brand: 'Demo',
    car_model: 'Demo',
    price: 3 + i,
    available_in_minutes: 5 + i * 2,
    latitude: lat + o[0],
    longitude: lng + o[1],
    is_demo: true
  }));
}

export default function Home() {
  const [mode, setMode] = useState(null); // null | search | create
  const [userLocation, setUserLocation] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  /* RESET INSTANTÁNEO */
  useEffect(() => {
    const reset = () => {
      setMode(null);
      setSelectedAlert(null);
      setSelectedPosition(null);
      setAddress('');
      setShowFilters(false);
    };
    window.addEventListener('RESET_HOME', reset);
    return () => window.removeEventListener('RESET_HOME', reset);
  }, []);

  /* GEO */
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(pos => {
      setUserLocation([pos.coords.latitude, pos.coords.longitude]);
    });
  }, []);

  const demoAlerts = useMemo(() => {
    const lat = userLocation?.[0] ?? 43.3619;
    const lng = userLocation?.[1] ?? -5.8494;
    return buildDemoAlerts(lat, lng);
  }, [userLocation]);

  return (
    <div className="min-h-screen bg-black text-white">
      <NotificationManager />

      <Header
        title="WaitMe!"
        showBackButton={!!mode}
        onBack={() => setMode(null)}
      />

      {/* MAPA DE FONDO — SIEMPRE MONTADO */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <ParkingMap
          alerts={demoAlerts}
          userLocation={userLocation}
          zoomControl={false}
        />
      </div>

      <div className="fixed inset-0 bg-purple-900/40 pointer-events-none" />

      {/* HOME */}
      {!mode && (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-10">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png"
            className="w-48 h-48"
          />
          <div className="w-full max-w-sm px-6 space-y-4">
            <Button onClick={() => setMode('search')} className="h-20 bg-gray-900 rounded-2xl">
              ¿ Dónde quieres aparcar ?
            </Button>
            <Button onClick={() => setMode('create')} className="h-20 bg-purple-600 rounded-2xl">
              ¡ Estoy aparcado aquí !
            </Button>
          </div>
        </div>
      )}

      {/* SEARCH */}
      {mode === 'search' && (
        <div className="fixed inset-0 top-[60px] bottom-[88px] z-10">
          {/* tu search igual que antes */}
        </div>
      )}

      {/* CREATE */}
      {mode === 'create' && (
        <div className="fixed inset-0 top-[60px] bottom-[88px] z-10">
          {/* tu create igual que antes */}
        </div>
      )}

      <BottomNav />
    </div>
  );
}