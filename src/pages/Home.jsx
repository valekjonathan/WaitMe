import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import * as alerts from '@/data/alerts';
import * as chat from '@/data/chat';
import * as notifications from '@/data/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as transactions from '@/data/transactions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, MapPin, Clock, Euro, X } from 'lucide-react';
import { useLayoutHeader } from '@/lib/LayoutContext';
import MapboxMap from '@/components/MapboxMap';
import CreateMapOverlay from '@/components/CreateMapOverlay';
import SearchMapOverlay from '@/components/SearchMapOverlay';
import MapViewportShell from '@/system/map/MapViewportShell';
import { getMockNavigateCars } from '@/lib/mockNavigateCars';
import MapFilters from '@/components/map/MapFilters';
import UserAlertCard from '@/components/cards/UserAlertCard';
import { getVisibleActiveSellerAlerts, readHiddenKeys } from '@/lib/alertSelectors';
import { useAuth } from '@/lib/AuthContext';
import { useProfileGuard } from '@/hooks/useProfileGuard';
import { useMyAlerts } from '@/hooks/useMyAlerts';
import {
  alertsPrefix,
  nearbyAlertsKey,
  getLocationKeyForNearby,
  extractLatLng,
} from '@/lib/alertsQueryKey';
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
import { useArrivingAnimation } from '@/hooks/useArrivingAnimation';
import { useLocationEngine } from '@/hooks/useLocationEngine';
import { getPreciseInitialLocation } from '@/lib/location';
import { getMapLayoutPadding } from '@/lib/mapLayoutPadding';

// DEV kill switch: disable map (render simple block instead)
const isMapDisabled = () => import.meta.env.DEV && import.meta.env.VITE_DISABLE_MAP === 'true';

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
const CarIconProfile = ({ color, size = 'w-16 h-10' }) => (
  <svg viewBox="0 0 48 24" className={size} fill="none">
    {/* Cuerpo del coche - vista lateral */}
    <path
      d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
      fill={color}
      stroke="white"
      strokeWidth="1.5"
    />

    {/* Ventanas */}
    <path
      d="M16 9 L18 12 L30 12 L32 9 Z"
      fill="rgba(255,255,255,0.3)"
      stroke="white"
      strokeWidth="0.5"
    />
    {/* Rueda trasera */}
    <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
    <circle cx="14" cy="18" r="2" fill="#666" />
    {/* Rueda delantera */}
    <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
    <circle cx="36" cy="18" r="2" fill="#666" />
  </svg>
);

const MagnifierIconProfile = ({ color = '#8b5cf6', size = 'w-14 h-14' }) => (
  <svg viewBox="0 0 48 48" className={size} fill="none">
    {/* Lente */}
    <circle cx="20" cy="20" r="12" fill={color} stroke="white" strokeWidth="1.5" />
    {/* Brillo */}
    <path
      d="M15 16 C16 13, 18 12, 21 12"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Mango */}
    <path d="M28 28 L38 38" stroke="white" strokeWidth="4" strokeLinecap="round" />
    {/* Tope mango */}
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
  const { location: engineLocation } = useLocationEngine();
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [_searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, alert: null });

  // Navigate: browse | arriving
  const [navigateViewState, setNavigateViewState] = useState('browse');
  const [arrivingAlertId, setArrivingAlertId] = useState(null);

  const [filters, setFilters] = useState({
    maxPrice: 10,
    maxMinutes: 30,
    maxDistance: 10,
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
    if (mode !== 'search') {
      setNavigateViewState('browse');
      setArrivingAlertId(null);
      setSelectedAlert(null);
    }
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
  const resetToLogo = useCallback(
    (opts = { invalidate: true }) => {
      setMode(null);
      setSelectedAlert(null);
      setShowFilters(false);
      setConfirmDialog({ open: false, alert: null });
      setSearchQuery('');
      if (opts?.invalidate) queryClient.invalidateQueries();
    },
    [queryClient]
  );

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

  const { data: _unreadCount } = useQuery({
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
    refetchOnMount: false,
  });

  const { data: rawAlerts } = useQuery({
    queryKey: nearbyAlertsKey(locationKey),
    enabled: !!locationKey,
    queryFn: async () => {
      const coords = extractLatLng(userLocation);
      if (!coords) return [];
      const { data, error } = await alerts.getNearbyAlerts(
        coords.lat,
        coords.lng,
        NEARBY_RADIUS_KM
      );
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
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=19&addressdetails=1`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data?.address) {
          const a = data.address;
          const road =
            a.road || a.pedestrian || a.footway || a.path || a.street || a.cycleway || '';
          const number = a.house_number || '';
          const city = a.city || a.town || a.village || a.municipality || '';
          const result =
            formatAddress(road, number, city) || data.display_name?.split(',')[0] || '';
          if (result) setAddress(result);
        }
      })
      .catch(() => {});
  }, []);

  const debouncedReverseGeocode = useCallback(
    (lat, lng) => {
      const prev = lastGeocodeRef.current;
      const same =
        prev.lat != null &&
        prev.lng != null &&
        Math.abs(prev.lat - lat) < 1e-6 &&
        Math.abs(prev.lng - lng) < 1e-6;
      if (same) return;
      lastGeocodeRef.current = { lat, lng };
      if (debounceReverseRef.current) clearTimeout(debounceReverseRef.current);
      debounceReverseRef.current = setTimeout(() => {
        reverseGeocode(lat, lng);
        debounceReverseRef.current = null;
      }, 150);
    },
    [reverseGeocode]
  );

  // One-shot: usado al pulsar mirilla. Usa posición precisa (sin pipeline).
  const getCurrentLocation = useCallback(
    async (onReady) => {
      const loc = await getPreciseInitialLocation();
      setUserLocation([loc.lat, loc.lng]);
      setSelectedPosition({ lat: loc.lat, lng: loc.lng });
      reverseGeocode(loc.lat, loc.lng);
      onReady?.({ lat: loc.lat, lng: loc.lng });
    },
    [reverseGeocode]
  );

  // Ubicación desde motor único — sustituye watchPosition duplicado
  useEffect(() => {
    if (!engineLocation) return;
    setUserLocation(engineLocation);
    if (modeRef.current !== 'create') {
      setSelectedPosition({ lat: engineLocation[0], lng: engineLocation[1] });
      reverseGeocode(engineLocation[0], engineLocation[1]);
    }
  }, [engineLocation, reverseGeocode]);

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

  // Modo navigate: 20 coches mock dispersos en radio pequeño. Home/create: sin coches.
  const navigateMapAlerts = useMemo(() => {
    if (mode !== 'search') return [];
    return getMockNavigateCars(userLocation);
  }, [mode, userLocation]);

  // Al entrar en search: seleccionar coche más cercano por defecto
  useEffect(() => {
    if (mode !== 'search' || navigateMapAlerts.length === 0 || selectedAlert) return;
    const [uLat, uLng] = Array.isArray(userLocation)
      ? userLocation
      : [userLocation?.lat, userLocation?.lng];
    if (uLat == null || uLng == null) return;
    const sorted = [...navigateMapAlerts].sort((a, b) => {
      const da = haversineKm(uLat, uLng, a.latitude ?? a.lat, a.longitude ?? a.lng);
      const db = haversineKm(uLat, uLng, b.latitude ?? b.lat, b.longitude ?? b.lng);
      return da - db;
    });
    setSelectedAlert(sorted[0]);
  }, [mode, navigateMapAlerts, userLocation]);

  const arrivingAlert = useMemo(
    () => (arrivingAlertId ? navigateMapAlerts.find((a) => a.id === arrivingAlertId) : null),
    [arrivingAlertId, navigateMapAlerts]
  );
  const { position: arrivingCarPosition, metrics: arrivalMetrics } = useArrivingAnimation(
    arrivingAlert,
    userLocation,
    navigateViewState === 'arriving' && !!arrivingAlert
  );

  // Alerts para el mapa: browse = 20 coches, arriving = solo el coche en movimiento
  const mapAlertsForNavigate = useMemo(() => {
    if (mode !== 'search') return [];
    if (navigateViewState === 'arriving' && arrivingAlert && arrivingCarPosition) {
      return [
        {
          ...arrivingAlert,
          latitude: arrivingCarPosition.lat,
          longitude: arrivingCarPosition.lng,
          lat: arrivingCarPosition.lat,
          lng: arrivingCarPosition.lng,
        },
      ];
    }
    return navigateMapAlerts;
  }, [mode, navigateViewState, arrivingAlert, arrivingCarPosition, navigateMapAlerts]);

  const createAlertMutation = useMutation({
    mutationFn: async (data) => {
      // Fast check from cache — same selector as HistorySellerView visibleActiveAlerts
      if (myActiveAlerts && myActiveAlerts.length > 0) {
        throw new Error('ALREADY_HAS_ALERT');
      }

      const uid = user?.id;
      const email = user?.email;

      if (uid || email) {
        const { data: mine = [] } = uid ? await alerts.getMyAlerts(uid) : { data: [] };

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
        created_date: new Date().toISOString(),
      };

      queryClient.setQueryData(['myAlerts'], (old) => {
        const list = Array.isArray(old) ? old : old?.data || [];
        return [instantAlert, ...list];
      });

      window.dispatchEvent(new Event('waitme:badgeRefresh'));
    },

    onSuccess: (newAlert) => {
      // Update optimista sobre nearby (mapa)
      queryClient.setQueryData(nearbyAlertsKey(locationKey), (old) => {
        const list = Array.isArray(old) ? old : old?.data || [];
        return [newAlert, ...list.filter((a) => !a.id?.startsWith('temp_'))];
      });
      // Invalida el prefijo para refrescar todas las variantes
      queryClient.invalidateQueries({ queryKey: alertsPrefix });

      queryClient.setQueryData(['myAlerts'], (old) => {
        const list = Array.isArray(old) ? old : old?.data || [];
        return [newAlert, ...list.filter((a) => !a.id?.startsWith('temp_'))];
      });

      try {
        window.dispatchEvent(new Event('waitme:badgeRefresh'));
        window.dispatchEvent(
          new CustomEvent('waitme:alertPublished', { detail: { alertId: newAlert?.id || null } })
        );
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
    },
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

      const { data: _reservedAlert, error: reserveErr } = await alerts.reserveAlert(
        alert.id,
        user?.id,
        {
          reserved_by_name: buyerName,
          reserved_by_car: `${buyerCarBrand} ${buyerCarModel}`.trim(),
          reserved_by_car_color: buyerCarColor,
          reserved_by_plate: buyerPlate,
          reserved_by_vehicle_type: buyerVehicleType,
        }
      );
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
        status: 'pending',
      });
      if (txRes.error) throw txRes.error;

      const { data: conv } = await chat.createConversation({
        buyerId: user?.id,
        sellerId: alert.user_id || alert.seller_id || alert.created_by,
        alertId: alert.id,
      });
      if (conv?.id) {
        await chat.sendMessage({
          conversationId: conv.id,
          senderId: user?.id,
          body: 'Ey! Te he enviado un WaitMe!',
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
        const list = Array.isArray(old) ? old : old?.data || [];
        return list.map((a) =>
          a.id === alert.id ? { ...a, status: 'reserved', reserved_by_id: user?.id } : a
        );
      });

      return { previousAlerts, activeKey };
    },
    onError: (err, alert, context) => {
      if (context?.previousAlerts !== undefined) {
        queryClient.setQueryData(
          context.activeKey ?? nearbyAlertsKey(locationKey),
          context.previousAlerts
        );
      }
      if (err?.message === 'ALREADY_RESERVED' || err?.code === 'ALREADY_RESERVED') {
        queryClient.invalidateQueries({ queryKey: ['alerts', 'nearby'] });
      }
      setSelectedAlert(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: alertsPrefix });
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
      try {
        window.dispatchEvent(new Event('waitme:badgeRefresh'));
      } catch {}
    },
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

  const handleMapMoveEnd = useCallback(
    (center) => {
      if (!Array.isArray(center) || center.length < 2) return;
      const [lat, lng] = center;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;
      setSelectedPosition({ lat, lng });
      debouncedReverseGeocode(lat, lng);
    },
    [debouncedReverseGeocode]
  );

  const handleMapMoveSearch = useCallback((center) => {
    const [lat, lng] = center;
    setUserLocation([lat, lng]);
  }, []);

  const handleRecenter = useCallback(
    (coords) => {
      if (coords?.lat == null || coords?.lng == null) return;
      const { lat, lng } = coords;
      setUserLocation([lat, lng]);
      setSelectedPosition({ lat, lng });
      reverseGeocode(lat, lng);
    },
    [reverseGeocode]
  );

  const handleStreetSelect = useCallback(
    (result) => {
      if (result?.lng == null || result?.lat == null) return;
      const { lng, lat } = result;
      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: 17,
        pitch: 30,
        duration: 600,
      });
      if (mode === 'search') {
        setUserLocation([lat, lng]);
      }
    },
    [mode]
  );

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
      <MapViewportShell
        mode={mode || 'home'}
        mapNode={
          <MapboxMap
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
            alerts={!mode || mode === 'create' ? [] : mapAlertsForNavigate}
            mapRef={mapRef}
            locationFromEngine={engineLocation ?? userLocation ?? null}
            suppressInternalWatcher
            interactive={!!mode}
            onMapLoad={(map) => {
              mapRef.current = map;
            }}
            skipAutoFlyWhenCenterPin={mode === 'create'}
            onAlertClick={(alert) => {
              setMode('search');
              setSelectedAlert(alert);
            }}
            useCenterPin={mode === 'create' || mode === 'search'}
            centerPinFromOverlay={mode === 'create' || mode === 'search'}
            centerPaddingBottom={mode === 'create' || mode === 'search' ? 280 : 0}
            onMapMove={mode === 'create' ? handleMapMove : undefined}
            onMapMoveEnd={
              mode === 'create'
                ? handleMapMoveEnd
                : mode === 'search'
                  ? handleMapMoveSearch
                  : undefined
            }
          />
        }
        panel={
          mode === 'create' ? (
            <CreateMapOverlay
              address={address}
              onAddressChange={setAddress}
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
                  user_name:
                    currentUser?.full_name?.split(' ')[0] || currentUser?.display_name || 'Usuario',
                  user_photo: currentUser?.photo_url || null,
                  brand: currentUser?.brand || 'Sin marca',
                  model: currentUser?.model || 'Sin modelo',
                  color: currentUser?.color || 'gris',
                  plate: currentUser?.plate || '0000XXX',
                  phone: currentUser?.phone || null,
                  allow_phone_calls: currentUser?.allow_phone_calls || false,
                  vehicle_type: currentUser?.vehicle_type || profile?.vehicle_type || 'car',
                  vehicle_color:
                    currentUser?.vehicle_color ||
                    profile?.vehicle_color ||
                    currentUser?.color ||
                    profile?.color ||
                    'gray',
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
          ) : mode === 'search' ? (
            <SearchMapOverlay
              onStreetSelect={handleStreetSelect}
              mapRef={mapRef}
              navigateViewState={navigateViewState}
              arrivalMetrics={arrivalMetrics}
              filtersButton={
                !showFilters && (
                  <Button
                    onClick={() => setShowFilters(true)}
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9 rounded-lg border border-purple-500/50 text-white bg-purple-600/50 hover:bg-purple-600/70"
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
                        alertsCount={
                          mode === 'search' ? navigateMapAlerts.length : searchAlerts.length
                        }
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
                  onStartArriving={(a) => {
                    setNavigateViewState('arriving');
                    setArrivingAlertId(a?.id ?? null);
                  }}
                  isLoading={buyAlertMutation.isPending}
                  userLocation={userLocation}
                  showArrivingButton={navigateViewState === 'browse' && !!selectedAlert}
                />
              }
            />
          ) : null
        }
      />

      {/* En modo create/search: sin scroll. En home: absolute para no empujar layout */}
      <div
        className={`z-10 flex flex-col ${mode ? 'h-0 overflow-hidden pointer-events-none' : 'absolute inset-0 pointer-events-none'}`}
        style={mode ? { pointerEvents: 'none' } : undefined}
      >
        <main
          className={`flex-1 flex flex-col relative overflow-hidden min-h-0 ${mode ? 'pointer-events-none' : ''}`}
        >
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
                    <MagnifierIconProfile color="#8b5cf6" size="w-14 h-14" />¿ Dónde quieres aparcar
                    ?
                  </Button>

                  <Button
                    onClick={() =>
                      guard(() => {
                        getCurrentLocation((loc) => {
                          if (modeRef.current === 'create' && mapRef.current) {
                            const padding = getMapLayoutPadding() ?? {
                              top: 69,
                              bottom: 300,
                              left: 0,
                              right: 0,
                            };
                            mapRef.current.easeTo?.({
                              center: [loc.lng, loc.lat],
                              zoom: 17,
                              duration: 800,
                              padding,
                            });
                          }
                        });
                        setMode('create');
                      })
                    }
                    className="w-full h-20 bg-purple-600 hover:bg-purple-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-4 [&_svg]:!w-20 [&_svg]:!h-14"
                  >
                    <CarIconProfile color="#000000" size="w-20 h-14" />¡ Estoy aparcado aquí !
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

                <span className="text-gray-400 text-sm">No puedes tener 2 alertas activas.</span>
              </div>
            </div>
          </div>
        )}

        <Dialog
          open={confirmPublishOpen}
          onOpenChange={(open) => {
            setConfirmPublishOpen(open);
            if (!open) setPendingPublishPayload(null);
          }}
        >
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
                  hour12: false,
                });
                return (
                  <>
                    <span className="text-purple-400 text-base font-normal">
                      Debes esperar hasta las:{' '}
                      <span className="text-white" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        {hhmm}
                      </span>
                    </span>
                  </>
                );
              })()}
            </div>

            {/* Aviso legal */}
            <p className="text-white/60 text-xs text-center mt-3 px-1 leading-snug">
              Si te vas antes de que finalice el tiempo, se suspenderá 24 horas tu servicio de
              publicación de alertas y tendrás una penalización adicional de un 33% en tu próximo
              ingreso.
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

        <Dialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ open, alert: confirmDialog.alert })}
        >
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
                Matrícula:{' '}
                <span className="text-white font-mono">{confirmDialog.alert?.plate}</span>
              </p>
              <p className="text-sm text-gray-400">
                Se va en:{' '}
                <span className="text-purple-400">
                  {confirmDialog.alert?.available_in_minutes} min
                </span>
              </p>
            </div>

            <DialogFooter className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmDialog({ open: false, alert: null })}
                className="flex-1 border-gray-700"
              >
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
