/**
 * Estado y lógica derivada de la pantalla Navigate.
 * @module hooks/navigate/useNavigateState
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import * as alerts from '@/data/alerts';
import { useAuth } from '@/lib/AuthContext';
import { useLocationEngine } from '@/hooks/useLocationEngine';
import { getMetersBetween } from '@/lib/location';
import { getMockNavigateCars } from '@/lib/mockNavigateCars';
import { haversineKm, getCarFill } from '@/utils/carUtils';

export function getAlertIdFromLocation() {
  const hash = window.location.hash || '';
  const queryString = hash.indexOf('?') >= 0 ? hash.substring(hash.indexOf('?')) : '';
  const fromHash = new URLSearchParams(queryString).get('alertId');
  if (fromHash) return fromHash;
  return new URLSearchParams(window.location.search).get('alertId');
}

export const DEMO_ALERTS = {
  demo_1: {
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
    available_in_minutes: 6,
  },
  demo_2: {
    id: 'demo_2',
    user_name: 'Marco',
    user_photo: 'https://randomuser.me/api/portraits/men/32.jpg',
    user_id: 'seller-2',
    user_email: 'seller2@test.com',
    brand: 'Volkswagen',
    model: 'Golf',
    color: 'negro',
    plate: '5678 HJP',
    address: 'Calle Fray Ceferino, Oviedo',
    latitude: 43.3612,
    longitude: -5.8502,
    phone: '600456789',
    allow_phone_calls: true,
    price: 5,
    available_in_minutes: 10,
  },
  demo_3: {
    id: 'demo_3',
    user_name: 'Nerea',
    user_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
    user_id: 'seller-3',
    user_email: 'seller3@test.com',
    brand: 'Toyota',
    model: 'RAV4',
    color: 'azul',
    plate: '9012 LSR',
    address: 'Calle Campoamor, Oviedo',
    latitude: 43.363,
    longitude: -5.8489,
    phone: '600789012',
    allow_phone_calls: true,
    price: 7,
    available_in_minutes: 14,
  },
  demo_4: {
    id: 'demo_4',
    user_name: 'David',
    user_photo: 'https://randomuser.me/api/portraits/men/19.jpg',
    user_id: 'seller-4',
    user_email: 'seller4@test.com',
    brand: 'Renault',
    model: 'Trafic',
    color: 'gris',
    plate: '3456 JTZ',
    address: 'Plaza de la Escandalera, Oviedo',
    latitude: 43.3609,
    longitude: -5.8501,
    phone: '600234567',
    allow_phone_calls: true,
    price: 4,
    available_in_minutes: 4,
  },
  demo_5: {
    id: 'demo_5',
    user_name: 'Lucía',
    user_photo: 'https://randomuser.me/api/portraits/women/12.jpg',
    user_id: 'seller-5',
    user_email: 'seller5@test.com',
    brand: 'Peugeot',
    model: '208',
    color: 'rojo',
    plate: '7788 MNB',
    address: 'Calle Rosal, Oviedo',
    latitude: 43.3623,
    longitude: -5.8483,
    phone: '600345678',
    allow_phone_calls: true,
    price: 2,
    available_in_minutes: 3,
  },
  demo_6: {
    id: 'demo_6',
    user_name: 'Álvaro',
    user_photo: 'https://randomuser.me/api/portraits/men/61.jpg',
    user_id: 'seller-6',
    user_email: 'seller6@test.com',
    brand: 'Kia',
    model: 'Sportage',
    color: 'verde',
    plate: '2468 GHT',
    address: 'Calle Jovellanos, Oviedo',
    latitude: 43.3615,
    longitude: -5.8505,
    phone: '600567890',
    allow_phone_calls: true,
    price: 6,
    available_in_minutes: 18,
  },
};

export function useNavigateState() {
  const alertId = getAlertIdFromLocation();

  const [user, setUser] = useState(null);
  const { location: engineLocation } = useLocationEngine();
  const [userLocation, setUserLocation] = useState([43.367, -5.844]);
  const [sellerLocation, setSellerLocation] = useState([43.362, -5.849]);
  const [isTracking, setIsTracking] = useState(false);
  const [paymentReleased, setPaymentReleased] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [forceRelease, setForceRelease] = useState(false);
  const [showAbandonWarning, setShowAbandonWarning] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [showCancelWarning, setShowCancelWarning] = useState(false);
  const [routeDistanceKm, setRouteDistanceKm] = useState(null);
  const [routeDurationSec, setRouteDurationSec] = useState(null);
  const [alert, setAlert] = useState(null);

  const animationRef = useRef(null);
  const wasWithin5mRef = useRef(false);
  const hasReleasedPaymentRef = useRef(false);

  const authUser = useAuth().user;

  useEffect(() => {
    if (authUser) setUser(authUser);
  }, [authUser]);

  useEffect(() => {
    if (!isTracking && engineLocation && engineLocation.length >= 2) {
      setUserLocation(engineLocation);
    }
  }, [engineLocation, isTracking]);

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

  useEffect(() => {
    if (alert?.latitude != null && alert?.longitude != null) {
      setSellerLocation([Number(alert.latitude), Number(alert.longitude)]);
    } else if (alert && (sellerLocation == null || sellerLocation.length < 2)) {
      setSellerLocation([43.362, -5.849]);
    }
  }, [alert]);

  useEffect(() => {
    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, []);

  const browseAlerts = useMemo(() => getMockNavigateCars(userLocation), [userLocation]);
  const nearestBrowseAlert = useMemo(() => {
    if (browseAlerts.length === 0) return null;
    const [uLat, uLng] = Array.isArray(userLocation)
      ? userLocation
      : [userLocation?.lat, userLocation?.lng];
    if (uLat == null || uLng == null) return browseAlerts[0];
    const sorted = [...browseAlerts].sort((a, b) => {
      const da = haversineKm(uLat, uLng, a.latitude ?? a.lat, a.longitude ?? a.lng);
      const db = haversineKm(uLat, uLng, b.latitude ?? b.lat, b.longitude ?? b.lng);
      return da - db;
    });
    return sorted[0];
  }, [browseAlerts, userLocation]);

  const distanceMeters = useMemo(() => {
    if (!userLocation || !sellerLocation) return null;
    const m = getMetersBetween(userLocation, sellerLocation);
    return Number.isFinite(m) ? m : null;
  }, [userLocation, sellerLocation]);

  useEffect(() => {
    const sellerHere =
      alert &&
      user &&
      (String(alert.user_id) === String(user?.id) ||
        String(alert.user_email) === String(user?.email));
    if (!alert || sellerHere || paymentReleased) return;
    if (distanceMeters === null) return;
    if (distanceMeters <= 5) {
      wasWithin5mRef.current = true;
      setShowAbandonWarning(false);
    } else if (wasWithin5mRef.current) setShowAbandonWarning(true);
  }, [distanceMeters, alert, user, paymentReleased]);

  const distLabel =
    distanceMeters != null
      ? distanceMeters < 1000
        ? `${Math.round(distanceMeters)} m`
        : `${(distanceMeters / 1000).toFixed(1)} km`
      : '--';

  const etaMinutes = useMemo(() => {
    if (
      distanceMeters == null ||
      distanceMeters <= 0 ||
      !routeDistanceKm ||
      routeDistanceKm <= 0 ||
      !routeDurationSec
    )
      return null;
    const remainingKm = distanceMeters / 1000;
    const speedKmPerSec = routeDistanceKm / routeDurationSec;
    if (!speedKmPerSec) return null;
    return Math.max(1, Math.round(remainingKm / speedKmPerSec / 60));
  }, [distanceMeters, routeDistanceKm, routeDurationSec]);

  const displayAlert = alert;
  const isBrowseMode = !alertId && !alert;
  const displayAlertOrNearest = displayAlert || (isBrowseMode ? nearestBrowseAlert : null);
  const isSeller =
    displayAlert &&
    user &&
    (String(displayAlert.user_id) === String(user?.id) ||
      String(displayAlert.user_email) === String(user?.email));
  const isBuyer =
    displayAlert &&
    user &&
    (String(displayAlert.reserved_by_id) === String(user?.id) ||
      String(displayAlert.reserved_by_email) === String(user?.email));
  const isSellerHere =
    alert &&
    user &&
    (String(alert.user_id) === String(user?.id) ||
      String(alert.user_email) === String(user?.email));

  const sellerName =
    (isBrowseMode
      ? displayAlertOrNearest?.user_name
      : isBuyer
        ? displayAlert?.user_name
        : displayAlert?.reserved_by_name || displayAlert?.user_name || 'Usuario'
    )?.split(' ')[0] || 'Usuario';
  const sellerPhoto = isBrowseMode
    ? displayAlertOrNearest?.user_photo || null
    : isBuyer
      ? displayAlert?.user_photo || null
      : displayAlert?.reserved_by_photo ||
        (displayAlert?.reserved_by_name
          ? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayAlert.reserved_by_name)}&background=7c3aed&color=fff&size=128`
          : null);

  const userCarIcon = displayAlert?.color
    ? `<svg width="20" height="12" viewBox="0 0 48 24" style="position:absolute;bottom:-4px;right:-4px;" fill="none">
        <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill="${getCarFill(displayAlert.color)}" stroke="white" stroke-width="1.5"/>
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

  const sellerCarIcon = (displayAlertOrNearest || displayAlert)?.color
    ? `<svg width="20" height="12" viewBox="0 0 48 24" style="position:absolute;bottom:-4px;right:-4px;" fill="none">
        <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill="${getCarFill((displayAlertOrNearest || displayAlert)?.color)}" stroke="white" stroke-width="1.5"/>
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

  const alertForCard = displayAlertOrNearest
    ? {
        ...displayAlertOrNearest,
        user_name: sellerName,
        user_photo: sellerPhoto,
        brand: isBrowseMode
          ? displayAlertOrNearest.brand
          : isBuyer
            ? displayAlert.brand
            : displayAlert.reserved_by_car?.split(' ')[0] || '',
        model: isBrowseMode
          ? displayAlertOrNearest.model
          : isBuyer
            ? displayAlert.model
            : displayAlert.reserved_by_car?.split(' ').slice(1).join(' ') || '',
        plate: isBrowseMode
          ? displayAlertOrNearest.plate
          : isBuyer
            ? displayAlert.plate
            : displayAlert.reserved_by_plate || '',
        color: isBrowseMode
          ? displayAlertOrNearest.color
          : isBuyer
            ? displayAlert.color
            : displayAlert.reserved_by_car_color || 'gris',
        phone: isBrowseMode ? null : isBuyer ? displayAlert.phone || null : null,
        allow_phone_calls: isBrowseMode ? false : isBuyer ? displayAlert.allow_phone_calls : false,
        wait_until: displayAlertOrNearest.expires_at || displayAlertOrNearest.wait_until,
      }
    : null;

  return {
    alertId,
    user,
    userLocation,
    setUserLocation,
    sellerLocation,
    setSellerLocation,
    isTracking,
    setIsTracking,
    paymentReleased,
    setPaymentReleased,
    showPaymentSuccess,
    setShowPaymentSuccess,
    forceRelease,
    setForceRelease,
    showAbandonWarning,
    setShowAbandonWarning,
    panelCollapsed,
    setPanelCollapsed,
    showCancelWarning,
    setShowCancelWarning,
    setRouteDistanceKm,
    setRouteDurationSec,
    alert,
    animationRef,
    hasReleasedPaymentRef,
    browseAlerts,
    nearestBrowseAlert,
    displayAlert,
    displayAlertOrNearest,
    isBrowseMode,
    isSeller,
    isBuyer,
    isSellerHere,
    sellerName,
    sellerPhoto,
    userMapIcon,
    sellerMapIcon,
    alertForCard,
    distLabel,
    etaMinutes,
  };
}
