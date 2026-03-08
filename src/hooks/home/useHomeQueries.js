/**
 * Queries de Home — nearby, viewport, myAlerts, buyerLocations, unreadCount.
 */
import * as alerts from '@/data/alerts';
import * as notifications from '@/data/notifications';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  nearbyAlertsKey,
  viewportAlertsKey,
  getLocationKeyForNearby,
  getBoundsKeyForViewport,
  extractLatLng,
} from '@/lib/alertsQueryKey';
import { NEARBY_RADIUS_KM } from '@/config/alerts';
import * as userLocations from '@/data/userLocations';
import { getMockNavigateCarsInBounds } from '@/lib/mockNavigateCars';
import { CARS_MOVEMENT_MODE } from '@/stores/carsMovementStore';

export function useHomeQueries({
  user,
  userLocation,
  locationKey,
  mode,
  viewportBounds,
  viewportBoundsKey,
  viewportLimit,
  reservedAlert,
  carsMode,
}) {
  const queryClient = useQueryClient();

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

  const { data: buyerLocationsRaw = [] } = useQuery({
    queryKey: ['buyerLocations', reservedAlert?.id],
    queryFn: () => userLocations.getLocationsByAlert(reservedAlert.id),
    enabled:
      !!reservedAlert?.id && mode === 'create' && carsMode === CARS_MOVEMENT_MODE.WAITME_ACTIVE,
    refetchInterval:
      mode === 'create' && carsMode === CARS_MOVEMENT_MODE.WAITME_ACTIVE ? 5000 : false,
  });

  return {
    rawAlerts,
    viewportAlertsRaw,
    buyerLocationsRaw,
    queryClient,
  };
}
