import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Navigation, Phone, MessageCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ParkingMap from '@/components/map/ParkingMap';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';

export default function Navigate() {
  const urlParams = new URLSearchParams(window.location.search);
  const alertId = urlParams.get('alertId');
  
  const [user, setUser] = useState(null);
  // UBICACIONES FICTICIAS PARA DEMO - Usuario está a 500m del vendedor
  const [userLocation, setUserLocation] = useState([43.3670, -5.8440]); // 500m al norte
  const [sellerLocation, setSellerLocation] = useState([43.3620, -5.8490]); // Ubicación de Sofía
  const [isTracking, setIsTracking] = useState(false);
  const [paymentReleased, setPaymentReleased] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const watchIdRef = useRef(null);
  const queryClient = useQueryClient();
  const hasReleasedPaymentRef = useRef(false);
  const animationRef = useRef(null);

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
        
        // Mover 20 metros por segundo hacia el destino
        const stepSize = 20 / R;
        const fraction = Math.min(stepSize / (distM / R), 1);
        
        const newLat = lat1 + (lat2 - lat1) * fraction;
        const newLon = lon1 + (lon2 - lon1) * fraction;
        
        return [newLat, newLon];
      });
    };
    
    // Mover cada segundo
    animationRef.current = setInterval(moveTowardsDestination, 1000);
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

  // Ubicación del vendedor desde la alerta (sin query)
  useEffect(() => {
    if (alert?.latitude && alert?.longitude) {
      setSellerLocation([alert.latitude, alert.longitude]);
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

  // Calcular distancia para mostrar
  const distance = (() => {
    if (distanceMeters === null) return null;
    if (distanceMeters < 1000) {
      return { value: Math.round(distanceMeters), unit: 'm' };
    }
    return { value: (distanceMeters / 1000).toFixed(1), unit: 'km' };
  })();

  // Liberar pago cuando estén a menos de 10 metros
  useEffect(() => {
    if (!alert || !user || hasReleasedPaymentRef.current || paymentReleased) return;
    if (distanceMeters === null || distanceMeters > 10) return;
    
    // Usuarios están a menos de 10 metros - liberar pago
    const releasePayment = async () => {
      hasReleasedPaymentRef.current = true;
      
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
      
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['navigationAlert'] });
      
      // Redirigir a History después de 3 segundos
      setTimeout(() => {
        window.location.href = createPageUrl('History');
      }, 3000);
    };
    
    releasePayment();
  }, [distanceMeters, alert, user, paymentReleased, queryClient]);

  // Ya no necesitamos pedir ubicación real - usamos ficticias

  const displayAlert = alert;
  
  // Ubicación por defecto si no hay alert
  const defaultLat = 43.3620;
  const defaultLon = -5.8490;
  const mapCenter = displayAlert ? [displayAlert.latitude, displayAlert.longitude] : [defaultLat, defaultLon];

  return (
    <div className="min-min-h-[100dvh] bg-black text-white flex flex-col">
      {/* Modal de éxito de pago */}
      {showPaymentSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-8 mx-4 text-center shadow-2xl border-2 border-green-400"
          >
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">¡Pago liberado!</h2>
            <p className="text-green-100 mb-4">
              Has llegado al destino
            </p>
            <div className="bg-white/20 rounded-lg p-3">
              <p className="text-white font-bold text-lg">{alert.price.toFixed(2)}€</p>
              <p className="text-green-100 text-sm">Transacción completada</p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={createPageUrl('History')}>
            <Button variant="ghost" size="icon" className="text-white">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Navegación a parking</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Mapa - SIEMPRE VISIBLE */}
      <div className="flex-1 pt-[60px] pb-[420px]">
        <ParkingMap
          alerts={displayAlert ? [displayAlert] : []}
          userLocation={userLocation}
          selectedAlert={displayAlert}
          showRoute={isTracking}
          sellerLocation={sellerLocation}
          zoomControl={true}
          className="h-full"
        />
      </div>

      {/* Panel inferior */}
      <div className="fixed bottom-20 left-0 right-0 bg-black/95 backdrop-blur-sm border-t-2 border-gray-700 p-4 space-y-3 z-40">
        {/* Info de destino */}
        {displayAlert && (
          <div className="bg-gray-900 rounded-xl p-3 border-2 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-white">{displayAlert.user_name}</p>
                <p className="text-sm text-gray-400">{displayAlert.car_brand} {displayAlert.car_model}</p>
                <p className="text-xs text-gray-500 mt-1">{displayAlert.car_plate}</p>
              </div>
              <div className="text-right">
                {distance && (
                  <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-2 mb-1">
                    <span className="text-purple-400 font-bold">{distance.value}{distance.unit}</span>
                  </div>
                )}
                {distanceMeters !== null && distanceMeters <= 50 && (
                  <div className={`text-xs font-bold ${distanceMeters <= 10 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {distanceMeters <= 10 ? '¡Llegaste!' : '¡Muy cerca!'}
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              {displayAlert.address}
            </div>

            {/* Indicador de pago retenido */}
            {!paymentReleased && (
              <div className="mt-2 bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-2">
                <p className="text-xs text-yellow-400 text-center">
                  💰 Pago retenido: {displayAlert.price.toFixed(2)}€ · Se liberará a menos de 10m
                </p>
              </div>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-2">
          {!isTracking ? (
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 text-base"
              onClick={startTracking}
            >
              <Navigation className="w-5 h-5 mr-2" />
              Iniciar navegación
            </Button>
          ) : (
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold h-12 text-base"
              onClick={stopTracking}
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              Detener navegación
            </Button>
          )}
        </div>

        {/* Botones de contacto */}
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white h-10"
            onClick={() => displayAlert && (window.location.href = createPageUrl(`Chat?alertId=${alertId}&userId=${displayAlert.user_email || displayAlert.user_id}`))}
            disabled={!displayAlert}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Chat
          </Button>
          <Button
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white h-10"
            onClick={() => displayAlert?.phone && (window.location.href = `tel:${displayAlert.phone}`)}
            disabled={!displayAlert?.allow_phone_calls || !displayAlert?.phone}
          >
            <Phone className="w-5 h-5 mr-2" />
            Llamar
          </Button>
        </div>

        {isTracking && !paymentReleased && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-2 text-center"
          >
            <p className="text-xs text-blue-400">
              📍 Navegando en tiempo real hacia el parking
            </p>
            {distanceMeters !== null && distanceMeters <= 50 && distanceMeters > 10 && (
              <p className="text-xs text-yellow-400 mt-1 font-bold">
                ¡Muy cerca! {Math.round(distanceMeters)}m hasta liberar el pago
              </p>
            )}
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}