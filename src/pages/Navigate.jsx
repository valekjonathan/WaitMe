import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Navigation, Phone, MessageCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ParkingMap from '@/components/map/ParkingMap';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';

export default function Navigate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const alertId = urlParams.get('alertId');

  const [user, setUser] = useState(null);
  const [alert, setAlert] = useState(null);

  // posiciones demo
  const [userLocation, setUserLocation] = useState([43.3670, -5.8440]);
  const [sellerLocation, setSellerLocation] = useState([43.3620, -5.8490]);

  const [isTracking, setIsTracking] = useState(false);
  const [paymentReleased, setPaymentReleased] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  const hasReleasedPaymentRef = useRef(false);
  const animationRef = useRef(null);

  /* ======================
     USER
  ====================== */
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  /* ======================
     ALERT (instantánea)
  ====================== */
  useEffect(() => {
    const demoAlerts = {
      demo_1: {
        id: 'demo_1',
        user_name: 'Sofía',
        car_brand: 'SEAT',
        car_model: 'Ibiza',
        car_plate: '1234 KLM',
        address: 'Calle Uría, Oviedo',
        latitude: 43.3629,
        longitude: -5.8488,
        phone: '600123123',
        allow_phone_calls: true,
        price: 3,
        available_in_minutes: 6
      }
    };

    if (demoAlerts[alertId]) {
      setAlert(demoAlerts[alertId]);
      return;
    }

    if (!alertId) return;

    base44.entities.ParkingAlert
      .filter({ id: alertId })
      .then(res => res?.[0] && setAlert(res[0]))
      .catch(() => {});
  }, [alertId]);

  useEffect(() => {
    if (alert?.latitude && alert?.longitude) {
      setSellerLocation([alert.latitude, alert.longitude]);
    }
  }, [alert]);

  /* ======================
     TRACKING (demo)
  ====================== */
  const startTracking = () => {
    setIsTracking(true);

    animationRef.current = setInterval(() => {
      setUserLocation(prev => {
        if (!prev || !sellerLocation) return prev;

        const lat = prev[0] + (sellerLocation[0] - prev[0]) * 0.05;
        const lng = prev[1] + (sellerLocation[1] - prev[1]) * 0.05;

        return [lat, lng];
      });
    }, 1000);
  };

  const stopTracking = () => {
    clearInterval(animationRef.current);
    animationRef.current = null;
    setIsTracking(false);
  };

  useEffect(() => {
    return () => animationRef.current && clearInterval(animationRef.current);
  }, []);

  /* ======================
     DISTANCIA
  ====================== */
  const distanceMeters = (() => {
    if (!userLocation || !sellerLocation) return null;
    const R = 6371000;
    const dLat = (sellerLocation[0] - userLocation[0]) * Math.PI / 180;
    const dLon = (sellerLocation[1] - userLocation[1]) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(userLocation[0] * Math.PI / 180) *
      Math.cos(sellerLocation[0] * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  })();

  /* ======================
     LIBERAR PAGO
  ====================== */
  useEffect(() => {
    if (!alert || !user || paymentReleased || hasReleasedPaymentRef.current) return;
    if (distanceMeters == null || distanceMeters > 10) return;

    hasReleasedPaymentRef.current = true;

    setPaymentReleased(true);
    setShowPaymentSuccess(true);

    queryClient.invalidateQueries({ queryKey: ['myAlerts'] });

    setTimeout(() => {
      navigate(createPageUrl('History'));
    }, 3000);
  }, [distanceMeters, alert, user, paymentReleased, navigate, queryClient]);

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {showPaymentSuccess && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
          <div className="bg-green-600 rounded-3xl p-8 text-center">
            <h2 className="text-2xl font-bold">¡Pago liberado!</h2>
          </div>
        </motion.div>
      )}

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-700">
        <div className="flex items-center px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('History'))}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="flex-1 text-center font-semibold">Navegación a parking</h1>
        </div>
      </header>

      {/* MAPA */}
      <div className="flex-1 pt-[60px] pb-[420px]">
        <ParkingMap
          alerts={alert ? [alert] : []}
          userLocation={userLocation}
          sellerLocation={sellerLocation}
          showRoute={isTracking}
          zoomControl
          className="h-full"
        />
      </div>

      {/* PANEL */}
      <div className="fixed bottom-20 left-0 right-0 bg-black border-t border-gray-700 p-4 space-y-3">
        {alert && (
          <div className="bg-gray-900 p-3 rounded-xl border border-purple-500">
            <p className="font-bold">{alert.user_name}</p>
            <p className="text-sm text-gray-400">{alert.address}</p>
          </div>
        )}

        <div className="flex gap-2">
          {!isTracking ? (
            <Button className="flex-1 bg-blue-600" onClick={startTracking}>
              <Navigation className="w-5 h-5 mr-2" />
              Iniciar navegación
            </Button>
          ) : (
            <Button className="flex-1 bg-red-600" onClick={stopTracking}>
              <AlertCircle className="w-5 h-5 mr-2" />
              Detener navegación
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1 bg-green-600"
            onClick={() => navigate(createPageUrl(`Chat?alertId=${alertId}`))}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Chat
          </Button>

          <Button
            className="flex-1 bg-gray-700"
            onClick={() => alert?.phone && (window.location.href = `tel:${alert.phone}`)}
            disabled={!alert?.allow_phone_calls}
          >
            <Phone className="w-5 h-5 mr-2" />
            Llamar
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}