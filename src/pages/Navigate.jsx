import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  const [params] = useSearchParams();
  const alertId = params.get('alertId');

  const queryClient = useQueryClient();
  const animationRef = useRef(null);
  const hasReleasedPaymentRef = useRef(false);

  const [user, setUser] = useState(null);
  const [alert, setAlert] = useState(null);

  // DEMO locations
  const [userLocation, setUserLocation] = useState([43.3670, -5.8440]);
  const [sellerLocation, setSellerLocation] = useState([43.3620, -5.8490]);

  const [isTracking, setIsTracking] = useState(false);
  const [paymentReleased, setPaymentReleased] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  /* ================= USER ================= */
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  /* ================= ALERT (INSTANTÁNEO) ================= */
  useEffect(() => {
    const demoAlerts = {
      demo_1: {
        id: 'demo_1',
        user_name: 'Sofía',
        latitude: 43.3629,
        longitude: -5.8488,
        phone: '600123123',
        allow_phone_calls: true,
        price: 3,
        car_brand: 'SEAT',
        car_model: 'Ibiza',
        car_plate: '1234 KLM',
        address: 'Calle Uría, Oviedo',
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
      .then(r => r?.[0] && setAlert(r[0]))
      .catch(() => {});
  }, [alertId]);

  /* ================= TRACKING ================= */
  const startTracking = () => {
    setIsTracking(true);

    animationRef.current = setInterval(() => {
      setUserLocation(prev => {
        if (!prev || !sellerLocation) return prev;
        const [lat1, lon1] = prev;
        const [lat2, lon2] = sellerLocation;
        return [
          lat1 + (lat2 - lat1) * 0.02,
          lon1 + (lon2 - lon1) * 0.02
        ];
      });
    }, 1000);
  };

  const stopTracking = () => {
    clearInterval(animationRef.current);
    animationRef.current = null;
    setIsTracking(false);
  };

  useEffect(() => () => clearInterval(animationRef.current), []);

  /* ================= DISTANCIA ================= */
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
    return Math.round(R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))));
  })();

  /* ================= LIBERAR PAGO ================= */
  useEffect(() => {
    if (!alert || !user || paymentReleased || hasReleasedPaymentRef.current) return;
    if (distanceMeters === null || distanceMeters > 10) return;

    hasReleasedPaymentRef.current = true;

    setPaymentReleased(true);
    setShowPaymentSuccess(true);

    queryClient.invalidateQueries();

    setTimeout(() => {
      navigate(createPageUrl('History'));
    }, 3000);
  }, [distanceMeters, alert, user, paymentReleased, navigate, queryClient]);

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {showPaymentSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
        >
          <div className="bg-green-600 rounded-3xl p-8 text-center">
            <h2 className="text-2xl font-bold">¡Pago liberado!</h2>
            <p>{alert?.price?.toFixed(2)}€</p>
          </div>
        </motion.div>
      )}

      <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={createPageUrl('History')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft />
            </Button>
          </Link>
          <h1>Navegación a parking</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="flex-1 pt-[60px] pb-[420px]">
        <ParkingMap
          alerts={alert ? [alert] : []}
          userLocation={userLocation}
          sellerLocation={sellerLocation}
          showRoute={isTracking}
          className="h-full"
        />
      </div>

      <div className="fixed bottom-20 left-0 right-0 p-4 bg-black border-t border-gray-700">
        <div className="flex gap-2">
          {!isTracking ? (
            <Button className="flex-1 bg-blue-600" onClick={startTracking}>
              <Navigation className="mr-2" /> Iniciar navegación
            </Button>
          ) : (
            <Button className="flex-1 bg-red-600" onClick={stopTracking}>
              <AlertCircle className="mr-2" /> Detener
            </Button>
          )}
        </div>

        <div className="flex gap-2 mt-2">
          <Button
            className="flex-1 bg-green-600"
            onClick={() => navigate(createPageUrl(`Chat?alertId=${alertId}`))}
          >
            <MessageCircle className="mr-2" /> Chat
          </Button>
          <Button
            className="flex-1 bg-gray-700"
            disabled={!alert?.allow_phone_calls}
            onClick={() => alert?.phone && (window.location.href = `tel:${alert.phone}`)}
          >
            <Phone className="mr-2" /> Llamar
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}