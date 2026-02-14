import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, SlidersHorizontal } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ParkingMap from '@/components/map/ParkingMap';
import MapFilters from '@/components/map/MapFilters';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import UserAlertCard from '@/components/cards/UserAlertCard';
import NotificationManager from '@/components/NotificationManager';
import {
  isDemoMode,
  startDemoFlow,
  subscribeDemoFlow
} from '@/components/DemoFlowManager';
import appLogo from '@/assets/d2ae993d3_WaitMe.png';

// ======================
// Helpers
// ======================
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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

const MagnifierIconProfile = ({ color = '#8b5cf6', size = 'w-14 h-14' }) => (
  <svg viewBox="0 0 48 48" className={size} fill="none">
    <circle cx="20" cy="20" r="12" fill={color} stroke="white" strokeWidth="1.5" />
    <path
      d="M15 16 C16 13, 18 12, 21 12"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path d="M28 28 L38 38" stroke="white" strokeWidth="4" strokeLinecap="round" />
    <path
      d="M36.8 36.8 L40.8 40.8"
      stroke="white"
      strokeWidth="6"
      strokeLinecap="round"
      opacity="0.9"
    />
  </svg>
);

export default function Home() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState(null);
  const [demoTick, setDemoTick] = useState(0);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, alert: null });

  const [filters, setFilters] = useState({
    maxPrice: 10,
    maxMinutes: 30,
    maxDistance: 10
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: rawAlerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => []
  });

  const { data: myActiveAlerts = [] } = useQuery({
    queryKey: ['myActiveAlerts', user?.id],
    enabled: !!user?.id,
    queryFn: async () => []
  });

  useEffect(() => {
    if (!isDemoMode()) return;
    startDemoFlow();
    const unsub = subscribeDemoFlow(() =>
      setDemoTick((t) => t + 1)
    );
    return () => unsub?.();
  }, []);

  const filteredAlerts = useMemo(() => {
    const [uLat, uLng] = userLocation || [];
    return rawAlerts.filter((a) => {
      if (!a) return false;

      if (Number(a.price) > filters.maxPrice) return false;
      if (Number(a.available_in_minutes) > filters.maxMinutes) return false;

      if (uLat && uLng && a.latitude && a.longitude) {
        const km = calculateDistance(uLat, uLng, a.latitude, a.longitude);
        if (km > filters.maxDistance) return false;
      }
      return true;
    });
  }, [rawAlerts, filters, userLocation]);

  const searchAlerts = mode === 'search' ? filteredAlerts : [];

  const handleSearchInputChange = async (e) => {
    const val = e.target.value;
    setSearchInput(val);

    if (val.length < 3) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          val
        )}&countrycodes=es&limit=5`
      );
      const data = await res.json();
      setSuggestions(data || []);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (s) => {
    setSearchInput(s.display_name);
    setShowSuggestions(false);
    setUserLocation([parseFloat(s.lat), parseFloat(s.lon)]);
  };

  return (
    <div className="min-h-screen w-full bg-black text-white">
      <NotificationManager user={user} />

      <Header
        iconVariant="bottom"
        title="WaitMe!"
        showBackButton={!!mode}
        onBack={() => {
          setMode(null);
          setSelectedAlert(null);
        }}
      />

      <main className="fixed inset-0">
        <AnimatePresence mode="wait">
          {!mode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <img
                src={appLogo}
                alt="WaitMe!"
                className="w-[212px] h-[212px] object-contain"
              />

              <h1 className="text-4xl font-bold mt-[-65px]">
                Wait<span className="text-purple-500">Me!</span>
              </h1>

              <p className="text-xl font-bold mt-1">
                Aparca donde te <span className="text-purple-500">avisen!</span>
              </p>

              <div className="w-full max-w-sm space-y-4 mt-6 px-6">
                <Button
                  onClick={() => setMode('search')}
                  className="w-full h-20 bg-gray-900 rounded-2xl flex items-center justify-center gap-4"
                >
                  <MagnifierIconProfile />
                  ¿ Dónde quieres aparcar ?
                </Button>

                <Button
                  onClick={() => setMode('create')}
                  className="w-full h-20 bg-purple-600 rounded-2xl flex items-center justify-center gap-4"
                >
                  <CarIconProfile color="#8b5cf6" />
                  ¡ Estoy aparcado aquí !
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}