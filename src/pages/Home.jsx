import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import * as alerts from '@/data/alerts';
import * as chat from '@/data/chat';
import * as notifications from '@/data/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as transactions from '@/data/transactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, MapPin, Clock, Euro, X } from 'lucide-react';
import { useLayoutHeader } from '@/lib/LayoutContext';
import ParkingMap from '@/components/map/ParkingMap';
import MapboxMap from '@/components/MapboxMap';
import MapFilters from '@/components/map/MapFilters';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import UserAlertCard from '@/components/cards/UserAlertCard';
import { getVisibleActiveSellerAlerts, readHiddenKeys } from '@/lib/alertSelectors';
import { useAuth } from '@/lib/AuthContext';
import { useProfileGuard } from '@/hooks/useProfileGuard';
import { useMyAlerts } from '@/hooks/useMyAlerts';
import { alertsKey, alertsPrefix } from '@/lib/alertsQueryKey';
import appLogo from '@/assets/d2ae993d3_WaitMe.png';

// Preload logo eagerly so it's always instant on first render
if (typeof window !== 'undefined') {
  try {
    const _preload = new window.Image();
    _preload.src = appLogo;
  } catch {}
}
import { getMockNearbyAlerts } from '@/lib/mockNearby';
import { haversineKm } from '@/utils/carUtils';

// ======================
// Helpers
// ======================
const FALLBACK_LAT = 43.3623; // Oviedo
const FALLBACK_LNG = -5.8489; // Oviedo


const CarIconProfile = ({ color, size = "w-16 h-10" }) =>
  <svg viewBox="0 0 48 24" className={size} fill="none">
    {/* Cuerpo del coche - vista lateral */}
    <path
      d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
      fill={color}
      stroke="white"
      strokeWidth="1.5" />

    {/* Ventanas */}
    <path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="0.5" />
    {/* Rueda trasera */}
    <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
    <circle cx="14" cy="18" r="2" fill="#666" />
    {/* Rueda delantera */}
    <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
    <circle cx="36" cy="18" r="2" fill="#666" />
  </svg>;

const MagnifierIconProfile = ({ color = "#8b5cf6", size = "w-14 h-14" }) => (
  <svg viewBox="0 0 48 48" className={size} fill="none">
    {/* Lente */}
    <circle cx="20" cy="20" r="12" fill={color} stroke="white" strokeWidth="1.5" />
    {/* Brillo */}
    <path d="M15 16 C16 13, 18 12, 21 12" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" />
    {/* Mango */}
    <path d="M28 28 L38 38" stroke="white" strokeWidth="4" strokeLinecap="round" />
    {/* Tope mango */}
    <path d="M36.8 36.8 L40.8 40.8" stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
  </svg>
);

export default function Home() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const setHeader = useLayoutHeader();
  const [mode, setMode] = useState(null);
  // null | 'search' | 'create'

  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  const [pendingPublishPayload, setPendingPublishPayload] = useState(null);
  const [oneActiveAlertOpen, setOneActiveAlertOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, alert: null });

  const [filters, setFilters] = useState({
    maxPrice: 10,
    maxMinutes: 30,
    maxDistance: 10
  });

  const [headerHeight, setHeaderHeight] = useState(60);
  const [navHeight, setNavHeight] = useState(72);

  useEffect(() => {
    const measure = () => {
      const headerEl = document.querySelector('[data-waitme-header]');
      const navEl = document.querySelector('[data-waitme-nav]');
      if (headerEl) setHeaderHeight(headerEl.offsetHeight);
      if (navEl) setNavHeight(navEl.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    const headerEl = document.querySelector('[data-waitme-header]');
    const navEl = document.querySelector('[data-waitme-nav]');
    if (headerEl) ro.observe(headerEl);
    if (navEl) ro.observe(navEl);
    return () => ro.disconnect();
  }, []);

  const locationKey = useMemo(() => {
    if (!userLocation) return null;
    const lat = Array.isArray(userLocation) ? userLocation[0] : userLocation?.latitude ?? userLocation?.lat;
    const lng = Array.isArray(userLocation) ? userLocation[1] : userLocation?.longitude ?? userLocation?.lng;
    if (lat == null || lng == null) return null;
    return `${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}`;
  }, [userLocation]);

  // BLINDADO: resetea SIEMPRE al logo (los 2 botones grandes), sin tocar la UI del logo.
  const resetToLogo = useCallback((opts = { invalidate: true }) => {
    setMode(null);
    setSelectedAlert(null);
    setShowFilters(false);
    setConfirmDialog({ open: false, alert: null });
    setSearchQuery('');
    if (opts?.invalidate) queryClient.invalidateQueries();
  }, [queryClient]);

  // Botón "Mapa": escucha el evento global y vuelve al logo SIEMPRE.
  useEffect(() => {
    const goLogo = () => resetToLogo({ invalidate: true });
    window.addEventListener('waitme:goLogo', goLogo);
    return () => window.removeEventListener('waitme:goLogo', goLogo);
  }, [resetToLogo]);

  const { user, profile } = useAuth();
  const { guard } = useProfileGuard(profile);

  useEffect(() => {
    if (!user?.id) return;
    const unsub = notifications.subscribeNotifications(user.id, () => {
      queryClient.invalidateQueries({ queryKey: ['unreadCount', user.id] });
    });
    return unsub;
  }, [user?.id, queryClient]);

  const { data: unreadCount } = useQuery({
    queryKey: ['unreadCount', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await notifications.listNotifications(user.id, { unreadOnly: true });
      return data?.length || 0;
    },
    staleTime: 10_000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 15_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const { data: rawAlerts } = useQuery({
    queryKey: alertsKey(mode, locationKey),
    enabled: mode === 'search',
    queryFn: async () => {
      // 10 usuarios cerca (demo local)
      return getMockNearbyAlerts(userLocation);
    },
    staleTime: 15_000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
    placeholderData: (prev) => prev,
  });

  // Una sola fuente de verdad (también alimenta la bolita del BottomNav)
  const { data: myAlerts = [] } = useMyAlerts();

  const myActiveAlerts = useMemo(() => {
    const hiddenKeys = readHiddenKeys();
    const visible = getVisibleActiveSellerAlerts(myAlerts, user?.id, user?.email, hiddenKeys);
    if (import.meta.env.DEV) {
      const total = (myAlerts || []).length;
      const activeReserved = (myAlerts || []).filter((a) =>
        ['active', 'reserved'].includes(String(a?.status || '').toLowerCase())
      ).length;
      const hidden = Array.from(hiddenKeys).filter((k) => k.startsWith('active-')).length;
      console.debug('[alert-check] cache', { total, activeReserved, hidden, visible: visible.length });
    }
    return visible;
  }, [myAlerts, user?.id, user?.email]);

  useEffect(() => {
    if (!user?.id && !user?.email) return;
    queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
  }, [user?.id, user?.email, queryClient]);

  // Reverse geocoding (estable, sin deps cambiantes)
  const reverseGeocode = useCallback((lat, lng) => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=19&addressdetails=1`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.address) {
          const a = data.address;
          const road = a.road || a.pedestrian || a.footway || a.path || a.street || a.cycleway || '';
          const number = a.house_number || '';
          setAddress(number ? `${road}, ${number}` : road || data.display_name?.split(',')[0] || '');
        }
      })
      .catch(() => {});
  }, []);

  // One-shot: usado al pulsar "Estoy aparcado aquí" para refrescar posición al instante
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);
        setSelectedPosition({ lat: latitude, lng: longitude });
        reverseGeocode(latitude, longitude);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  }, [reverseGeocode]);

  // Watcher GPS continuo tipo Uber — arranca al montar, limpia al desmontar
  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation([FALLBACK_LAT, FALLBACK_LNG]);
      setSelectedPosition({ lat: FALLBACK_LAT, lng: FALLBACK_LNG });
      setAddress('Oviedo');
      return;
    }

    // Fix rápido de baja precisión para que el mapa no arranque en blanco
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);
        setSelectedPosition({ lat: latitude, lng: longitude });
        reverseGeocode(latitude, longitude);
      },
      () => {
        setUserLocation([FALLBACK_LAT, FALLBACK_LNG]);
        setSelectedPosition({ lat: FALLBACK_LAT, lng: FALLBACK_LNG });
        setAddress('Oviedo');
      },
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 30 * 1000 }
    );

    // Watcher de alta precisión continuo
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy > 30) return; // ignorar lecturas con precisión peor de 30 m
        setUserLocation([latitude, longitude]);
        setSelectedPosition({ lat: latitude, lng: longitude });
        reverseGeocode(latitude, longitude);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [reverseGeocode]);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('reset')) {
      resetToLogo({ invalidate: false });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location.search, resetToLogo]);

  const filteredAlerts = useMemo(() => {
    const list = Array.isArray(rawAlerts) ? rawAlerts : [];
    const [uLat, uLng] = Array.isArray(userLocation) ? userLocation : [null, null];

    return list.filter((a) => {
      if (!a) return false;

      const price = Number(a.price);
      if (Number.isFinite(price) && price > filters.maxPrice) return false;

      const mins = Number(a.available_in_minutes ?? a.availableInMinutes);
      if (Number.isFinite(mins) && mins > filters.maxMinutes) return false;

      const lat = a.latitude ?? a.lat;
      const lng = a.longitude ?? a.lng;

      if (uLat != null && uLng != null && lat != null && lng != null) {
        const km = haversineKm(uLat, uLng, lat, lng);
        if (Number.isFinite(km) && km > filters.maxDistance) return false;
      }
      return true;
    });
  }, [rawAlerts, filters, userLocation]);

  const searchAlerts = useMemo(() => {
    if (mode !== 'search') return [];
    return filteredAlerts || [];
  }, [mode, filteredAlerts]);

  const homeMapAlerts = useMemo(() => {
    if (mode === 'search') return searchAlerts || [];
    if (mode === null) {
      const base = getMockNearbyAlerts(userLocation);
      const lat0 = Array.isArray(userLocation)
        ? Number(userLocation[0])
        : Number(userLocation?.latitude ?? userLocation?.lat ?? 43.3623);
      const lng0 = Array.isArray(userLocation)
        ? Number(userLocation[1])
        : Number(userLocation?.longitude ?? userLocation?.lng ?? -5.8489);
      // 3 coches extra bien al sur: aparecen en la zona del botón morado en pantalla
      const extra = [
        { id: 'mock_below_1', latitude: lat0 - 0.0032, longitude: lng0 + 0.0005, price: 7,  color: 'azul',   vehicle_type: 'suv',  status: 'active' },
        { id: 'mock_below_2', latitude: lat0 - 0.0040, longitude: lng0 - 0.0014, price: 5,  color: 'rojo',   vehicle_type: 'van',  status: 'active' },
        { id: 'mock_below_3', latitude: lat0 - 0.0048, longitude: lng0 + 0.0020, price: 10, color: 'negro',  vehicle_type: 'car',  status: 'active' },
      ];
      return [...base, ...extra];
    }
    return [];
  }, [mode, searchAlerts, userLocation]);

  const createAlertMutation = useMutation({
  mutationFn: async (data) => {
    // Fast check from cache — same selector as HistorySellerView visibleActiveAlerts
    if (myActiveAlerts && myActiveAlerts.length > 0) {
      throw new Error('ALREADY_HAS_ALERT');
    }

    const uid = user?.id;
    const email = user?.email;

    if (uid || email) {
      const { data: mine = [] } = uid
        ? await alerts.getMyAlerts(uid)
        : { data: [] };

      const hiddenKeys = readHiddenKeys();
      const visibleFresh = getVisibleActiveSellerAlerts(mine, uid, email, hiddenKeys);

      if (import.meta.env.DEV) {
        const total = (mine || []).length;
        const activeReserved = (mine || []).filter((a) =>
          ['active', 'reserved'].includes(String(a?.status || '').toLowerCase())
        ).length;
        const hidden = Array.from(hiddenKeys).filter((k) => k.startsWith('active-')).length;
        console.debug('[alert-check] mutation fresh-DB', { total, activeReserved, hidden, visible: visibleFresh.length });
      }

      if (visibleFresh.length > 0) {
        throw new Error('ALREADY_HAS_ALERT');
      }
    }

    const now = Date.now();
    const futureTime = new Date(now + data.available_in_minutes * 60 * 1000);

    const { data: newAlert, error } = await alerts.createAlert({
      user_id: user?.id,
      sellerId: user?.id,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      price: data.price,
      available_in_minutes: data.available_in_minutes,
      wait_until: futureTime.toISOString(),
      metadata: {
        user_name: data.user_name,
        user_photo: data.user_photo,
        brand: data.brand || '',
        model: data.model || '',
        color: data.color || '',
        plate: data.plate || '',
        phone: data.phone,
        allow_phone_calls: data.allow_phone_calls,
        created_from: 'parked_here',
      },
    });
    if (error) throw error;
    return newAlert;
  },

  onMutate: async (data) => {
  const now = Date.now();
  const futureTime = new Date(now + data.available_in_minutes * 60 * 1000);

  const instantAlert = {
    id: `instant_${Date.now()}`,
    ...data,
    wait_until: futureTime.toISOString(),
    created_from: 'parked_here',
    status: 'active',
    created_date: new Date().toISOString()
  };

  queryClient.setQueryData(['myAlerts'], (old) => {
    const list = Array.isArray(old) ? old : (old?.data || []);
    return [instantAlert, ...list];
  });

  window.dispatchEvent(new Event('waitme:badgeRefresh'));
},

  onSuccess: (newAlert) => {
    // Update optimista sobre la key exacta activa
    queryClient.setQueryData(alertsKey(mode, locationKey), (old) => {
      const list = Array.isArray(old) ? old : (old?.data || []);
      return [newAlert, ...list.filter(a => !a.id?.startsWith('temp_'))];
    });
    // Invalida el prefijo para refrescar todas las variantes
    queryClient.invalidateQueries({ queryKey: alertsPrefix });

    queryClient.setQueryData(['myAlerts'], (old) => {
      const list = Array.isArray(old) ? old : (old?.data || []);
      return [newAlert, ...list.filter(a => !a.id?.startsWith('temp_'))];
    });

    if (import.meta.env.DEV) {
      console.debug('[alertsKey] createAlertMutation.onSuccess → setQueryData', alertsKey(mode, locationKey));
    }

    try {
      window.dispatchEvent(new Event('waitme:badgeRefresh'));
      window.dispatchEvent(new CustomEvent('waitme:alertPublished', { detail: { alertId: newAlert?.id || null } }));
    } catch {}
    setConfirmPublishOpen(false);
    setPendingPublishPayload(null);
    navigate(createPageUrl('History'));
  },

  onError: (error) => {
    if (error?.message === 'ALREADY_HAS_ALERT') {
      // CERRAMOS CUALQUIER DIALOG ABIERTO
      setConfirmPublishOpen(false);
      setPendingPublishPayload(null);

      // ABRIMOS SOLO EL MENSAJE MORADO
      setOneActiveAlertOpen(true);
      return;
    }

    queryClient.invalidateQueries({ queryKey: alertsPrefix });
    queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
  }
});

  const buyAlertMutation = useMutation({
    mutationFn: async (alert) => {
      if (alert?.is_demo) {
        return { demo: true };
      }

      const buyerName = user?.full_name || user?.display_name || 'Usuario';
      const buyerCarBrand = user?.brand || '';
      const buyerCarModel = user?.model || '';
      const buyerCarColor = user?.color || 'gris';
      const buyerPlate = user?.plate || '';
      const buyerVehicleType = user?.vehicle_type || 'car';

      const { error: updateErr } = await alerts.updateAlert(alert.id, {
        status: 'reserved',
        reserved_by_id: user?.id,
        reserved_by_name: buyerName,
        reserved_by_car: `${buyerCarBrand} ${buyerCarModel}`.trim(),
        reserved_by_car_color: buyerCarColor,
        reserved_by_plate: buyerPlate,
        reserved_by_vehicle_type: buyerVehicleType
      });
      if (updateErr) throw updateErr;

      const txRes = await transactions.createTransaction({
        alert_id: alert.id,
        buyer_id: user?.id,
        seller_id: alert.user_id || alert.seller_id || alert.created_by,
        amount: Number(alert.price) || 0,
        status: 'pending'
      });
      if (txRes.error) throw txRes.error;

      const { data: conv } = await chat.createConversation({
        buyerId: user?.id,
        sellerId: alert.user_id || alert.seller_id || alert.created_by,
        alertId: alert.id
      });
      if (conv?.id) {
        await chat.sendMessage({
          conversationId: conv.id,
          senderId: user?.id,
          body: 'Ey! Te he enviado un WaitMe!'
        });
      }
      return { ...alert, status: 'reserved', reserved_by_id: user?.id };
    },
    onMutate: async (alert) => {
      setConfirmDialog({ open: false, alert: null });
      navigate(createPageUrl('History'));

      // Usa la key activa exacta para cancelar + snapshot + update optimista
      const activeKey = alertsKey(mode, locationKey);
      await queryClient.cancelQueries({ queryKey: activeKey });

      const previousAlerts = queryClient.getQueryData(activeKey);

      queryClient.setQueryData(activeKey, (old) => {
        const list = Array.isArray(old) ? old : (old?.data || []);
        return list.map(a => a.id === alert.id ? { ...a, status: 'reserved', reserved_by_id: user?.id } : a);
      });

      if (import.meta.env.DEV) {
        console.debug('[P1] buyAlertMutation.onMutate → optimistic update on', activeKey);
      }

      return { previousAlerts, activeKey };
    },
    onError: (err, alert, context) => {
      // Restaura el snapshot usando la key guardada en el contexto
      if (context?.previousAlerts !== undefined) {
        queryClient.setQueryData(context.activeKey ?? alertsKey(mode, locationKey), context.previousAlerts);
      }
      setSelectedAlert(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: alertsPrefix });
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
      try { window.dispatchEvent(new Event('waitme:badgeRefresh')); } catch {}
    }
  });

  const handleBuyAlert = (alert) => {
    guard(() => setConfirmDialog({ open: true, alert }));
  };

  const handleChat = async () => {
    navigate(createPageUrl('History'));
  };

  const handleCall = async () => {
    navigate(createPageUrl('History'));
  };

  const handleBack = useCallback(() => {
    resetToLogo({ invalidate: false });
  }, [resetToLogo]);

  const handleTitleClick = useCallback(() => {
    window.dispatchEvent(new Event('waitme:goLogo'));
  }, []);

  useEffect(() => {
    setHeader({
      showBackButton: !!mode,
      onBack: mode ? handleBack : null,
      onTitleClick: handleTitleClick,
    });
    return () => setHeader({ showBackButton: false, onBack: null, onTitleClick: null });
  }, [mode, handleBack, handleTitleClick, setHeader]);

  const handleMapMove = useCallback((center) => {
    setSelectedPosition({ lat: center[0], lng: center[1] });
  }, []);

  const handleMapMoveEnd = useCallback((center) => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${center[0]}&lon=${center[1]}&zoom=19&addressdetails=1`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.address) {
          const a = data.address;
          const road = a.road || a.pedestrian || a.footway || a.path || a.street || a.cycleway || '';
          const number = a.house_number || '';
          setAddress(number ? `${road}, ${number}` : road || data.display_name?.split(',')[0] || '');
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative w-full min-h-screen overflow-hidden text-white">
      {/* Mapa como fondo a pantalla completa */}
      <MapboxMap className="absolute inset-0 w-full h-full" />

      {/* Overlay profesional estilo Uber/Bolt — no tapa el mapa */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none
          bg-gradient-to-b
          from-[#1a0b2e]/80
          via-[#1a0b2e]/55
          to-[#0b0618]/90"
      />

      {/* Contenido UI por encima del mapa */}
      <div className="relative z-10 flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col relative overflow-hidden min-h-0">
        {/* CONTENT_AREA: espacio exacto entre header y bottom nav (alturas medidas en tiempo real) */}
        <div
          className="overflow-hidden"
          style={{
            display: mode ? 'none' : 'flex',
            position: 'absolute',
            top: headerHeight,
            bottom: navHeight,
            left: 0,
            right: 0,
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
              {/* HERO: logo + frase + pin + botones — centrado sin márgenes ni padding */}
              <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pointer-events-auto">
                <img
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  width={212}
                  height={212}
                  src={appLogo}
                  alt="WaitMe!"
                  className="w-[212px] h-[212px] object-contain translate-y-[5px]"
                />

                <h1 className="text-4xl font-bold leading-none whitespace-nowrap mt-[-38px]">
                  Wait<span className="text-purple-500">Me!</span>
                </h1>

                <p className="text-xl font-bold mt-2 whitespace-nowrap">
                  Aparca donde te <span className="text-purple-500">avisen!</span>
                </p>

                <div className="flex flex-col items-center w-full max-w-sm">
                  <div className="flex flex-col items-center mt-[7px] mb-[4px]">
                    <div className="w-4 h-4 rounded-full bg-purple-500 animate-pulse shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
                    <div className="w-[2px] h-8 bg-purple-500" />
                  </div>

                  <div className="w-full space-y-4 mt-4">
                    <Button
                      onClick={() => setMode('search')}
                      className="w-full h-20 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-4 [&_svg]:!w-10 [&_svg]:!h-10"
                    >
                      <MagnifierIconProfile color="#8b5cf6" size="w-14 h-14" />
                      ¿ Dónde quieres aparcar ?
                    </Button>

                    <Button
                      onClick={() => guard(() => {
                        getCurrentLocation();
                        setMode('create');
                      })}
                      className="w-full h-20 bg-purple-600 hover:bg-purple-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-4 [&_svg]:!w-20 [&_svg]:!h-14"
                    >
                      <CarIconProfile color="#000000" size="w-20 h-14" />
                      ¡ Estoy aparcado aquí !
                    </Button>
                  </div>
                </div>
              </div>
        </div>

        <AnimatePresence mode="wait">
          {/* DÓNDE QUIERES APARCAR (SIN SCROLL) */}
          {mode === 'search' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[60px] flex flex-col"
              style={{ overflow: 'hidden', height: 'calc(100dvh - 60px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}
            >
              <div className="relative px-3 pt-[14px] pb-2 flex-none"
                style={{ height: "280px" }}>
                <div
                  className="rounded-2xl border-2 border-purple-500 overflow-hidden h-full"
                  style={{
                    boxShadow:
                      '0 0 30px rgba(168, 85, 247, 0.5), inset 0 0 20px rgba(168, 85, 247, 0.2)',
                  }}
                >
                  <ParkingMap
                    alerts={searchAlerts}
                    onAlertClick={setSelectedAlert}
                    userLocation={userLocation}
                    selectedAlert={selectedAlert}
                    showRoute={!!selectedAlert}
                    zoomControl={true}
                    className="h-full"
                  />
                </div>
                {!showFilters && (
                  <Button
                    onClick={() => setShowFilters(true)}
                    className="absolute top-5 right-7 z-[1000] bg-black/60 backdrop-blur-sm border border-purple-500/30 text-white hover:bg-purple-600"
                    size="icon"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </Button>
                )}

                <AnimatePresence>
                  {showFilters && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowFilters(false)}
                        className="absolute inset-0 z-[999]"
                      />
                      <MapFilters
                        filters={filters}
                        onFilterChange={setFilters}
                        onClose={() => setShowFilters(false)}
                        alertsCount={searchAlerts.length}
                      />
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div className="px-7 pt-[2px] pb-[2px] flex-shrink-0">
                <div className="bg-gray-900/40 backdrop-blur-sm border-2 border-purple-500/50 rounded-xl px-3 py-[6px] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar dirección..."
                    className="bg-transparent border-0 text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-7 text-sm p-0"
                  />
                </div>
              </div>

              <div className="flex-1 px-4 pt-2 pb-3 min-h-0 overflow-hidden flex items-start">
                <div className="w-full h-full">
                  <UserAlertCard
                    alert={selectedAlert}
                    isEmpty={!selectedAlert}
                    onBuyAlert={handleBuyAlert}
                    onChat={handleChat}
                    onCall={handleCall}
                    isLoading={buyAlertMutation.isPending}
                    userLocation={userLocation}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ESTOY APARCADO AQUÍ (sin scroll) */}
          {mode === 'create' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[60px] flex flex-col"
              style={{ overflow: 'hidden', height: 'calc(100dvh - 60px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}
            >
              <div className="relative px-3 pt-[14px] pb-2 flex-none"
                style={{ height: "280px" }}>
                <div
                  className="rounded-2xl border-2 border-purple-500 overflow-hidden h-full"
                  style={{
                    boxShadow:
                      '0 0 30px rgba(168, 85, 247, 0.5), inset 0 0 20px rgba(168, 85, 247, 0.2)',
                  }}
                >
                  <ParkingMap
                    useCenterPin={true}
                    userLocation={userLocation}
                    zoomControl={true}
                    className="h-full"
                    onMapMove={handleMapMove}
                    onMapMoveEnd={handleMapMoveEnd}
                  />
                </div>
              </div>

              <div className="px-7 pt-[2px] pb-[2px] flex-shrink-0">
                <div className="bg-purple-600/20 border-2 border-purple-500/50 rounded-xl px-3 py-[2px]">
                  <h3 className="text-white font-semibold text-center text-sm">
                    ¿ Dónde estas aparcado ?
                  </h3>
                </div>
              </div>

              <div className="px-4 mt-[10px] flex-1 min-h-0 flex items-stretch">
                <div className="w-full h-full">
                  <CreateAlertCard
                    address={address}
                    onAddressChange={setAddress}
                    onUseCurrentLocation={getCurrentLocation}
                    useCurrentLocationLabel="Ubicación actual"
                    onCreateAlert={async (data) => {
                      if (!selectedPosition || !address) {
                        alert('Por favor, selecciona una ubicación en el mapa');
                        return;
                      }

                      const currentUser = user;
                      const payload = {
                        latitude: selectedPosition.lat,
                        longitude: selectedPosition.lng,
                        address: address,
                        price: data.price,
                        available_in_minutes: data.minutes,
                        user_name: currentUser?.full_name?.split(' ')[0] || currentUser?.display_name || 'Usuario',
                        user_photo: currentUser?.photo_url || null,
                        brand: currentUser?.brand || 'Sin marca',
                        model: currentUser?.model || 'Sin modelo',
                        color: currentUser?.color || 'gris',
                        plate: currentUser?.plate || '0000XXX',
                        phone: currentUser?.phone || null,
                        allow_phone_calls: currentUser?.allow_phone_calls || false
                      };

                      // Fast check from cache — same selector as HistorySellerView visibleActiveAlerts
                      if (myActiveAlerts && myActiveAlerts.length > 0) {
                        setOneActiveAlertOpen(true);
                        return;
                      }
                      try {
                        const uid = user?.id;
                        const email = user?.email;
                        if (uid || email) {
                          const { data: mine = [] } = uid
                            ? await alerts.getMyAlerts(uid)
                            : { data: [] };
                          const hiddenKeys = readHiddenKeys();
                          const visibleFresh = getVisibleActiveSellerAlerts(mine, uid, email, hiddenKeys);
                          if (import.meta.env.DEV) {
                            const total = (mine || []).length;
                            const activeReserved = (mine || []).filter((a) =>
                              ['active', 'reserved'].includes(String(a?.status || '').toLowerCase())
                            ).length;
                            const hidden = Array.from(hiddenKeys).filter((k) => k.startsWith('active-')).length;
                            console.debug('[alert-check] button fresh-DB', { total, activeReserved, hidden, visible: visibleFresh.length });
                          }
                          if (visibleFresh.length > 0) {
                            setOneActiveAlertOpen(true);
                            return;
                          }
                        }
                      } catch {}

                      setPendingPublishPayload(payload);
                      setConfirmPublishOpen(true);
                    }}
                    isLoading={createAlertMutation.isPending}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {oneActiveAlertOpen && (
  <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center">
    <div className="relative bg-gray-900 border-t-2 border-b-2 border-purple-500 max-w-sm w-[90%] rounded-xl p-6">
      
      <button
        onClick={() => setOneActiveAlertOpen(false)}
        className="absolute top-3 right-3 w-7 h-7 rounded-md bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
        type="button"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col items-center text-center space-y-3">
  <span className="text-white font-semibold text-base">
    Ya tienes una alerta publicada.
  </span>

  <span className="text-gray-400 text-sm">
    No puedes tener 2 alertas activas.
  </span>
</div>
    </div>
  </div>
)}

      <Dialog open={confirmPublishOpen} onOpenChange={(open) => {
        setConfirmPublishOpen(open);
        if (!open) setPendingPublishPayload(null);
      }}>
        <DialogContent
          hideClose
          className="bg-gray-900 border border-gray-800 text-white max-w-sm border-t-2 border-b-2 border-purple-500"
        >
          {/* Caja morada centrada */}
          <div className="flex justify-center">
            <div className="px-4 py-2 rounded-lg bg-purple-700/60 border border-purple-500/60">
              <span className="text-white font-semibold text-sm">Vas a publicar una alerta:</span>
            </div>
          </div>

          {/* Tarjeta incrustada */}
          <div className="mt-4">
            <div className="bg-gray-900 rounded-xl p-4 border-2 border-purple-500/50">
              {/* Calle */}
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span className="text-white">En:</span>
                <span className="text-purple-400 font-semibold">
                  {pendingPublishPayload?.address || ''}
                </span>
              </div>

              {/* Te vas en */}
              <div className="flex items-center gap-2 text-sm mt-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-white">Te vas en:</span>
                <span className="text-purple-400 font-semibold text-base">
                  {pendingPublishPayload?.available_in_minutes ?? ''} minutos
                </span>
              </div>

              {/* Precio */}
              <div className="flex items-center gap-2 text-sm mt-2">
                <Euro className="w-4 h-4 text-purple-400" />
                <span className="text-white">Precio:</span>
                <span className="text-purple-400 font-semibold text-base">
                  {pendingPublishPayload?.price ?? ''} €
                </span>
              </div>
            </div>
          </div>

          {/* Debes esperar... fuera de la tarjeta */}
          <div className="mt-3 text-center text-purple-400 font-bold text-base">
            {(() => {
              const mins = Number(pendingPublishPayload?.available_in_minutes ?? 0);
              if (!mins) return null;
              const waitUntil = new Date(Date.now() + mins * 60 * 1000);
              const hhmm = waitUntil.toLocaleTimeString('es-ES', {
                timeZone: 'Europe/Madrid',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
              return (
                <>
                  <span className="text-purple-400 text-base font-normal">
                    Debes esperar hasta las:{' '}
                    <span className="text-white" style={{ fontSize: '18px', fontWeight: 'bold' }}>{hhmm}</span>
                  </span>
                </>
              );
            })()}
          </div>

          {/* Aviso legal */}
          <p className="text-white/60 text-xs text-center mt-3 px-1 leading-snug">
            Si te vas antes de que finalice el tiempo, se suspenderá 24 horas tu servicio de publicación de alertas y tendrás una penalización adicional de un 33% en tu próximo ingreso.
          </p>

          {/* Botones: ancho solo del texto, Aceptar izquierda / Rechazar derecha */}
          <DialogFooter className="flex flex-row items-center justify-center gap-3 mt-3 w-full">
            <Button
              onClick={() => {
                if (!pendingPublishPayload) return;
                setConfirmPublishOpen(false);
                createAlertMutation.mutate(pendingPublishPayload);
                setPendingPublishPayload(null);
              }}
              className="w-auto px-6 min-w-[118px] bg-purple-600 hover:bg-purple-700"
            >
              Aceptar
            </Button>

            <Button
              onClick={() => {
                setConfirmPublishOpen(false);
                setPendingPublishPayload(null);
              }}
              className="w-auto px-6 min-w-[118px] bg-red-600 hover:bg-red-700 text-white"
            >
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, alert: confirmDialog.alert })}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirmar reserva</DialogTitle>
            <DialogDescription className="text-gray-400">
              Vas a enviar una solicitud de reserva por{' '}
              <span className="text-purple-400 font-bold">{confirmDialog.alert?.price}€</span> a{' '}
              <span className="text-white font-medium">{confirmDialog.alert?.user_name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
            <p className="text-sm text-gray-400">
              <span className="text-white">
                {confirmDialog.alert?.brand} {confirmDialog.alert?.model}
              </span>
            </p>
            <p className="text-sm text-gray-400">
              Matrícula: <span className="text-white font-mono">{confirmDialog.alert?.plate}</span>
            </p>
            <p className="text-sm text-gray-400">
              Se va en: <span className="text-purple-400">{confirmDialog.alert?.available_in_minutes} min</span>
            </p>
          </div>

          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, alert: null })} className="flex-1 border-gray-700">
              Cancelar
            </Button>
            <Button
              onClick={() => buyAlertMutation.mutate(confirmDialog.alert)}
              className="w-auto px-6 min-w-[118px] bg-purple-600 hover:bg-purple-700"
            >
              Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}