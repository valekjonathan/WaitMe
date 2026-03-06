
================================================================
FILE: src/pages/Home.jsx
================================================================
```jsx
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import * as alerts from '@/data/alerts';
import * as chat from '@/data/chat';
import * as notifications from '@/data/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as transactions from '@/data/transactions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, MapPin, Clock, Euro, X } from 'lucide-react';
import { useLayoutHeader } from '@/lib/LayoutContext';
import MapboxMap from '@/components/MapboxMap';
import CreateMapOverlay from '@/components/CreateMapOverlay';
import SearchMapOverlay from '@/components/SearchMapOverlay';
import { getMockOviedoAlerts } from '@/lib/mockOviedoAlerts';
import MapFilters from '@/components/map/MapFilters';
import UserAlertCard from '@/components/cards/UserAlertCard';
import { getVisibleActiveSellerAlerts, readHiddenKeys } from '@/lib/alertSelectors';
import { useAuth } from '@/lib/AuthContext';
import { useProfileGuard } from '@/hooks/useProfileGuard';
import { useMyAlerts } from '@/hooks/useMyAlerts';
import { alertsPrefix, nearbyAlertsKey, getLocationKeyForNearby, extractLatLng } from '@/lib/alertsQueryKey';
import { NEARBY_RADIUS_KM } from '@/config/alerts';
import appLogo from '@/assets/d2ae993d3_WaitMe.png';

// Preload logo eagerly so it's always instant on first render
if (typeof window !== 'undefined') {
  try {
    const _preload = new window.Image();
    _preload.src = appLogo;
  } catch {}
}
import { haversineKm } from '@/utils/carUtils';

// DEV kill switch: disable map (render simple block instead)
const isMapDisabled = () =>
  import.meta.env.DEV && import.meta.env.VITE_DISABLE_MAP === 'true';

const RENDER_LOG = (msg, extra) => {
  if (import.meta.env.DEV) {
    try {
      console.log(`[RENDER:Home] ${msg}`, extra ?? '');
    } catch {}
  }
};

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
  RENDER_LOG('Home ENTER');
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.__DEV_DIAG = { ...(window.__DEV_DIAG || {}), homeMounted: true };
      return () => {
        window.__DEV_DIAG = { ...(window.__DEV_DIAG || {}), homeMounted: false };
      };
    }
  }, []);
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

  const heroRef = useRef(null);
  const mapRef = useRef(null);
  const modeRef = useRef(mode);
  const debounceReverseRef = useRef(null);
  const lastGeocodeRef = useRef({ lat: null, lng: null });
  const [contentArea, setContentArea] = useState({ top: 0, height: 0 });

  useEffect(() => {
    modeRef.current = mode;
    if (mode === 'create') lastGeocodeRef.current = { lat: null, lng: null };
  }, [mode]);

  useEffect(() => {
    if (mode) return;
    const measure = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const header = document.querySelector('[data-waitme-header]');
          const nav = document.querySelector('[data-waitme-nav]');
          if (!header || !nav) return;

          const headerRect = header.getBoundingClientRect();
          const navRect = nav.getBoundingClientRect();
          const headerBottom = headerRect.bottom;
          const navTop = navRect.top;
          const gapHeight = navTop - headerBottom;

          setContentArea({ top: headerBottom, height: gapHeight });
        });
      });
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [mode]);

  const locationKey = useMemo(() => {
    const coords = extractLatLng(userLocation);
    return coords ? getLocationKeyForNearby(coords.lat, coords.lng) : null;
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
    queryKey: nearbyAlertsKey(locationKey),
    enabled: !!locationKey,
    queryFn: async () => {
      const coords = extractLatLng(userLocation);
      if (!coords) return [];
      const { data, error } = await alerts.getNearbyAlerts(coords.lat, coords.lng, NEARBY_RADIUS_KM);
      if (error) {
        console.error('[getNearbyAlerts]', error);
        return [];
      }
      return data ?? [];
    },
    staleTime: 15_000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
    retry: false,
    placeholderData: (prev) => prev,
  });

  // Realtime: invalidar nearby cuando se crea/actualiza/elimina una alerta
  useEffect(() => {
    const unsub = alerts.subscribeAlerts({
      onUpsert: () => {
        queryClient.invalidateQueries({ queryKey: ['alerts', 'nearby'] });
      },
      onDelete: () => {
        queryClient.invalidateQueries({ queryKey: ['alerts', 'nearby'] });
      },
    });
    return unsub;
  }, [queryClient]);

  // Una sola fuente de verdad (también alimenta la bolita del BottomNav)
  const { data: myAlerts = [] } = useMyAlerts();

  const myActiveAlerts = useMemo(() => {
    const hiddenKeys = readHiddenKeys();
    return getVisibleActiveSellerAlerts(myAlerts, user?.id, user?.email, hiddenKeys);
  }, [myAlerts, user?.id, user?.email]);

  useEffect(() => {
    if (!user?.id && !user?.email) return;
    queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
  }, [user?.id, user?.email, queryClient]);

  const formatAddress = (road, number, city) => {
    let streetFormatted = (road || '').trim();
    if (streetFormatted.toLowerCase().startsWith('calle ')) {
      streetFormatted = 'C/ ' + streetFormatted.slice(6);
    } else if (streetFormatted.toLowerCase().startsWith('avenida ')) {
      streetFormatted = 'Av. ' + streetFormatted.slice(8);
    }
    const parts = [streetFormatted, number, city].filter(Boolean);
    return parts.length ? parts.join(', ') : '';
  };

  const reverseGeocode = useCallback((lat, lng) => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=19&addressdetails=1`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.address) {
          const a = data.address;
          const road = a.road || a.pedestrian || a.footway || a.path || a.street || a.cycleway || '';
          const number = a.house_number || '';
          const city = a.city || a.town || a.village || a.municipality || '';
          const result = formatAddress(road, number, city) || data.display_name?.split(',')[0] || '';
          if (result) setAddress(result);
        }
      })
      .catch(() => {});
  }, []);

  const debouncedReverseGeocode = useCallback((lat, lng) => {
    const prev = lastGeocodeRef.current;
    const same = prev.lat != null && prev.lng != null &&
      Math.abs(prev.lat - lat) < 1e-6 && Math.abs(prev.lng - lng) < 1e-6;
    if (same) return;
    lastGeocodeRef.current = { lat, lng };
    if (debounceReverseRef.current) clearTimeout(debounceReverseRef.current);
    debounceReverseRef.current = setTimeout(() => {
      reverseGeocode(lat, lng);
      debounceReverseRef.current = null;
    }, 150);
  }, [reverseGeocode]);

  // One-shot: usado al pulsar mirilla. onReady(lat, lng) se llama cuando la posición está lista.
  const getCurrentLocation = useCallback((onReady) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);
        setSelectedPosition({ lat: latitude, lng: longitude });
        reverseGeocode(latitude, longitude);
        onReady?.({ lat: latitude, lng: longitude });
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
        if (accuracy > 30) return;
        setUserLocation([latitude, longitude]);
        // En modo create, selectedPosition viene del mapa/mirilla; no sobrescribir con GPS
        if (modeRef.current !== 'create') {
          setSelectedPosition({ lat: latitude, lng: longitude });
          reverseGeocode(latitude, longitude);
        }
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

  const MOCK_THRESHOLD = 15;

  const homeMapAlerts = useMemo(() => {
    const base = mode === 'search' ? (searchAlerts || []) : (mode === null ? (Array.isArray(rawAlerts) ? rawAlerts : []) : []);
    if (mode === 'search' || mode === null) {
      if (base.length < MOCK_THRESHOLD) {
        const mock = getMockOviedoAlerts(userLocation);
        const toAdd = Math.min(mock.length, Math.max(0, 50 - base.length));
        return [...base, ...mock.slice(0, toAdd)];
      }
    }
    return base;
  }, [mode, searchAlerts, rawAlerts, userLocation]);

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
      vehicle_type: data.vehicle_type || 'car',
      vehicle_color: data.vehicle_color || data.color || 'gray',
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
    // Update optimista sobre nearby (mapa)
    queryClient.setQueryData(nearbyAlertsKey(locationKey), (old) => {
      const list = Array.isArray(old) ? old : (old?.data || []);
      return [newAlert, ...list.filter(a => !a.id?.startsWith('temp_'))];
    });
    // Invalida el prefijo para refrescar todas las variantes
    queryClient.invalidateQueries({ queryKey: alertsPrefix });

    queryClient.setQueryData(['myAlerts'], (old) => {
      const list = Array.isArray(old) ? old : (old?.data || []);
      return [newAlert, ...list.filter(a => !a.id?.startsWith('temp_'))];
    });

    try {
      window.dispatchEvent(new Event('waitme:badgeRefresh'));
      window.dispatchEvent(new CustomEvent('waitme:alertPublished', { detail: { alertId: newAlert?.id || null } }));
    } catch {}
    setConfirmPublishOpen(false);
    setPendingPublishPayload(null);
    navigate('/alerts');
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

      const { data: reservedAlert, error: reserveErr } = await alerts.reserveAlert(alert.id, user?.id, {
        reserved_by_name: buyerName,
        reserved_by_car: `${buyerCarBrand} ${buyerCarModel}`.trim(),
        reserved_by_car_color: buyerCarColor,
        reserved_by_plate: buyerPlate,
        reserved_by_vehicle_type: buyerVehicleType,
      });
      if (reserveErr) {
        if (reserveErr.message === 'ALREADY_RESERVED' || reserveErr.code === 'ALREADY_RESERVED') {
          const err = new Error('ALREADY_RESERVED');
          err.code = 'ALREADY_RESERVED';
          throw err;
        }
        throw reserveErr;
      }

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

      // Usa la key nearby para cancelar + snapshot + update optimista
      const activeKey = nearbyAlertsKey(locationKey);
      await queryClient.cancelQueries({ queryKey: activeKey });

      const previousAlerts = queryClient.getQueryData(activeKey);

      queryClient.setQueryData(activeKey, (old) => {
        const list = Array.isArray(old) ? old : (old?.data || []);
        return list.map(a => a.id === alert.id ? { ...a, status: 'reserved', reserved_by_id: user?.id } : a);
      });

      return { previousAlerts, activeKey };
    },
    onError: (err, alert, context) => {
      if (context?.previousAlerts !== undefined) {
        queryClient.setQueryData(context.activeKey ?? nearbyAlertsKey(locationKey), context.previousAlerts);
      }
      if (err?.message === 'ALREADY_RESERVED' || err?.code === 'ALREADY_RESERVED') {
        queryClient.invalidateQueries({ queryKey: ['alerts', 'nearby'] });
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

  const handleMapMove = useCallback(() => {
    /* No-op: evita setState por frame durante drag (reduce CPU/calentamiento) */
  }, []);

  const handleMapMoveEnd = useCallback((center) => {
    if (!Array.isArray(center) || center.length < 2) return;
    const [lat, lng] = center;
    if (typeof lat !== 'number' || typeof lng !== 'number') return;
    setSelectedPosition({ lat, lng });
    debouncedReverseGeocode(lat, lng);
  }, [debouncedReverseGeocode]);

  const handleMapMoveSearch = useCallback((center) => {
    const [lat, lng] = center;
    setUserLocation([lat, lng]);
  }, []);

  const handleRecenter = useCallback((coords) => {
    if (coords?.lat == null || coords?.lng == null) return;
    const { lat, lng } = coords;
    setSelectedPosition({ lat, lng });
    reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  const handleStreetSelect = useCallback((result) => {
    if (result?.lng == null || result?.lat == null) return;
    const { lng, lat, place_name } = result;
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: 17,
      pitch: 30,
      duration: 600,
    });
    if (mode === 'search') {
      setUserLocation([lat, lng]);
    }
  }, [mode]);

  if (isMapDisabled()) {
    RENDER_LOG('Home RETURNS map disabled (kill switch)');
    return (
      <div className="relative w-full min-h-[100dvh] overflow-hidden text-white bg-black flex items-center justify-center">
        <div className="text-center p-6 border border-purple-500/50 rounded-xl bg-gray-900/80">
          <p className="text-purple-400 font-mono text-sm">[DEV] VITE_DISABLE_MAP=true</p>
          <p className="text-gray-400 text-xs mt-2">Mapa desactivado para diagnóstico</p>
        </div>
      </div>
    );
  }

  RENDER_LOG('Home RETURNS map enabled');
  return (
    <div className="relative w-full min-h-[100dvh] overflow-hidden text-white">
      {/* Mapa como fondo a pantalla completa — h-[100dvh] garantiza altura estable en móvil/simulador */}
      <MapboxMap
        className="absolute inset-0 z-0 w-full h-full"
        style={{ top: 0, left: 0, width: '100%', height: '100%' }}
        alerts={mode === 'create' ? [] : homeMapAlerts}
        mapRef={mapRef}
        onMapLoad={(map) => { mapRef.current = map; }}
        onAlertClick={(alert) => {
          setMode('search');
          setSelectedAlert(alert);
        }}
        useCenterPin={mode === 'create' || mode === 'search'}
        centerPinFromOverlay={mode === 'create' || mode === 'search'}
        centerPaddingBottom={mode === 'create' ? 280 : mode === 'search' ? 120 : 0}
        onMapMove={mode === 'create' ? handleMapMove : undefined}
        onMapMoveEnd={mode === 'create' ? handleMapMoveEnd : mode === 'search' ? handleMapMoveSearch : undefined}
      >
        {mode === 'create' && (
          <CreateMapOverlay
            address={address}
            onAddressChange={setAddress}
            onUseCurrentLocation={getCurrentLocation}
            onRecenter={handleRecenter}
            mapRef={mapRef}
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
                allow_phone_calls: currentUser?.allow_phone_calls || false,
                vehicle_type: currentUser?.vehicle_type || profile?.vehicle_type || 'car',
                vehicle_color: currentUser?.vehicle_color || profile?.vehicle_color || currentUser?.color || profile?.color || 'gray',
              };
              if (myActiveAlerts && myActiveAlerts.length > 0) {
                setOneActiveAlertOpen(true);
                return;
              }
              try {
                const uid = user?.id;
                const email = user?.email;
                if (uid || email) {
                  const { data: mine = [] } = uid ? await alerts.getMyAlerts(uid) : { data: [] };
                  const hiddenKeys = readHiddenKeys();
                  const visibleFresh = getVisibleActiveSellerAlerts(mine, uid, email, hiddenKeys);
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
        )}
        {mode === 'search' && (
          <SearchMapOverlay
            onStreetSelect={handleStreetSelect}
            mapRef={mapRef}
            filtersButton={
              !showFilters && (
                <Button
                  onClick={() => setShowFilters(true)}
                  className="bg-black/60 backdrop-blur-sm border border-purple-500/30 text-white hover:bg-purple-600"
                  size="icon"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </Button>
              )
            }
            filtersContent={
              <AnimatePresence>
                {showFilters && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowFilters(false)}
                      className="fixed inset-0 z-[999] bg-black/40"
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
            }
            alertCard={
              <UserAlertCard
                alert={selectedAlert}
                isEmpty={!selectedAlert}
                onBuyAlert={handleBuyAlert}
                onChat={handleChat}
                onCall={handleCall}
                isLoading={buyAlertMutation.isPending}
                userLocation={userLocation}
              />
            }
          />
        )}
      </MapboxMap>

      {/* En modo create/search: no cubrir el mapa; eventos pasan al canvas */}
      <div
        className={`relative z-10 flex flex-col min-h-screen ${mode ? 'pointer-events-none' : ''}`}
        style={mode ? { pointerEvents: 'none' } : undefined}
      >
      <main className={`flex-1 flex flex-col relative overflow-hidden min-h-0 ${mode ? 'pointer-events-none' : ''}`}>
        {/* CONTENT_AREA: hueco real entre header y bottom nav */}
        <div
          data-home-content
          className="overflow-hidden"
          style={{
            display: mode ? 'none' : 'block',
            position: 'fixed',
            top: contentArea.top,
            height: contentArea.height,
            left: 0,
            right: 0,
            pointerEvents: 'none',
          }}
        >
          <div
            ref={heroRef}
            className="hero-block absolute left-1/2 z-10 flex -translate-x-1/2 flex-col items-center text-center px-6 pointer-events-auto"
            style={{ top: 30 }}
          >
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
          {/* Overlays create/search están dentro de MapboxMap para que el mapa reciba gestos */}
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
```

================================================================
FILE: src/pages/Login.jsx
================================================================
```jsx
import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { getSupabase } from '@/lib/supabaseClient';
import appLogo from '@/assets/d2ae993d3_WaitMe.png';

const OAUTH_REDIRECT_WEB = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;
const OAUTH_REDIRECT_CAPACITOR = 'capacitor://localhost';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOAuthLogin = async (provider) => {
    setError('');
    setLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setError('Supabase no configurado. Revisa .env');
        return;
      }
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: OAUTH_REDIRECT_CAPACITOR,
            skipBrowserRedirect: true,
          },
        });
        if (oauthError) throw oauthError;
        if (data?.url) {
          await Browser.open({ url: data.url });
        } else {
          setError('No se pudo obtener la URL de login');
        }
      } else {
        await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo: OAUTH_REDIRECT_WEB },
        });
      }
    } catch (err) {
      if (provider === 'apple') {
        alert('Apple no está configurado todavía.');
      } else {
        setError(err?.message || 'Error al iniciar sesión con Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img
            src={appLogo}
            alt="WaitMe!"
            width={96}
            height={96}
            className="w-24 h-24 object-contain"
          />
          <h1 className="text-3xl font-bold leading-none mt-2">
            Wait<span className="text-purple-500">Me!</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Inicia sesión para continuar</p>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-3"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
              <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <button
            type="button"
            onClick={() => handleOAuthLogin('apple')}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-3"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="currentColor" aria-hidden="true">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continuar con Apple
          </button>
        </div>
      </div>
    </div>
  );
}

```

================================================================
FILE: src/pages/Navigate.jsx
================================================================
```jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPageUrl } from '@/utils';
import * as alerts from '@/data/alerts';
import * as chat from '@/data/chat';
import { useAuth } from '@/lib/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import * as transactions from '@/data/transactions';
import { Navigation, ChevronDown, ChevronUp, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ParkingMap from '@/components/map/ParkingMap';
import UserAlertCard from '@/components/cards/UserAlertCard';
import { motion, AnimatePresence } from 'framer-motion';
import { finalize, OUTCOME } from '@/lib/transactionEngine';

function getAlertIdFromLocation() {
  const hash = window.location.hash || '';
  const queryString = hash.indexOf('?') >= 0 ? hash.substring(hash.indexOf('?')) : '';
  const fromHash = new URLSearchParams(queryString).get('alertId');
  if (fromHash) return fromHash;
  return new URLSearchParams(window.location.search).get('alertId');
}

const getCarColor = (color) => {
  const colorMap = {
    blanco: '#f5f5f5', blanca: '#f5f5f5',
    negro: '#1a1a1a', negra: '#1a1a1a',
    rojo: '#dc2626', roja: '#dc2626',
    azul: '#2563eb',
    verde: '#16a34a',
    gris: '#6b7280', grisáceo: '#6b7280',
    amarillo: '#eab308',
    naranja: '#f97316',
    rosa: '#ec4899',
    morado: '#9333ea',
    plateado: '#c0c0c0',
    dorado: '#d97706',
    marrón: '#8b4513', marron: '#8b4513',
  };
  return colorMap[String(color || '').toLowerCase()] || '#808080';
};

const DEMO_ALERTS = {
  'demo_1': {
    id: 'demo_1',
    user_name: 'Sofía',
    user_photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    user_id: 'seller-1',
    user_email: 'seller1@test.com',
    brand: 'SEAT',
    model: 'León',
    color: 'blanco',
    plate: '1234 JKL',
    address: 'Calle Campoamor, 13',
    latitude: 43.3629,
    longitude: -5.8488,
    phone: '600123123',
    allow_phone_calls: true,
    price: 3,
    available_in_minutes: 6
  },
  'demo_2': { id:'demo_2', user_name:'Marco', user_photo:'https://randomuser.me/api/portraits/men/32.jpg', user_id:'seller-2', user_email:'seller2@test.com', brand:'Volkswagen', model:'Golf', color:'negro', plate:'5678 HJP', address:'Calle Fray Ceferino, Oviedo', latitude:43.3612, longitude:-5.8502, phone:'600456789', allow_phone_calls:true, price:5, available_in_minutes:10 },
  'demo_3': { id:'demo_3', user_name:'Nerea', user_photo:'https://randomuser.me/api/portraits/women/68.jpg', user_id:'seller-3', user_email:'seller3@test.com', brand:'Toyota', model:'RAV4', color:'azul', plate:'9012 LSR', address:'Calle Campoamor, Oviedo', latitude:43.363, longitude:-5.8489, phone:'600789012', allow_phone_calls:true, price:7, available_in_minutes:14 },
  'demo_4': { id:'demo_4', user_name:'David', user_photo:'https://randomuser.me/api/portraits/men/19.jpg', user_id:'seller-4', user_email:'seller4@test.com', brand:'Renault', model:'Trafic', color:'gris', plate:'3456 JTZ', address:'Plaza de la Escandalera, Oviedo', latitude:43.3609, longitude:-5.8501, phone:'600234567', allow_phone_calls:true, price:4, available_in_minutes:4 },
  'demo_5': { id:'demo_5', user_name:'Lucía', user_photo:'https://randomuser.me/api/portraits/women/12.jpg', user_id:'seller-5', user_email:'seller5@test.com', brand:'Peugeot', model:'208', color:'rojo', plate:'7788 MNB', address:'Calle Rosal, Oviedo', latitude:43.3623, longitude:-5.8483, phone:'600345678', allow_phone_calls:true, price:2, available_in_minutes:3 },
  'demo_6': { id:'demo_6', user_name:'Álvaro', user_photo:'https://randomuser.me/api/portraits/men/61.jpg', user_id:'seller-6', user_email:'seller6@test.com', brand:'Kia', model:'Sportage', color:'verde', plate:'2468 GHT', address:'Calle Jovellanos, Oviedo', latitude:43.3615, longitude:-5.8505, phone:'600567890', allow_phone_calls:true, price:6, available_in_minutes:18 }
};

export default function Navigate() {
  const alertId = getAlertIdFromLocation();

  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState([43.3670, -5.8440]);
  const [sellerLocation, setSellerLocation] = useState([43.3620, -5.8490]);
  const [isTracking, setIsTracking] = useState(false);
  const [paymentReleased, setPaymentReleased] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [forceRelease, setForceRelease] = useState(false);
  const [showAbandonWarning, setShowAbandonWarning] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [showCancelWarning, setShowCancelWarning] = useState(false);
  const watchIdRef = useRef(null);
  const queryClient = useQueryClient();
  const hasReleasedPaymentRef = useRef(false);
  const animationRef = useRef(null);
  const wasWithin5mRef = useRef(false);
  const [routeDistanceKm, setRouteDistanceKm] = useState(null);
  const [routeDurationSec, setRouteDurationSec] = useState(null);
  const onRouteLoaded = useCallback(({ distanceKm, durationSec }) => {
    setRouteDistanceKm(distanceKm);
    setRouteDurationSec(durationSec);
  }, []);

  const authUser = useAuth().user;
  useEffect(() => {
    if (authUser) setUser(authUser);
  }, [authUser]);

  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (DEMO_ALERTS[alertId]) {
      setAlert(DEMO_ALERTS[alertId]);
      return;
    }
    const fetchAlert = async () => {
      try {
        const { data } = await alerts.getAlert(alertId);
        if (data) setAlert(data);
      } catch (err) {
        console.error('Error fetching alert:', err);
      }
    };
    if (alertId) fetchAlert();
  }, [alertId]);

  const startTracking = () => {
    setIsTracking(true);
    try {
      window.localStorage.setItem('showBanner', 'true');
      window.dispatchEvent(new Event('waitme:requestsChanged'));
      window.dispatchEvent(new Event('waitme:showIncomingBanner'));
    } catch {}

    const moveTowardsDestination = () => {
      setUserLocation(prevLoc => {
        if (!prevLoc || !sellerLocation) return prevLoc;
        const lat1 = prevLoc[0], lon1 = prevLoc[1];
        const lat2 = sellerLocation[0], lon2 = sellerLocation[1];
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
        const distM = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        if (distM < 5) return prevLoc;
        const stepSize = 15 / R;
        const fraction = Math.min(stepSize / (distM / R), 1);
        return [lat1 + (lat2-lat1)*fraction, lon1 + (lon2-lon1)*fraction];
      });

      // Mover al vendedor también hacia el usuario
      setSellerLocation(prevLoc => {
        if (!prevLoc || !userLocation) return prevLoc;
        const lat1 = prevLoc[0], lon1 = prevLoc[1];
        const lat2 = userLocation[0], lon2 = userLocation[1];
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
        const distM = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        if (distM < 5) return prevLoc;
        const stepSize = 12 / R;
        const fraction = Math.min(stepSize / (distM / R), 1);
        return [lat1 + (lat2-lat1)*fraction, lon1 + (lon2-lon1)*fraction];
      });
    };
    animationRef.current = setInterval(moveTowardsDestination, 400);
  };

  const stopTracking = () => {
    if (animationRef.current) { clearInterval(animationRef.current); animationRef.current = null; }
    setIsTracking(false);
  };

  useEffect(() => {
    return () => { if (animationRef.current) clearInterval(animationRef.current); };
  }, []);

  useEffect(() => {
    if (alert?.latitude != null && alert?.longitude != null) {
      setSellerLocation([Number(alert.latitude), Number(alert.longitude)]);
    } else if (alert && (sellerLocation == null || sellerLocation.length < 2)) {
      setSellerLocation([43.362, -5.849]);
    }
  }, [alert]);

  const calculateDistanceBetweenUsers = () => {
    if (!userLocation || !sellerLocation) return null;
    const R = 6371000;
    const lat1 = userLocation[0] * Math.PI / 180;
    const lat2 = sellerLocation[0] * Math.PI / 180;
    const dLat = (sellerLocation[0] - userLocation[0]) * Math.PI / 180;
    const dLon = (sellerLocation[1] - userLocation[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const distanceMeters = calculateDistanceBetweenUsers();

  useEffect(() => {
    const sellerHere = alert && user && (String(alert.user_id)===String(user?.id) || String(alert.user_email)===String(user?.email));
    if (!alert || sellerHere || paymentReleased) return;
    if (distanceMeters === null) return;
    if (distanceMeters <= 5) { wasWithin5mRef.current = true; setShowAbandonWarning(false); }
    else if (wasWithin5mRef.current) setShowAbandonWarning(true);
  }, [distanceMeters, alert, user, paymentReleased]);

  const distLabel = distanceMeters != null
    ? distanceMeters < 1000 ? `${Math.round(distanceMeters)} m` : `${(distanceMeters/1000).toFixed(1)} km`
    : '--';

  const etaMinutes = (() => {
    if (distanceMeters == null || distanceMeters <= 0 || !routeDistanceKm || routeDistanceKm <= 0 || !routeDurationSec) return null;
    const remainingKm = distanceMeters / 1000;
    const speedKmPerSec = routeDistanceKm / routeDurationSec;
    if (!speedKmPerSec) return null;
    return Math.max(1, Math.round((remainingKm / speedKmPerSec) / 60));
  })();

  useEffect(() => {
    if (!alert || !user || hasReleasedPaymentRef.current || paymentReleased) return;
    const isSellerHere = String(alert.user_id)===String(user?.id) || String(alert.user_email)===String(user?.email);
    if (isSellerHere) return;
    if ((distanceMeters === null || distanceMeters > 5) && !forceRelease) return;
    if (forceRelease) setForceRelease(false);

    const releasePayment = async () => {
      hasReleasedPaymentRef.current = true;
      const amount = Number(alert?.price ?? 0);
      const sellerId = alert?.user_id ?? alert?.user_email;
      const buyerId = user?.id;
      if (Number.isFinite(amount) && sellerId && buyerId) {
        finalize({ outcome: OUTCOME.FINALIZADA_OK, amount, sellerId, buyerId });
      }
      const isDemo = String(alert.id).startsWith('demo_');
      if (!isDemo) {
        await alerts.updateAlert(alert.id, { status: 'completed' });
        const sellerEarnings = alert.price * 0.67;
        const platformFee = alert.price * 0.33;
        const { error: txErr } = await transactions.createTransaction({
          alert_id: alert.id,
          seller_id: alert.user_id ?? alert.seller_id,
          buyer_id: user.id,
          seller_name: alert.user_name ?? 'Usuario',
          buyer_name: user.full_name?.split(' ')[0] || 'Usuario',
          amount: alert.price,
          seller_earnings: sellerEarnings,
          platform_fee: platformFee,
          status: 'completed',
          address: alert.address ?? alert.address_text,
        });
        if (txErr) console.error('Error creando transacción:', txErr);
        const { data: conv } = await chat.createConversation({
          buyerId: user.id,
          sellerId: alert.user_id || alert.seller_id,
          alertId: alert.id
        });
        if (conv?.id) {
          await chat.sendMessage({
            conversationId: conv.id,
            senderId: user.id,
            body: `✅ Pago liberado: ${alert.price.toFixed(2)}€. El vendedor recibirá ${sellerEarnings.toFixed(2)}€`
          });
        }
      }
      setPaymentReleased(true);
      setShowPaymentSuccess(true);
      try { window.dispatchEvent(new CustomEvent('waitme:paymentReleased', { detail: { amount: Number(alert?.price ?? 0) } })); } catch {}
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['navigationAlert'] });
      queryClient.invalidateQueries({ queryKey: ['myTransactions'] });
      setTimeout(() => { window.location.href = createPageUrl('History'); }, 3000);
    };
    releasePayment();
  }, [distanceMeters, alert, user, paymentReleased, queryClient, forceRelease]);

  const displayAlert = alert;
  const isSeller = displayAlert && user && (String(displayAlert.user_id)===String(user?.id) || String(displayAlert.user_email)===String(user?.email));
  const isBuyer = displayAlert && user && (String(displayAlert.reserved_by_id)===String(user?.id) || String(displayAlert.reserved_by_email)===String(user?.email));

  const sellerName = (isBuyer ? displayAlert?.user_name : (displayAlert?.reserved_by_name || displayAlert?.user_name || 'Usuario'))?.split(' ')[0] || 'Usuario';
  const sellerPhoto = isBuyer
    ? (displayAlert?.user_photo || null)
    : (displayAlert?.reserved_by_photo || (displayAlert?.reserved_by_name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayAlert.reserved_by_name)}&background=7c3aed&color=fff&size=128` : null));

  // Icono del usuario: mi foto cuadrada con bordes redondeados (parpadeante verde) + icono coche
  const userCarIcon = displayAlert?.color
    ? `<svg width="20" height="12" viewBox="0 0 48 24" style="position:absolute;bottom:-4px;right:-4px;" fill="none">
        <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill="${getCarColor(displayAlert.color)}" stroke="white" stroke-width="1.5"/>
        <path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.3)" stroke="white" stroke-width="0.5"/>
        <circle cx="14" cy="18" r="4" fill="#333" stroke="white" stroke-width="1"/>
        <circle cx="14" cy="18" r="2" fill="#666"/>
        <circle cx="36" cy="18" r="4" fill="#333" stroke="white" stroke-width="1"/>
        <circle cx="36" cy="18" r="2" fill="#666"/>
       </svg>`
    : '';

  const userMapIcon = user?.photo_url
    ? `<div style="position:relative;width:44px;height:44px;border-radius:10px;overflow:visible;border:3px solid #22c55e;box-shadow:0 0 14px rgba(34,197,94,0.9);animation:pulse-green 1.2s ease-in-out infinite;">
        <img src="${user.photo_url}" style="width:100%;height:100%;object-fit:cover;" />
        ${userCarIcon}
       </div>
       <style>@keyframes pulse-green{0%,100%{box-shadow:0 0 10px rgba(34,197,94,0.9);}50%{box-shadow:0 0 22px rgba(34,197,94,1);}}</style>`
    : `<div style="position:relative;width:44px;height:44px;border-radius:10px;border:3px solid #22c55e;box-shadow:0 0 14px rgba(34,197,94,0.9);background:#1a1a2e;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:bold;color:#22c55e;">Yo${userCarIcon}</div>`;

  // Icono del vendedor: foto cuadrada con bordes redondeados + icono coche
  const sellerCarIcon = displayAlert?.color
    ? `<svg width="20" height="12" viewBox="0 0 48 24" style="position:absolute;bottom:-4px;right:-4px;" fill="none">
        <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill="${getCarColor(displayAlert.color)}" stroke="white" stroke-width="1.5"/>
        <path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.3)" stroke="white" stroke-width="0.5"/>
        <circle cx="14" cy="18" r="4" fill="#333" stroke="white" stroke-width="1"/>
        <circle cx="14" cy="18" r="2" fill="#666"/>
        <circle cx="36" cy="18" r="4" fill="#333" stroke="white" stroke-width="1"/>
        <circle cx="36" cy="18" r="2" fill="#666"/>
       </svg>`
    : '';

  const sellerMapIcon = sellerPhoto
    ? `<div style="position:relative;width:44px;height:44px;border-radius:10px;overflow:visible;border:3px solid #a855f7;box-shadow:0 0 12px rgba(168,85,247,0.8);">
        <img src="${sellerPhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" />
        ${sellerCarIcon}
       </div>`
    : `<div style="position:relative;width:44px;height:44px;border-radius:10px;border:3px solid #a855f7;box-shadow:0 0 12px rgba(168,85,247,0.8);background:#1a1a2e;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;color:#a855f7;">${sellerName.charAt(0)}${sellerCarIcon}</div>`;

  // Construir alert en formato compatible con UserAlertCard
  const alertForCard = displayAlert ? {
    ...displayAlert,
    // Para UserAlertCard siempre mostramos los datos del vendedor (la otra persona)
    user_name: sellerName,
    user_photo: sellerPhoto,
    brand: isBuyer ? displayAlert.brand : (displayAlert.reserved_by_car?.split(' ')[0] || ''),
    model: isBuyer ? displayAlert.model : (displayAlert.reserved_by_car?.split(' ').slice(1).join(' ') || ''),
    plate: isBuyer ? displayAlert.plate : (displayAlert.reserved_by_plate || ''),
    color: isBuyer ? displayAlert.color : (displayAlert.reserved_by_car_color || 'gris'),
    phone: isBuyer ? (displayAlert.phone || null) : null,
    allow_phone_calls: isBuyer ? displayAlert.allow_phone_calls : false,
    wait_until: displayAlert.expires_at, // Para mostrar la hora hasta que expira
  } : null;

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col">

      {/* Payment success overlay */}
      {showPaymentSuccess && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-8 mx-6 text-center shadow-2xl">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">¡Pago liberado!</h2>
            <p className="text-green-100 mb-4">Estás a menos de 5 metros</p>
            <div className="bg-white/20 rounded-xl p-3">
              <p className="text-white font-bold text-2xl">{alert?.price != null ? Number(alert.price).toFixed(2) : '0.00'}€</p>
              <p className="text-green-100 text-sm">Transacción completada</p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Abandon warning */}
      {showAbandonWarning && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="bg-amber-500/20 border-2 border-amber-500 rounded-2xl p-6 max-w-sm text-center">
            <p className="text-amber-400 font-bold text-lg">Estás abandonando el lugar...</p>
            <p className="text-gray-300 text-sm mt-2">Vuelve a menos de 5 m para completar la entrega.</p>
            <Button className="mt-4 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setShowAbandonWarning(false)}>
              Entendido
            </Button>
          </motion.div>
        </motion.div>
      )}

      {/* Cancel warning (reserved alert) */}
      {showCancelWarning && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-[150] bg-black/70">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[150] flex items-end">
            <div className="w-full bg-gray-950 rounded-t-3xl shadow-2xl border-t border-gray-800 border-b-2 border-b-purple-500">
              {/* Close button */}
              <button
                onClick={() => setShowCancelWarning(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-md bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6 pt-8 flex flex-col gap-4">
                {/* Header */}
                <div className="flex justify-center">
                  <div className="px-4 py-2 rounded-lg bg-red-700/40 border border-red-500/60">
                    <span className="text-white font-semibold text-sm">⚠️ ATENCIÓN</span>
                  </div>
                </div>

                {/* Message */}
                <div className="text-center">
                  <p className="text-white font-bold text-base">
                    La alerta está reservada.
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {sellerName} está en camino. Si la cancelas, perderás la reserva.
                  </p>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Button
                    onClick={() => setShowCancelWarning(false)}
                    className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg h-9"
                  >
                    Volver
                  </Button>
                  <Button
                    onClick={async () => {
                      await alerts.updateAlert(displayAlert.id, { status: 'cancelled', cancel_reason: 'user_cancelled' });
                      setShowCancelWarning(false);
                      setTimeout(() => { window.location.href = createPageUrl('Home'); }, 500);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-lg h-9"
                  >
                    Me voy
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* MAPA */}
      <div className="fixed left-0 right-0 z-0" style={{ top: '56px', bottom: '0' }}>
        <ParkingMap
          alerts={[]}
          userLocation={userLocation}
          selectedAlert={displayAlert}
          showRoute={true}
          sellerLocation={sellerLocation?.length >= 2 ? sellerLocation : [43.362, -5.849]}
          zoomControl={false}
          className="h-full w-full"
          userAsCar={false}
          showSellerMarker={true}
          onRouteLoaded={onRouteLoaded}
          userPhotoHtml={userMapIcon}
          sellerPhotoHtml={sellerMapIcon}
        />
      </div>

      {/* Botones flotantes: Distancia y ETA — encima del mapa */}
      <div className="fixed left-0 right-0 z-40 px-4 flex gap-2" style={{ top: 'calc(56px + 15px)' }}>
        <div className="flex-1 bg-gray-900/50 backdrop-blur-md rounded-2xl px-3 py-2 flex items-center gap-2 shadow-xl border border-gray-700/30">
          <Navigation className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-white font-black text-base leading-none">{distLabel}</p>
            <p className="text-gray-400 text-[10px] mt-0.5">Distancia</p>
          </div>
        </div>
        <div className="flex-1 bg-gray-900/50 backdrop-blur-md rounded-2xl px-3 py-2 flex items-center gap-2 shadow-xl border border-gray-700/30">
          <Clock className="w-4 h-4 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-white font-black text-base leading-none">
              {etaMinutes != null ? `${etaMinutes} min` : '--'}
            </p>
            <p className="text-gray-400 text-[10px] mt-0.5">Tiempo estimado</p>
          </div>
        </div>
      </div>

      {/* BOTTOM PANEL */}
      <div className="fixed left-0 right-0 z-50" style={{ bottom: 'var(--bottom-nav-h)' }}>
        <div className="bg-gray-950 rounded-t-3xl shadow-2xl border-t border-gray-800">
          
          {/* Toggle button: flecha abajo/arriba */}
          <button
            onClick={() => setPanelCollapsed(c => !c)}
            className="w-full flex items-center justify-center py-2 focus:outline-none"
          >
            {panelCollapsed ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          <AnimatePresence initial={false}>
            {panelCollapsed ? (
              /* Panel colapsado: solo foto cuadrada + nombre */
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 px-4 pb-3"
              >
                <div className="w-10 h-10 rounded-[6px] overflow-hidden border-2 border-purple-500/50 flex-shrink-0">
                  {sellerPhoto
                    ? <img src={sellerPhoto} alt={sellerName} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-lg font-bold text-purple-400">{sellerName.charAt(0)}</div>
                  }
                </div>
                <p className="font-bold text-white">{sellerName}</p>
              </motion.div>
            ) : (
              /* Panel expandido: UserAlertCard completa */
              <motion.div
                key="expanded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-3 pb-3"
              >
                {alertForCard && (
                  <div className="relative">
                    {isSeller && displayAlert?.status === 'reserved' && (
                      <button
                        onClick={() => setShowCancelWarning(true)}
                        className="absolute top-3 right-3 w-6 h-6 rounded-md bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <UserAlertCard
                      alert={alertForCard}
                      hideBuy={true}
                      userLocation={userLocation}
                      showDistanceInMeters={true}
                      buyLabel={isSeller ? 'He desaparcado ✓' : (!isTracking ? '▶ IR' : 'Detener')}
                      onBuyAlert={() => {
                        if (isSeller) {
                          window.location.href = createPageUrl('History');
                        } else if (!isTracking) {
                          startTracking();
                        } else {
                          stopTracking();
                        }
                      }}
                      onChat={() => {
                        window.location.href = createPageUrl(`Chat?alertId=${alertId}&userId=${displayAlert?.user_email || displayAlert?.user_id}`);
                      }}
                      onCall={() => {
                        const phone = isBuyer ? displayAlert?.phone : null;
                        if (phone) window.location.href = `tel:${phone}`;
                      }}
                    />
                  </div>
                )}
                {!isSeller && displayAlert && String(displayAlert.id).startsWith('demo_') && !paymentReleased && (
                  <button
                    onClick={() => setForceRelease(true)}
                    className="w-full mt-2 h-7 rounded-xl border border-dashed border-amber-500/50 text-amber-400 text-xs hover:bg-amber-500/10 transition-colors"
                  >
                    Simular llegada (demo)
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
```

================================================================
FILE: src/pages/NotificationSettings.jsx
================================================================
```jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import * as profiles from '@/data/profiles';
import { Bell, CreditCard, MapPin, Megaphone } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';

export default function NotificationSettings() {
  const { user } = useAuth();

  // ✅ Sin pantalla negra: valores por defecto y luego se sincroniza en background
  const [masterToggle, setMasterToggle] = useState(true);
  const [settings, setSettings] = useState({
    notify_reservations: true,
    notify_payments: true,
    notify_proximity: true,
    notify_promotions: true
  });

  useEffect(() => {
    // Relleno instantáneo desde user (si existe) sin bloquear render
    if (!user) return;

    setMasterToggle(user.notifications_enabled ?? true);
    setSettings({
      notify_reservations: user.notify_reservations ?? true,
      notify_payments: user.notify_payments ?? true,
      notify_proximity: user.notify_proximity ?? true,
      notify_promotions: user.notify_promotions ?? true
    });
  }, [user]);

  const updateMasterToggle = async (value) => {
    setMasterToggle(value);
    try {
      if (user?.id) await profiles.updateProfile(user.id, { notifications_enabled: value });
    } catch (error) {
      console.log('Error guardando preferencia:', error);
    }
  };

  const updateSetting = async (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    try {
      if (user?.id) await profiles.updateProfile(user.id, { [key]: value });
    } catch (error) {
      console.log('Error guardando preferencia:', error);
    }
  };

  return (
    <div className="min-min-h-[100dvh] bg-black text-white flex flex-col">
      <main className="flex-1 flex flex-col min-h-0 overflow-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto space-y-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Permitir notificaciones:</h2>
            <Switch
              checked={masterToggle}
              onCheckedChange={updateMasterToggle}
              className={masterToggle ? 'data-[state=checked]:bg-green-500' : 'data-[state=unchecked]:bg-red-500'}
            />
          </div>

          <div className="bg-gray-900 rounded-2xl border-2 border-purple-500/30 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600/20 p-2 rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="font-semibold text-base">Reservas</h3>
              </div>
              <Switch
                checked={settings.notify_reservations}
                onCheckedChange={(checked) => updateSetting('notify_reservations', checked)}
                disabled={!masterToggle}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 flex-shrink-0"
              />
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl border-2 border-purple-500/30 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600/20 p-2 rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="font-semibold text-base">Pagos</h3>
              </div>
              <Switch
                checked={settings.notify_payments}
                onCheckedChange={(checked) => updateSetting('notify_payments', checked)}
                disabled={!masterToggle}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 flex-shrink-0"
              />
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl border-2 border-purple-500/30 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600/20 p-2 rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="font-semibold text-base">Proximidad</h3>
              </div>
              <Switch
                checked={settings.notify_proximity}
                onCheckedChange={(checked) => updateSetting('notify_proximity', checked)}
                disabled={!masterToggle}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 flex-shrink-0"
              />
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl border-2 border-purple-500/30 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600/20 p-2 rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="font-semibold text-base">Promociones</h3>
              </div>
              <Switch
                checked={settings.notify_promotions}
                onCheckedChange={(checked) => updateSetting('notify_promotions', checked)}
                disabled={!masterToggle}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 flex-shrink-0"
              />
            </div>
          </div>

          <Link to={createPageUrl('Settings')} className="block pt-2">
            <div className="text-center text-purple-400 underline underline-offset-4">Volver</div>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
```
