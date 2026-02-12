import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, SlidersHorizontal } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ParkingMap from '@/components/map/ParkingMap';
import MapFilters from '@/components/map/MapFilters';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import UserAlertCard from '@/components/cards/UserAlertCard';
import NotificationManager from '@/components/NotificationManager';
import { isDemoMode, startDemoFlow, subscribeDemoFlow, getDemoAlerts } from '@/components/DemoFlowManager';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const CarIconProfile = ({ color, size = "w-16 h-10" }) =>
  <svg viewBox="0 0 48 24" className={size} fill="none">
    <path
      d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
      fill={color}
      stroke="white"
      strokeWidth="1.5" />
    <path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="0.5" />
    <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
    <circle cx="14" cy="18" r="2" fill="#666" />
    <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
    <circle cx="36" cy="18" r="2" fill="#666" />
  </svg>;

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState('home');
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showAlertDialog, setShowAlertDialog] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const { data } = await base44.from('profiles').select('*').single();
        return data ?? null;
      } catch {
        return null;
      }
    }
  });

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      try {
        const { data } = await base44.from('alerts').select('*');
        return data ?? [];
      } catch {
        return [];
      }
    }
  });

  useEffect(() => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      },
      () => {
        setUserLocation({ latitude: 43.3619, longitude: -5.8494 });
      }
    );
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <div className="pb-24">

        {mode === 'home' && (
          <div className="px-0">

            <div className="relative overflow-hidden rounded-b-[28px] bg-gradient-to-b from-[#1b0f24] to-black border-b border-white/10">

              <div className="relative z-10 px-6 pt-6 pb-6 flex flex-col items-center">

                {/* ===== LOGO CORREGIDO (ÚNICO CAMBIO) ===== */}
                <div className="w-[212px] h-[160px] overflow-hidden flex items-start justify-center">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png"
                    alt="WaitMe!"
                    className="w-[212px] object-contain object-top"
                  />
                </div>

                <h1 className="text-4xl font-bold leading-none -mt-6 whitespace-nowrap">
                  Wait<span className="text-purple-500">Me!</span>
                </h1>

                <p className="text-xl font-bold mt-[3px] whitespace-nowrap">
                  Aparca donde te <span className="text-purple-500">avisen!</span>
                </p>
              </div>

              <div className="w-full max-w-sm mx-auto space-y-4 relative z-10 px-6 pb-8">

                <Button
                  onClick={() => setMode('search')}
                  className="w-full h-14 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white flex items-center justify-center gap-3"
                >
                  <MapPin className="w-6 h-6 text-purple-400" />
                  ¿Dónde quieres aparcar?
                </Button>

                <Button
                  onClick={() => setMode('create')}
                  className="w-full h-16 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-lg font-bold flex items-center justify-center gap-3"
                >
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 border border-white/10">
                    <CarIconProfile color="#ffffff" size="w-8 h-5" />
                  </span>
                  ¡Estoy aparcado aquí!
                </Button>

              </div>
            </div>

            <div className="px-4 pt-5">
              <h2 className="text-lg font-bold mb-3">Alertas cerca</h2>

              {isLoading ? (
                <div className="text-white/70 text-sm py-8 text-center">Cargando alertas...</div>
              ) : (
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <UserAlertCard
                      key={alert.id}
                      alert={alert}
                      userLocation={userLocation}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      <BottomNav />
    </div>
  );
}