/**
 * Datos derivados de alertas — filteredAlerts, searchAlerts, navigateMapAlerts, mapAlertsForNavigate.
 */
import { useMemo } from 'react';
import { haversineKm } from '@/utils/carUtils';
import { readHiddenKeys, getVisibleActiveSellerAlerts } from '@/lib/alertSelectors';
import { useArrivingAnimation } from '@/hooks/useArrivingAnimation';
import { getMockNavigateCars } from '@/lib/mockNavigateCars';

export function useHomeAlerts({
  rawAlerts,
  viewportAlertsRaw,
  myAlerts,
  user,
  mode,
  filters,
  userLocation,
  viewportBoundsKey,
  selectedAlert,
  arrivingAlertId,
  navigateViewState,
}) {
  const myActiveAlerts = useMemo(() => {
    const hiddenKeys = readHiddenKeys();
    return getVisibleActiveSellerAlerts(myAlerts, user?.id, user?.email, hiddenKeys);
  }, [myAlerts, user?.id, user?.email]);

  const reservedAlert = useMemo(
    () => myActiveAlerts.find((a) => String(a.status || '').toLowerCase() === 'reserved'),
    [myActiveAlerts]
  );

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

  return {
    myActiveAlerts,
    reservedAlert,
    filteredAlerts,
    searchAlerts,
    navigateMapAlerts,
    arrivingAlert,
    arrivalMetrics,
    mapAlertsForNavigate,
  };
}
