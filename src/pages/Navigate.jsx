import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigation, Phone, MessageCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ParkingMap from '@/components/map/ParkingMap';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import { motion } from 'framer-motion';
import { finalize, OUTCOME } from '@/lib/transactionEngine';

function getAlertIdFromLocation() {
  const hash = window.location.hash || '';
  const queryString = hash.indexOf('?') >= 0 ? hash.substring(hash.indexOf('?')) : '';
  const fromHash = new URLSearchParams(queryString).get('alertId');
  if (fromHash) return fromHash;
  return new URLSearchParams(window.location.search).get('alertId');
}

export default function Navigate() {
  const alertId = getAlertIdFromLocation();
  
  const [user, setUser] = useState(null);
  // UBICACIONES FICTICIAS PARA DEMO - Usuario está a 500m del vendedor
  const [userLocation, setUserLocation] = useState([43.3670, -5.8440]); // 500m al norte
  const [sellerLocation, setSellerLocation] = useState([43.3620, -5.8490]); // Ubicación de Sofía
  const [isTracking, setIsTracking] = useState(false);
  const [paymentReleased, setPaymentReleased] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [forceRelease, setForceRelease] = useState(false);
  const [showAbandonWarning, setShowAbandonWarning] = useState(false);
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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Error:', error);
      }
    };
    fetchUser();
  }, []);

  // Obtener alerta - INSTANTÁNEO
  const [alert, setAlert] = useState(null);
  
  useEffect(() => {
    const demoAlerts = {
      'demo_1': {
        id: 'demo_1',
        user_name: 'Sofía',
        user_photo: 'https://randomuser.me/api/portraits/women/44.jpg',
        user_id: 'seller-1',
        user_email: 'seller1@test.com',
        car_brand: 'SEAT',
        car_model: 'Ibiza',
        car_color: 'blanco',
        car_plate: '1234 KLM',
        address: 'Calle Uría, Oviedo',
        latitude: 43.3629,
        longitude: -5.8488,
        phone: '600123123',
        allow_phone_calls: true,
        price: 3,
        available_in_minutes: 6
      },
      'demo_2': {
        id: 'demo_2',
        user_name: 'Marco',
        user_photo: 'https://randomuser.me/api/portraits/men/32.jpg',
        user_id: 'seller-2',
        user_email: 'seller2@test.com',
        car_brand: 'Volkswagen',
        car_model: 'Golf',
        car_color: 'negro',
        car_plate: '5678 HJP',
        address: 'Calle Fray Ceferino, Oviedo',
        latitude: 43.3612,
        longitude: -5.8502,
        phone: '600456789',
        allow_phone_calls: true,
        price: 5,
        available_in_minutes: 10
      },
      'demo_3': {
        id: 'demo_3',
        user_name: 'Nerea',
        user_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
        user_id: 'seller-3',
        user_email: 'seller3@test.com',
        car_brand: 'Toyota',
        car_model: 'RAV4',
        car_color: 'azul',
        car_plate: '9012 LSR',
        address: 'Calle Campoamor, Oviedo',
        latitude: 43.363,
        longitude: -5.8489,
        phone: '600789012',
        allow_phone_calls: true,
        price: 7,
        available_in_minutes: 14
      },
      'demo_4': {
        id: 'demo_4',
        user_name: 'David',
        user_photo: 'https://randomuser.me/api/portraits/men/19.jpg',
        user_id: 'seller-4',
        user_email: 'seller4@test.com',
        car_brand: 'Renault',
        car_model: 'Trafic',
        car_color: 'gris',
        car_plate: '3456 JTZ',
        address: 'Plaza de la Escandalera, Oviedo',
        latitude: 43.3609,
        longitude: -5.8501,
        phone: '600234567',
        allow_phone_calls: true,
        price: 4,
        available_in_minutes: 4
      },
      'demo_5': {
        id: 'demo_5',
        user_name: 'Lucía',
        user_photo: 'https://randomuser.me/api/portraits/women/12.jpg',
        user_id: 'seller-5',
        user_email: 'seller5@test.com',
        car_brand: 'Peugeot',
        car_model: '208',
        car_color: 'rojo',
        car_plate: '7788 MNB',
        address: 'Calle Rosal, Oviedo',
        latitude: 43.3623,
        longitude: -5.8483,
        phone: '600345678',
        allow_phone_calls: true,
        price: 2,
        available_in_minutes: 3
      },
      'demo_6': {
        id: 'demo_6',
        user_name: 'Álvaro',
        user_photo: 'https://randomuser.me/api/portraits/men/61.jpg',
        user_id: 'seller-6',
        user_email: 'seller6@test.com',
        car_brand: 'Kia',
        car_model: 'Sportage',
        car_color: 'verde',
        car_plate: '2468 GHT',
        address: 'Calle Jovellanos, Oviedo',
        latitude: 43.3615,
        longitude: -5.8505,
        phone: '600567890',
        allow_phone_calls: true,
        price: 6,
        available_in_minutes: 18
      }
    };

    if (demoAlerts[alertId]) {
      setAlert(demoAlerts[alertId]);
      return;
    }
    
    // Buscar alerta real en BD
    const fetchAlert = async () => {
      try {
        const alerts = await base44.entities.ParkingAlert.filter({ id: alertId });
        if (alerts.length > 0) setAlert(alerts[0]);
      } catch (err) {
        console.error('Error fetching alert:', err);
      }
    };
    
    if (alertId) fetchAlert();
  }, [alertId]);

  // Mutation para actualizar ubicación
  const updateLocationMutation = useMutation({
    mutationFn: async ({ latitude, longitude, heading, speed }) => {
      // Buscar si ya existe un registro de ubicación para este usuario y alerta
      const existing = await base44.entities.UserLocation.filter({ 
        user_id: user?.id, 
        alert_id: alertId 
      });

      if (existing.length > 0) {
        await base44.entities.UserLocation.update(existing[0].id, {
          latitude,
          longitude,
          heading: heading || 0,
          speed: speed || 0,
          is_active: true
        });
      } else {
        await base44.entities.UserLocation.create({
          user_id: user?.id,
          user_email: user?.email,
          alert_id: alertId,
          latitude,
          longitude,
          heading: heading || 0,
          speed: speed || 0,
          is_active: true
        });
      }
    }
  });

  // Simulación de movimiento tipo Uber - el usuario se mueve gradualmente hacia el vendedor
  const startTracking = () => {
    setIsTracking(true);
    try {
      window.localStorage.setItem('showBanner', 'true');
      window.dispatchEvent(new Event('waitme:requestsChanged'));
      window.dispatchEvent(new Event('waitme:showIncomingBanner'));
    } catch {}
    
    // Simular movimiento hacia el vendedor (mover usuario poco a poco)
    const moveTowardsDestination = () => {
      setUserLocation(prevLoc => {
        if (!prevLoc || !sellerLocation) return prevLoc;
        
        const lat1 = prevLoc[0];
        const lon1 = prevLoc[1];
        const lat2 = sellerLocation[0];
        const lon2 = sellerLocation[1];
        
        // Calcular distancia
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distM = R * c;
        
        // Si está muy cerca, ya no mover más
        if (distM < 5) return prevLoc;
        
        // Mover ~15m por tick hacia el destino (simulación fluida)
        const stepSize = 15 / R;
        const fraction = Math.min(stepSize / (distM / R), 1);
        
        const newLat = lat1 + (lat2 - lat1) * fraction;
        const newLon = lon1 + (lon2 - lon1) * fraction;
        
        return [newLat, newLon];
      });
    };
    
    // Actualizar posición cada 400ms para que el coche se vea moverse de forma fluida
    animationRef.current = setInterval(moveTowardsDestination, 400);
  };

  // Detener seguimiento
  const stopTracking = () => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
    setIsTracking(false);
  };

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, []);

  // Ubicación del vendedor desde la alerta (sin query); si viene vacía, coordenadas de prueba
  useEffect(() => {
    if (alert?.latitude != null && alert?.longitude != null) {
      setSellerLocation([Number(alert.latitude), Number(alert.longitude)]);
    } else if (alert && (sellerLocation == null || sellerLocation.length < 2)) {
      setSellerLocation([43.362, -5.849]);
    }
  }, [alert]);

  // Calcular distancia entre comprador y vendedor
  const calculateDistanceBetweenUsers = () => {
    if (!userLocation || !sellerLocation) return null;
    
    const R = 6371000; // Radio de la Tierra en metros
    const lat1 = userLocation[0] * Math.PI / 180;
    const lat2 = sellerLocation[0] * Math.PI / 180;
    const dLat = (sellerLocation[0] - userLocation[0]) * Math.PI / 180;
    const dLon = (sellerLocation[1] - userLocation[1]) * Math.PI / 180;
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMeters = R * c;
    
    return distanceMeters;
  };

  const distanceMeters = calculateDistanceBetweenUsers();

  // Geofencing: si el usuario se aleja más de 5 m de la alerta activa, mostrar advertencia
  useEffect(() => {
    const sellerHere = alert && user && (String(alert.user_id) === String(user?.id) || String(alert.user_email) === String(user?.email));
    if (!alert || sellerHere || paymentReleased) return;
    if (distanceMeters === null) return;
    if (distanceMeters <= 5) {
      wasWithin5mRef.current = true;
      setShowAbandonWarning(false);
    } else if (wasWithin5mRef.current) {
      setShowAbandonWarning(true);
    }
  }, [distanceMeters, alert, user, paymentReleased]);

  // Calcular distancia para mostrar
  const distance = (() => {
    if (distanceMeters === null) return null;
    if (distanceMeters < 1000) {
      return { value: Math.round(distanceMeters), unit: 'm' };
    }
    return { value: (distanceMeters / 1000).toFixed(1), unit: 'km' };
  })();

  // ETA (min) a partir de distancia restante y duración inicial de la ruta
  const etaMinutes = (() => {
    if (distanceMeters == null || distanceMeters <= 0 || !routeDistanceKm || routeDistanceKm <= 0 || !routeDurationSec) return null;
    const remainingKm = distanceMeters / 1000;
    const speedKmPerSec = routeDistanceKm / routeDurationSec;
    if (!speedKmPerSec) return null;
    return Math.max(1, Math.round((remainingKm / speedKmPerSec) / 60));
  })();

  // Liberar pago cuando estén a menos de 5m (solo para el comprador; el vendedor no libera)
  useEffect(() => {
    if (!alert || !user || hasReleasedPaymentRef.current || paymentReleased) return;
    const isSellerHere = String(alert.user_id) === String(user?.id) || String(alert.user_email) === String(user?.email);
    if (isSellerHere) return;
    if ((distanceMeters === null || distanceMeters > 5) && !forceRelease) return;

    if (forceRelease) setForceRelease(false);

    // Usuarios están a menos de 10 metros - liberar pago
    const releasePayment = async () => {
      hasReleasedPaymentRef.current = true;

      const amount = Number(alert?.price ?? 0);
      // TODO migrate alerts to always use user_id
      const sellerId = alert?.user_id ?? alert?.user_email;
      const buyerId = user?.id;
      if (Number.isFinite(amount) && sellerId && buyerId) {
        finalize({ outcome: OUTCOME.FINALIZADA_OK, amount, sellerId, buyerId });
      }

      const isDemo = String(alert.id).startsWith('demo_');
      
      if (!isDemo) {
        // Actualizar alerta a completada
        await base44.entities.ParkingAlert.update(alert.id, { status: 'completed' });
        
        // Crear transacción con comisión del 33%
        const sellerEarnings = alert.price * 0.67;
        const platformFee = alert.price * 0.33;
        
        await base44.entities.Transaction.create({
          alert_id: alert.id,
          seller_id: alert.user_email || alert.user_id,
          seller_name: alert.user_name,
          buyer_id: user.id,
          buyer_name: user.display_name || user.full_name?.split(' ')[0] || 'Usuario',
          amount: alert.price,
          seller_earnings: sellerEarnings,
          platform_fee: platformFee,
          status: 'completed',
          address: alert.address
        });
        
        // Enviar mensaje de sistema
        await base44.entities.ChatMessage.create({
          conversation_id: `${alert.user_id}_${user.id}`,
          alert_id: alert.id,
          sender_id: 'system',
          sender_name: 'Sistema',
          receiver_id: alert.user_id,
          message: `✅ Pago liberado: ${alert.price.toFixed(2)}€. El vendedor recibirá ${sellerEarnings.toFixed(2)}€`,
          read: false,
          message_type: 'system'
        });
      }
      
      setPaymentReleased(true);
      setShowPaymentSuccess(true);
      try {
        window.dispatchEvent(new CustomEvent('waitme:paymentReleased', { detail: { amount: Number(alert?.price ?? 0) } }));
      } catch (_) {}

      
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['navigationAlert'] });
      
      // Redirigir a History después de 3 segundos
      setTimeout(() => {
        window.location.href = createPageUrl('History');
      }, 3000);
    };
    
    releasePayment();
  }, [distanceMeters, alert, user, paymentReleased, queryClient, forceRelease]);

  // Ya no necesitamos pedir ubicación real - usamos ficticias

  const displayAlert = alert;

  const isSeller = displayAlert && user && (
    String(displayAlert.user_id) === String(user?.id) || String(displayAlert.user_email) === String(user?.email)
  );
  
  // Ubicación por defecto si no hay alert
  const defaultLat = 43.3620;
  const defaultLon = -5.8490;
  const mapCenter = displayAlert ? [displayAlert.latitude, displayAlert.longitude] : [defaultLat, defaultLon];

  // Si soy el vendedor (la alerta es mía), quien navega hacia mí es el comprador (reserved_by_*)
  // Si soy el comprador, el destino es el vendedor (user_*)
  const isBuyer = displayAlert && user && (
    String(displayAlert.reserved_by_id) === String(user?.id) ||
    String(displayAlert.reserved_by_email) === String(user?.email)
  );
  // La tarjeta siempre muestra a la otra persona
  const cardName = isBuyer
    ? (displayAlert?.user_name || 'Vendedor').split(' ')[0]
    : (displayAlert?.reserved_by_name || displayAlert?.user_name || 'Usuario').split(' ')[0];
  const cardPhoto = isBuyer
    ? (displayAlert?.user_photo || null)
    : (displayAlert?.reserved_by_photo ||
        (displayAlert?.reserved_by_name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayAlert.reserved_by_name)}&background=7c3aed&color=fff&size=128` : null));
  const cardCarBrand = isBuyer ? (displayAlert?.car_brand || '') : (displayAlert?.reserved_by_car?.split(' ')[0] || '');
  const cardCarModel = isBuyer ? (displayAlert?.car_model || '') : (displayAlert?.reserved_by_car?.split(' ').slice(1).join(' ') || '');
  const cardCarPlate = isBuyer ? (displayAlert?.car_plate || '') : (displayAlert?.reserved_by_plate || '');
  const cardCarColor = isBuyer ? (displayAlert?.car_color || 'gris') : (displayAlert?.reserved_by_car_color || 'gris');
  const cardPhone = isBuyer ? (displayAlert?.phone || null) : null;
  const phoneEnabled = isBuyer ? Boolean(displayAlert?.phone && displayAlert?.allow_phone_calls !== false) : false;
  
  // Fallback para demo (Sofía es la que reservó)
  const sellerName = cardName || (displayAlert?.reserved_by_name || displayAlert?.user_name || 'Usuario').split(' ')[0];
  const sellerPhoto = cardPhoto;

  const distLabel = distanceMeters != null
    ? distanceMeters < 1000
      ? `${Math.round(distanceMeters)} m`
      : `${(distanceMeters / 1000).toFixed(1)} km`
    : '--';

  // Create user photo marker (buyer's photo as map icon)
  const userPhotoIcon = user?.photo_url
    ? `<img src="${user.photo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;color:#7c3aed;">${(user?.full_name || 'Yo').charAt(0)}</div>`;

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col">

      {/* ── Payment success overlay ── */}
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

      {/* ── Abandon warning ── */}
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

      {/* ── HEADER — idéntico al de todas las pantallas ── */}
      <Header title="Navegación" showBackButton backTo="History" />

      {/* ── MAPA — desde bajo el header hasta el bottom del nav ── */}
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
          userPhotoHtml={userPhotoIcon}
        />
      </div>

      {/* ETA pill — flotando sobre el mapa justo debajo del header */}
      {isTracking && (
        <div className="fixed left-0 right-0 z-40 px-4" style={{ top: 'calc(56px + 8px)' }}>
          <div className="bg-gray-900/90 backdrop-blur-md rounded-2xl px-4 py-2 flex items-center gap-3 shadow-xl">
            <div>
              <p className="text-white font-black text-xl leading-none">
                {etaMinutes != null ? `${etaMinutes} min` : distLabel}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">{distLabel} · {displayAlert?.address?.split(',')[0] || 'Destino'}</p>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          </div>
        </div>
      )}

      {/* ── BOTTOM PANEL — tarjeta de Sofía incrustada ── */}
      <div className="fixed left-0 right-0 z-50 px-3" style={{ bottom: 'var(--bottom-nav-h)' }}>
        <div className="bg-gray-950 rounded-t-3xl shadow-2xl pt-2 pb-3 border-t border-gray-800">
          {/* Drag handle */}
          <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-2" />

          {displayAlert && (
            <div className="px-1">
              {/* Tarjeta Sofia idéntica al modal / Activas */}
              <div className="bg-gray-800/60 rounded-xl p-2 border border-purple-500">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold text-xs rounded-md px-3 py-1">
                    {isSeller ? 'Te esperan:' : 'Tu destino:'}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="bg-black/40 border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
                      <Navigation className="w-3 h-3 text-purple-400"/>
                      <span className="text-white font-bold text-xs">{distLabel}</span>
                    </div>
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-2 py-0.5 flex items-center gap-1 h-7">
                      <span className="text-green-400 font-bold text-sm">{displayAlert.price != null ? Number(displayAlert.price).toFixed(0) : '0'}€</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-700/80 mb-2"/>

                {/* Foto + nombre + matrícula + coche */}
                <div className="flex gap-2.5">
                  <div className="w-[80px] h-[72px] rounded-lg overflow-hidden border-2 border-purple-500/40 bg-gray-900 flex-shrink-0">
                    {sellerPhoto
                      ? <img src={sellerPhoto} alt={sellerName} className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-center justify-center text-xl font-bold text-purple-400">{sellerName.charAt(0)}</div>
                    }
                  </div>
                  <div className="flex-1 h-[72px] flex flex-col">
                    <p className="font-bold text-base text-white leading-none">{sellerName}</p>
                    <p className="text-xs font-medium text-gray-200 flex-1 flex items-center truncate relative top-[4px]">{cardCarBrand} {cardCarModel}</p>
                    <div className="flex items-end gap-2 mt-1 min-h-[26px]">
                      <div className="flex-shrink-0">
                        <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-6">
                          <div className="bg-blue-600 h-full w-4 flex items-center justify-center">
                            <span className="text-white text-[7px] font-bold">E</span>
                          </div>
                          <span className="px-1 text-black font-mono font-bold text-xs tracking-wider">{cardCarPlate || '----'}</span>
                        </div>
                      </div>
                      <div className="flex-1 flex justify-center">
                        <svg viewBox="0 0 48 24" className="w-14 h-8" fill="none">
                          <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
                            fill={({'blanco':'#fff','negro':'#1a1a1a','gris':'#9ca3af','rojo':'#ef4444','azul':'#3b82f6','verde':'#22c55e','amarillo':'#eab308'})[cardCarColor?.toLowerCase()] || '#9ca3af'}
                            stroke="white" strokeWidth="1.5"/>
                          <path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="0.5"/>
                          <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1"/>
                          <circle cx="14" cy="18" r="2" fill="#666"/>
                          <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1"/>
                          <circle cx="36" cy="18" r="2" fill="#666"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dirección */}
                <div className="pt-1.5 border-t border-gray-700/80 mt-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs min-h-[18px]">
                    <Navigation className="w-3 h-3 flex-shrink-0 text-purple-400"/>
                    <span className="text-gray-200 line-clamp-1 leading-none">{displayAlert.address || 'Ubicación marcada'}</span>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.location.href = createPageUrl(`Chat?alertId=${alertId}&userId=${displayAlert.user_email || displayAlert.user_id}`)}
                    className="h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg border-2 border-green-400 flex items-center justify-center"
                    style={{width:'46px',flexShrink:0}}>
                    <MessageCircle className="w-4 h-4"/>
                  </button>

                  <button
                    onClick={() => phoneEnabled && cardPhone && (window.location.href = `tel:${cardPhone}`)}
                    disabled={!phoneEnabled}
                    className={`h-8 rounded-lg border-2 flex items-center justify-center ${phoneEnabled ? 'bg-white hover:bg-gray-200 text-black border-gray-300' : 'bg-white/10 text-white border-white/30 opacity-70'}`}
                    style={{width:'46px',flexShrink:0}}>
                    <Phone className="w-4 h-4"/>
                  </button>

                  {/* Botón principal: iniciar / detener / desaparcar */}
                  {isSeller ? (
                    <button
                      onClick={() => (window.location.href = createPageUrl('History'))}
                      className="flex-1 h-8 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm flex items-center justify-center gap-1"
                    >
                      He desaparcado ✓
                    </button>
                  ) : !isTracking ? (
                    <button
                      onClick={startTracking}
                      className="flex-1 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-1 animate-pulse shadow-lg shadow-blue-500/50"
                    >
                      <Navigation className="w-4 h-4"/>
                      IR
                    </button>
                  ) : (
                    <button
                      onClick={stopTracking}
                      className="flex-1 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold text-xs flex items-center justify-center gap-1 border border-gray-600"
                    >
                      <AlertCircle className="w-3 h-3"/>
                      Detener
                    </button>
                  )}
                </div>

                {!isSeller && displayAlert && String(displayAlert.id).startsWith('demo_') && !paymentReleased && (
                  <button
                    onClick={() => setForceRelease(true)}
                    className="w-full mt-2 h-7 rounded-xl border border-dashed border-amber-500/50 text-amber-400 text-xs hover:bg-amber-500/10 transition-colors"
                  >
                    Simular llegada (demo)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── BottomNav siempre visible ── */}
      <BottomNav />

    </div>
  );
}