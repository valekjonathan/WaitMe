/**
 * Mutations y handlers de usuario — create, buy, map, geocode.
 */
import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import * as alerts from '@/data/alerts';
import * as chat from '@/data/chat';
import * as transactions from '@/data/transactions';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getVisibleActiveSellerAlerts, readHiddenKeys } from '@/lib/alertSelectors';
import { nearbyAlertsKey, alertsPrefix } from '@/lib/alertsQueryKey';
import { getPreciseInitialLocation } from '@/lib/location';
import { formatAddressLocal } from '@/hooks/home/useHomeTransforms';

export function useHomeActions({
  user,
  profile,
  guard,
  myActiveAlerts,
  locationKey,
  mode,
  mapRef,
  setMode,
  setSelectedAlert,
  setShowFilters,
  setConfirmDialog,
  setSearchQuery,
  setUserLocation,
  setSelectedPosition,
  setAddress,
  setViewportBounds,
  setViewportZoom,
  setConfirmPublishOpen,
  setPendingPublishPayload,
  setOneActiveAlertOpen,
  lastGeocodeRef,
  debounceReverseRef,
  selectedPosition,
  address,
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const reverseGeocode = useCallback(
    (lat, lng) => {
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
    },
    [setAddress]
  );

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
    [reverseGeocode, lastGeocodeRef, debounceReverseRef]
  );

  const getCurrentLocation = useCallback(
    async (onReady) => {
      const loc = await getPreciseInitialLocation();
      setUserLocation([loc.lat, loc.lng]);
      setSelectedPosition({ lat: loc.lat, lng: loc.lng });
      reverseGeocode(loc.lat, loc.lng);
      onReady?.({ lat: loc.lat, lng: loc.lng });
    },
    [reverseGeocode, setUserLocation, setSelectedPosition]
  );

  const resetToLogo = useCallback(
    (opts = { invalidate: true }) => {
      setMode(null);
      setSelectedAlert(null);
      setShowFilters(false);
      setConfirmDialog({ open: false, alert: null });
      setSearchQuery('');
      if (opts?.invalidate) queryClient.invalidateQueries();
    },
    [queryClient, setMode, setSelectedAlert, setShowFilters, setConfirmDialog, setSearchQuery]
  );

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
    [debouncedReverseGeocode, setSelectedPosition]
  );
  const handleMapMoveSearch = useCallback(
    (payload) => {
      const center = Array.isArray(payload) ? payload : payload?.center;
      if (!Array.isArray(center) || center.length < 2) return;
      const [lat, lng] = center;
      setUserLocation([lat, lng]);
      if (payload?.bounds) setViewportBounds(payload.bounds);
      if (typeof payload?.zoom === 'number') setViewportZoom(payload.zoom);
    },
    [setUserLocation, setViewportBounds, setViewportZoom]
  );

  const handleRecenter = useCallback(
    (coords) => {
      if (coords?.lat == null || coords?.lng == null) return;
      const { lat, lng } = coords;
      setUserLocation([lat, lng]);
      setSelectedPosition({ lat, lng });
      reverseGeocode(lat, lng);
    },
    [reverseGeocode, setUserLocation, setSelectedPosition]
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
    [mode, mapRef, setUserLocation]
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
    resetToLogo,
    reverseGeocode,
    debouncedReverseGeocode,
    getCurrentLocation,
    createAlertMutation,
    buyAlertMutation,
    handleBuyAlert,
    handleChat,
    handleCall,
    handleBack,
    handleTitleClick,
    handleMapMove,
    handleMapMoveEnd,
    handleMapMoveSearch,
    handleRecenter,
    handleStreetSelect,
  };
}
