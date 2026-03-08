/**
 * Orquestador de Home — compone hooks especializados.
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { useLayoutHeader } from '@/lib/LayoutContext';
import { useAuth } from '@/lib/AuthContext';
import { useProfileGuard } from '@/hooks/useProfileGuard';
import { useMyAlerts } from '@/hooks/useMyAlerts';
import { useLocationEngine } from '@/hooks/useLocationEngine';
import { extractLatLng, getLocationKeyForNearby } from '@/lib/alertsQueryKey';
import { haversineKm } from '@/utils/carUtils';
import { readHiddenKeys, getVisibleActiveSellerAlerts } from '@/lib/alertSelectors';
import { CARS_MOVEMENT_MODE } from '@/stores/carsMovementStore';
import { useHomeQueries } from '@/hooks/home/useHomeQueries';
import { useHomeAlerts } from '@/hooks/home/useHomeAlerts';
import { useHomeDialogs } from '@/hooks/home/useHomeDialogs';
import { useHomeMapState } from '@/hooks/home/useHomeMapState';
import { useHomeEvents } from '@/hooks/home/useHomeEvents';
import { useHomeActions } from '@/hooks/home/useHomeActions';

export function useHome() {
  const { location: engineLocation } = useLocationEngine();
  const { user, profile } = useAuth();
  const { guard } = useProfileGuard(profile);

  const [mode, setMode] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [_searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [navigateViewState, setNavigateViewState] = useState('browse');
  const [arrivingAlertId, setArrivingAlertId] = useState(null);

  const mapRef = useRef(null);
  const modeRef = useRef(mode);
  const debounceReverseRef = useRef(null);
  const lastGeocodeRef = useRef({ lat: null, lng: null });

  const dialogs = useHomeDialogs();
  const mapState = useHomeMapState(mode);

  const locationKey = useMemo(() => {
    const coords = extractLatLng(userLocation);
    return coords ? getLocationKeyForNearby(coords.lat, coords.lng) : null;
  }, [userLocation]);

  const { data: myAlerts = [] } = useMyAlerts();
  const myActiveAlerts = useMemo(() => {
    const hiddenKeys = readHiddenKeys();
    return getVisibleActiveSellerAlerts(myAlerts, user?.id, user?.email, hiddenKeys);
  }, [myAlerts, user?.id, user?.email]);

  const reservedAlert = useMemo(
    () => myActiveAlerts.find((a) => String(a.status || '').toLowerCase() === 'reserved'),
    [myActiveAlerts]
  );

  const queries = useHomeQueries({
    user,
    userLocation,
    locationKey,
    mode,
    viewportBounds: mapState.viewportBounds,
    viewportBoundsKey: mapState.viewportBoundsKey,
    viewportLimit: mapState.viewportLimit,
    reservedAlert,
    carsMode: mapState.carsMode,
  });

  const alerts = useHomeAlerts({
    rawAlerts: queries.rawAlerts,
    viewportAlertsRaw: queries.viewportAlertsRaw,
    myAlerts,
    user,
    mode,
    filters: mapState.filters,
    userLocation,
    viewportBoundsKey: mapState.viewportBoundsKey,
    selectedAlert,
    arrivingAlertId,
    navigateViewState,
  });

  const actions = useHomeActions({
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
    setConfirmDialog: dialogs.setConfirmDialog,
    setSearchQuery,
    setUserLocation,
    setSelectedPosition,
    setAddress,
    setViewportBounds: mapState.setViewportBounds,
    setViewportZoom: mapState.setViewportZoom,
    setConfirmPublishOpen: dialogs.setConfirmPublishOpen,
    setPendingPublishPayload: dialogs.setPendingPublishPayload,
    setOneActiveAlertOpen: dialogs.setOneActiveAlertOpen,
    lastGeocodeRef,
    debounceReverseRef,
    selectedPosition,
    address,
  });

  const setHeader = useLayoutHeader();
  useHomeEvents({
    user,
    mode,
    resetToLogo: actions.resetToLogo,
    setHeader,
    handleBack: actions.handleBack,
    handleTitleClick: actions.handleTitleClick,
  });

  useEffect(() => {
    modeRef.current = mode;
    if (mode === 'create') lastGeocodeRef.current = { lat: null, lng: null };
    if (mode !== 'search') {
      setNavigateViewState('browse');
      setArrivingAlertId(null);
      setSelectedAlert(null);
      mapState.setViewportBounds(null);
      mapState.setViewportZoom(null);
    }
  }, [mode]);

  useEffect(() => {
    if (!engineLocation) return;
    setUserLocation(engineLocation);
    if (modeRef.current !== 'create') {
      setSelectedPosition({ lat: engineLocation[0], lng: engineLocation[1] });
      actions.reverseGeocode(engineLocation[0], engineLocation[1]);
    }
  }, [engineLocation]);

  useEffect(() => {
    if (mode !== 'search' || alerts.navigateMapAlerts.length === 0 || selectedAlert) return;
    const [uLat, uLng] = Array.isArray(userLocation)
      ? userLocation
      : [userLocation?.lat, userLocation?.lng];
    if (uLat == null || uLng == null) return;
    const sorted = [...alerts.navigateMapAlerts].sort((a, b) => {
      const da = haversineKm(uLat, uLng, a.latitude ?? a.lat, a.longitude ?? a.lng);
      const db = haversineKm(uLat, uLng, b.latitude ?? b.lat, b.longitude ?? b.lng);
      return da - db;
    });
    setSelectedAlert(sorted[0]);
  }, [mode, alerts.navigateMapAlerts, userLocation]);

  const waitMeCarBuyerLocation =
    mode === 'create' &&
    mapState.carsMode === CARS_MOVEMENT_MODE.WAITME_ACTIVE &&
    queries.buyerLocationsRaw?.length > 0
      ? {
          lat: queries.buyerLocationsRaw[0].latitude,
          lng: queries.buyerLocationsRaw[0].longitude,
        }
      : null;
  const waitMeCarColor =
    alerts.reservedAlert?.reserved_by_car_color ||
    alerts.reservedAlert?.reserved_by?.color ||
    'azul';

  return {
    mode,
    setMode,
    ...dialogs,
    selectedAlert,
    setSelectedAlert,
    userLocation,
    address,
    setAddress,
    showFilters,
    setShowFilters,
    navigateViewState,
    setNavigateViewState,
    arrivingAlertId,
    setArrivingAlertId,
    contentArea: mapState.contentArea,
    mapRef,
    modeRef,
    engineLocation,
    user,
    profile,
    guard,
    myActiveAlerts,
    carsMode: mapState.carsMode,
    waitMeCarBuyerLocation,
    waitMeCarColor,
    mapAlertsForNavigate: alerts.mapAlertsForNavigate,
    navigateMapAlerts: alerts.navigateMapAlerts,
    searchAlerts: alerts.searchAlerts,
    arrivalMetrics: alerts.arrivalMetrics,
    createAlertMutation: actions.createAlertMutation,
    buyAlertMutation: actions.buyAlertMutation,
    handleBuyAlert: actions.handleBuyAlert,
    handleChat: actions.handleChat,
    handleCall: actions.handleCall,
    handleMapMove: actions.handleMapMove,
    handleMapMoveEnd: actions.handleMapMoveEnd,
    handleMapMoveSearch: actions.handleMapMoveSearch,
    handleRecenter: actions.handleRecenter,
    handleStreetSelect: actions.handleStreetSelect,
    getCurrentLocation: actions.getCurrentLocation,
    onCreateAlert: actions.onCreateAlert,
    filters: mapState.filters,
    setFilters: mapState.setFilters,
  };
}
