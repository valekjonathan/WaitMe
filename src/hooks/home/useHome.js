/**
 * Main Home hook — orquestador de estado, queries, mutations y eventos.
 * Mantiene la lógica fuera de Home.jsx para reducir su tamaño.
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import * as alerts from '@/data/alerts';
import * as chat from '@/data/chat';
import * as notifications from '@/data/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as transactions from '@/data/transactions';
import { useLayoutHeader } from '@/lib/LayoutContext';
import { getVisibleActiveSellerAlerts, readHiddenKeys } from '@/lib/alertSelectors';
import { useAuth } from '@/lib/AuthContext';
import { useProfileGuard } from '@/hooks/useProfileGuard';
import { useMyAlerts } from '@/hooks/useMyAlerts';
import {
  alertsPrefix,
  nearbyAlertsKey,
  viewportAlertsKey,
  getLocationKeyForNearby,
  getBoundsKeyForViewport,
  extractLatLng,
} from '@/lib/alertsQueryKey';
import {
  NEARBY_RADIUS_KM,
  VIEWPORT_ALERTS_LIMIT_LOW_ZOOM,
  VIEWPORT_ALERTS_LIMIT_HIGH_ZOOM,
  ZOOM_VIEWPORT_THRESHOLD,
} from '@/config/alerts';
import { haversineKm } from '@/utils/carUtils';
import { useArrivingAnimation } from '@/hooks/useArrivingAnimation';
import { useLocationEngine } from '@/hooks/useLocationEngine';
import { getPreciseInitialLocation } from '@/lib/location';
import {
  getCarsMovementMode,
  subscribeToCarsMovementMode,
  CARS_MOVEMENT_MODE,
} from '@/stores/carsMovementStore';
import * as userLocations from '@/data/userLocations';
import { getMockNavigateCars, getMockNavigateCarsInBounds } from '@/lib/mockNavigateCars';

function formatAddressLocal(road, number, city) {
  let streetFormatted = (road || '').trim();
  if (streetFormatted.toLowerCase().startsWith('calle ')) {
    streetFormatted = 'C/ ' + streetFormatted.slice(6);
  } else if (streetFormatted.toLowerCase().startsWith('avenida ')) {
    streetFormatted = 'Av. ' + streetFormatted.slice(8);
  }
  const parts = [streetFormatted, number, city].filter(Boolean);
  return parts.length ? parts.join(', ') : '';
}

export function useHome() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const setHeader = useLayoutHeader();
  const { location: engineLocation } = useLocationEngine();

  const [mode, setMode] = useState(null);
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  const [pendingPublishPayload, setPendingPublishPayload] = useState(null);
  const [oneActiveAlertOpen, setOneActiveAlertOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [_searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, alert: null });
  const [navigateViewState, setNavigateViewState] = useState('browse');
  const [arrivingAlertId, setArrivingAlertId] = useState(null);
  const [viewportBounds, setViewportBounds] = useState(null);
  const [viewportZoom, setViewportZoom] = useState(null);
  const [filters, setFilters] = useState({
    maxPrice: 10,
    maxMinutes: 30,
    maxDistance: 10,
  });
  const [contentArea, setContentArea] = useState({ top: 0, height: 0 });

  const mapRef = useRef(null);
  const modeRef = useRef(mode);
  const debounceReverseRef = useRef(null);
  const lastGeocodeRef = useRef({ lat: null, lng: null });

  const { user, profile } = useAuth();
  const { guard } = useProfileGuard(profile);

  useEffect(() => {
    modeRef.current = mode;
    if (mode === 'create') lastGeocodeRef.current = { lat: null, lng: null };
    if (mode !== 'search') {
      setNavigateViewState('browse');
      setArrivingAlertId(null);
      setSelectedAlert(null);
      setViewportBounds(null);
      setViewportZoom(null);
    }
  }, [mode]);

  useEffect(() => {
    if (!mode) return;
    const measure = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const header = document.querySelector('[data-waitme-header]');
          const nav = document.querySelector('[data-waitme-nav]');
          if (!header || !nav) return;
          const headerRect = header.getBoundingClientRect();
          const navRect = nav.getBoundingClientRect();
          setContentArea({ top: headerRect.bottom, height: navRect.top - headerRect.bottom });
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

  useEffect(() => {
    const goLogo = () => resetToLogo({ invalidate: true });
    window.addEventListener('waitme:goLogo', goLogo);
    return () => window.removeEventListener('waitme:goLogo', goLogo);
  }, [resetToLogo]);

  useEffect(() => {
    if (!user?.id) return;
    const unsub = notifications.subscribeNotifications(user.id, () => {
      queryClient.invalidateQueries({ queryKey: ['unreadCount', user.id] });
    });
    return unsub;
  }, [user?.id, queryClient]);

  useQuery({
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

  useEffect(() => {
    const unsub = alerts.subscribeAlerts({
      onUpsert: () => {
        queryClient.invalidateQueries({ queryKey: ['alerts', 'nearby'] });
        queryClient.invalidateQueries({ queryKey: ['alerts', 'viewport'] });
      },
      onDelete: () => {
        queryClient.invalidateQueries({ queryKey: ['alerts', 'nearby'] });
        queryClient.invalidateQueries({ queryKey: ['alerts', 'viewport'] });
      },
    });
    return unsub;
  }, [queryClient]);

  const viewportLimit = useMemo(() => {
    const zoom = viewportZoom;
    if (zoom == null) return VIEWPORT_ALERTS_LIMIT_HIGH_ZOOM;
    return zoom < ZOOM_VIEWPORT_THRESHOLD
      ? VIEWPORT_ALERTS_LIMIT_LOW_ZOOM
      : VIEWPORT_ALERTS_LIMIT_HIGH_ZOOM;
  }, [viewportZoom]);

  const viewportBoundsKey = useMemo(
    () => (viewportBounds ? getBoundsKeyForViewport(viewportBounds) : null),
    [viewportBounds]
  );

  const { data: viewportAlertsRaw = [] } = useQuery({
    queryKey: viewportAlertsKey(viewportBoundsKey, viewportLimit),
    enabled: mode === 'search' && !!viewportBoundsKey,
    queryFn: async () => {
      const { swLat, swLng, neLat, neLng } = viewportBounds;
      const { data, error } = await alerts.getAlertsInBounds(swLat, swLng, neLat, neLng, {
        limit: viewportLimit,
      });
      if (error) {
        console.warn('[getAlertsInBounds]', error);
        return [];
      }
      if (data?.length > 0) return data;
      return getMockNavigateCarsInBounds(viewportBounds, viewportLimit);
    },
    staleTime: 10_000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: false,
    placeholderData: (prev) => prev,
  });

  const { data: myAlerts = [] } = useMyAlerts();

  const myActiveAlerts = useMemo(() => {
    const hiddenKeys = readHiddenKeys();
    return getVisibleActiveSellerAlerts(myAlerts, user?.id, user?.email, hiddenKeys);
  }, [myAlerts, user?.id, user?.email]);

  const reservedAlert = useMemo(
    () => myActiveAlerts.find((a) => String(a.status || '').toLowerCase() === 'reserved'),
    [myActiveAlerts]
  );

  const [carsMode, setCarsMode] = useState(getCarsMovementMode);
  useEffect(() => {
    return subscribeToCarsMovementMode(setCarsMode);
  }, []);

  const { data: buyerLocationsRaw = [] } = useQuery({
    queryKey: ['buyerLocations', reservedAlert?.id],
    queryFn: () => userLocations.getLocationsByAlert(reservedAlert.id),
    enabled:
      !!reservedAlert?.id && mode === 'create' && carsMode === CARS_MOVEMENT_MODE.WAITME_ACTIVE,
    refetchInterval:
      mode === 'create' && carsMode === CARS_MOVEMENT_MODE.WAITME_ACTIVE ? 5000 : false,
  });

  const waitMeCarBuyerLocation =
    mode === 'create' &&
    carsMode === CARS_MOVEMENT_MODE.WAITME_ACTIVE &&
    buyerLocationsRaw?.length > 0
      ? {
          lat: buyerLocationsRaw[0].latitude,
          lng: buyerLocationsRaw[0].longitude,
        }
      : null;
  const waitMeCarColor =
    reservedAlert?.reserved_by_car_color || reservedAlert?.reserved_by?.color || 'azul';

  useEffect(() => {
    if (!user?.id && !user?.email) return;
    queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
  }, [user?.id, user?.email, queryClient]);

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
            formatAddressLocal(road, number, city) || data.display_name?.split(',')[0] || '';
          if (result) setAddress(result);
        }
      })
      .catch((error) => {
        console.error('[WaitMe Error]', error);
      });
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

  const navigateMapAlerts = useMemo(() => {
    if (mode !== 'search') return [];
    if (viewportBoundsKey && viewportAlertsRaw?.length > 0) {
      const list = [...viewportAlertsRaw];
      if (selectedAlert && !list.some((a) => a?.id === selectedAlert?.id)) {
        list.push(selectedAlert);
      }
      return list;
    }
    return getMockNavigateCars(userLocation);
  }, [mode, userLocation, viewportBoundsKey, viewportAlertsRaw, selectedAlert]);

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
      queryClient.setQueryData(nearbyAlertsKey(locationKey), (old) => {
        const list = Array.isArray(old) ? old : old?.data || [];
        return [newAlert, ...list.filter((a) => !a.id?.startsWith('temp_'))];
      });
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
      } catch (error) {
        console.error('[WaitMe Error]', error);
      }
      setConfirmPublishOpen(false);
      setPendingPublishPayload(null);
      navigate('/alerts');
    },
    onError: (error) => {
      if (error?.message === 'ALREADY_HAS_ALERT') {
        setConfirmPublishOpen(false);
        setPendingPublishPayload(null);
        setOneActiveAlertOpen(true);
        return;
      }
      queryClient.invalidateQueries({ queryKey: alertsPrefix });
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
    },
  });

  const buyAlertMutation = useMutation({
    mutationFn: async (alert) => {
      if (alert?.is_demo) return { demo: true };
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
      } catch (error) {
        console.error('[WaitMe Error]', error);
      }
    },
  });

  const handleBuyAlert = (alert) => {
    guard(() => setConfirmDialog({ open: true, alert }));
  };

  const handleChat = () => navigate(createPageUrl('History'));
  const handleCall = () => navigate(createPageUrl('History'));

  const handleBack = useCallback(() => resetToLogo({ invalidate: false }), [resetToLogo]);
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

  const handleMapMove = useCallback(() => {}, []);
  const handleMapMoveEnd = useCallback(
    (payload) => {
      const center = Array.isArray(payload) ? payload : payload?.center;
      if (!Array.isArray(center) || center.length < 2) return;
      const [lat, lng] = center;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;
      setSelectedPosition({ lat, lng });
      debouncedReverseGeocode(lat, lng);
    },
    [debouncedReverseGeocode]
  );
  const handleMapMoveSearch = useCallback((payload) => {
    const center = Array.isArray(payload) ? payload : payload?.center;
    if (!Array.isArray(center) || center.length < 2) return;
    const [lat, lng] = center;
    setUserLocation([lat, lng]);
    if (payload?.bounds) setViewportBounds(payload.bounds);
    if (typeof payload?.zoom === 'number') setViewportZoom(payload.zoom);
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

  const onCreateAlert = useCallback(
    async (data) => {
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
      } catch (error) {
        console.error('[WaitMe Error]', error);
      }
      setPendingPublishPayload(payload);
      setConfirmPublishOpen(true);
    },
    [
      selectedPosition,
      address,
      user,
      profile,
      myActiveAlerts,
      setOneActiveAlertOpen,
      setPendingPublishPayload,
      setConfirmPublishOpen,
    ]
  );

  return {
    mode,
    setMode,
    confirmPublishOpen,
    setConfirmPublishOpen,
    pendingPublishPayload,
    setPendingPublishPayload,
    oneActiveAlertOpen,
    setOneActiveAlertOpen,
    selectedAlert,
    setSelectedAlert,
    userLocation,
    setUserLocation,
    selectedPosition,
    address,
    setAddress,
    showFilters,
    setShowFilters,
    confirmDialog,
    setConfirmDialog,
    navigateViewState,
    setNavigateViewState,
    arrivingAlertId,
    setArrivingAlertId,
    viewportBounds,
    setViewportBounds,
    viewportZoom,
    filters,
    setFilters,
    contentArea,
    mapRef,
    modeRef,
    engineLocation,
    user,
    profile,
    guard,
    myActiveAlerts,
    carsMode,
    waitMeCarBuyerLocation,
    waitMeCarColor,
    mapAlertsForNavigate,
    navigateMapAlerts,
    searchAlerts,
    arrivalMetrics,
    createAlertMutation,
    buyAlertMutation,
    handleBuyAlert,
    handleChat,
    handleCall,
    handleMapMove,
    handleMapMoveEnd,
    handleMapMoveSearch,
    handleRecenter,
    handleStreetSelect,
    getCurrentLocation,
    onCreateAlert,
  };
}
