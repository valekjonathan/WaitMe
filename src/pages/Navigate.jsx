import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigation, Phone, MessageCircle, AlertCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ParkingMap from '@/components/map/ParkingMap';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
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

const DEMO_ALERTS = {
  'demo_1': {
    id: 'demo_1',
    user_name: 'Sofía',
    user_photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    user_id: 'seller-1',
    user_email: 'seller1@test.com',
    car_brand: 'SEAT',
    car_model: 'León',
    car_color: 'blanco',
    car_plate: '1234 JKL',
    address: 'Calle Campoamor, 13',
    latitude: 43.3629,
    longitude: -5.8488,
    phone: '600123123',
    allow_phone_calls: true,
    price: 3,
    available_in_minutes: 6
  },
  'demo_2': { id:'demo_2', user_name:'Marco', user_photo:'https://randomuser.me/api/portraits/men/32.jpg', user_id:'seller-2', user_email:'seller2@test.com', car_brand:'Volkswagen', car_model:'Golf', car_color:'negro', car_plate:'5678 HJP', address:'Calle Fray Ceferino, Oviedo', latitude:43.3612, longitude:-5.8502, phone:'600456789', allow_phone_calls:true, price:5, available_in_minutes:10 },
  'demo_3': { id:'demo_3', user_name:'Nerea', user_photo:'https://randomuser.me/api/portraits/women/68.jpg', user_id:'seller-3', user_email:'seller3@test.com', car_brand:'Toyota', car_model:'RAV4', car_color:'azul', car_plate:'9012 LSR', address:'Calle Campoamor, Oviedo', latitude:43.363, longitude:-5.8489, phone:'600789012', allow_phone_calls:true, price:7, available_in_minutes:14 },
  'demo_4': { id:'demo_4', user_name:'David', user_photo:'https://randomuser.me/api/portraits/men/19.jpg', user_id:'seller-4', user_email:'seller4@test.com', car_brand:'Renault', car_model:'Trafic', car_color:'gris', car_plate:'3456 JTZ', address:'Plaza de la Escandalera, Oviedo', latitude:43.3609, longitude:-5.8501, phone:'600234567', allow_phone_calls:true, price:4, available_in_minutes:4 },
  'demo_5': { id:'demo_5', user_name:'Lucía', user_photo:'https://randomuser.me/api/portraits/women/12.jpg', user_id:'seller-5', user_email:'seller5@test.com', car_brand:'Peugeot', car_model:'208', car_color:'rojo', car_plate:'7788 MNB', address:'Calle Rosal, Oviedo', latitude:43.3623, longitude:-5.8483, phone:'600345678', allow_phone_calls:true, price:2, available_in_minutes:3 },
  'demo_6': { id:'demo_6', user_name:'Álvaro', user_photo:'https://randomuser.me/api/portraits/men/61.jpg', user_id:'seller-6', user_email:'seller6@test.com', car_brand:'Kia', car_model:'Sportage', car_color:'verde', car_plate:'2468 GHT', address:'Calle Jovellanos, Oviedo', latitude:43.3615, longitude:-5.8505, phone:'600567890', allow_phone_calls:true, price:6, available_in_minutes:18 }
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

  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (DEMO_ALERTS[alertId]) {
      setAlert(DEMO_ALERTS[alertId]);
      return;
    }
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
        await base44.entities.ParkingAlert.update(alert.id, { status: 'completed' });
        const sellerEarnings = alert.price * 0.67;
        const platformFee = alert.price * 0.33;
        await base44.entities.Transaction.create({ alert_id:alert.id, seller_id:alert.user_email||alert.user_id, seller_name:alert.user_name, buyer_id:user.id, buyer_name:user.full_name?.split(' ')[0]||'Usuario', amount:alert.price, seller_earnings:sellerEarnings, platform_fee:platformFee, status:'completed', address:alert.address });
        await base44.entities.ChatMessage.create({ conversation_id:`${alert.user_id}_${user.id}`, alert_id:alert.id, sender_id:'system', sender_name:'Sistema', receiver_id:alert.user_id, message:`✅ Pago liberado: ${alert.price.toFixed(2)}€. El vendedor recibirá ${sellerEarnings.toFixed(2)}€`, read:false, message_type:'system' });
      }
      setPaymentReleased(true);
      setShowPaymentSuccess(true);
      try { window.dispatchEvent(new CustomEvent('waitme:paymentReleased', { detail: { amount: Number(alert?.price ?? 0) } })); } catch {}
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['navigationAlert'] });
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

  // Icono del usuario: mi foto cuadrada con bordes redondeados (parpadeante verde)
  const userMapIcon = user?.photo_url
    ? `<div style="width:44px;height:44px;border-radius:10px;overflow:hidden;border:3px solid #22c55e;box-shadow:0 0 14px rgba(34,197,94,0.9);animation:pulse-green 1.2s ease-in-out infinite;">
        <img src="${user.photo_url}" style="width:100%;height:100%;object-fit:cover;" />
       </div>
       <style>@keyframes pulse-green{0%,100%{box-shadow:0 0 10px rgba(34,197,94,0.9);}50%{box-shadow:0 0 22px rgba(34,197,94,1);}}</style>`
    : `<div style="width:44px;height:44px;border-radius:10px;border:3px solid #22c55e;box-shadow:0 0 14px rgba(34,197,94,0.9);background:#1a1a2e;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:bold;color:#22c55e;">Yo</div>`;

  // Icono del vendedor: foto circular
  const sellerMapIcon = sellerPhoto
    ? `<img src="${sellerPhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;color:#a855f7;">${sellerName.charAt(0)}</div>`;

  // Construir alert en formato compatible con UserAlertCard
  const alertForCard = displayAlert ? {
    ...displayAlert,
    // Para UserAlertCard siempre mostramos los datos del vendedor (la otra persona)
    user_name: sellerName,
    user_photo: sellerPhoto,
    car_brand: isBuyer ? displayAlert.car_brand : (displayAlert.reserved_by_car?.split(' ')[0] || ''),
    car_model: isBuyer ? displayAlert.car_model : (displayAlert.reserved_by_car?.split(' ').slice(1).join(' ') || ''),
    car_plate: isBuyer ? displayAlert.car_plate : (displayAlert.reserved_by_plate || ''),
    car_color: isBuyer ? displayAlert.car_color : (displayAlert.reserved_by_car_color || 'gris'),
    phone: isBuyer ? (displayAlert.phone || null) : null,
    allow_phone_calls: isBuyer ? displayAlert.allow_phone_calls : false,
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

      <Header title="Navegación" showBackButton backTo="History" />

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
      <div className="fixed left-0 right-0 z-40 px-4 flex gap-2" style={{ top: 'calc(56px + 10px)' }}>
        <div className="flex-1 bg-gray-900/90 backdrop-blur-md rounded-2xl px-3 py-2 flex items-center gap-2 shadow-xl border border-gray-700/50">
          <Navigation className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <div>
            <p className="text-white font-black text-base leading-none">{distLabel}</p>
            <p className="text-gray-400 text-[10px] mt-0.5">Distancia</p>
          </div>
        </div>
        <div className="flex-1 bg-gray-900/90 backdrop-blur-md rounded-2xl px-3 py-2 flex items-center gap-2 shadow-xl border border-gray-700/50">
          <Clock className="w-4 h-4 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-white font-black text-base leading-none">
              {etaMinutes != null ? `${etaMinutes} min` : '--'}
            </p>
            <p className="text-gray-400 text-[10px] mt-0.5">ETA</p>
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
              /* Panel colapsado: solo foto + nombre */
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 px-4 pb-3"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500/40 flex-shrink-0">
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
                  <UserAlertCard
                    alert={alertForCard}
                    hideBuy={false}
                    userLocation={userLocation}
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

      <BottomNav />
    </div>
  );
}