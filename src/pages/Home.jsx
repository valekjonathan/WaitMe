// ====================== HOME (tarjeta igual a History) ======================
import React, { useState, useEffect, useMemo } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Clock, Phone, PhoneOff, MessageCircle, Car, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import ParkingMap from '@/components/map/ParkingMap';
import BottomNav from '@/components/BottomNav';
import NotificationManager from '@/components/NotificationManager';
import Header from '@/components/Header';

// ====================== COMPONENTE TARJETA (MISMO QUE HISTORY) ======================
const MarcoContent = ({
  photoUrl,
  name,
  carLabel,
  plate,
  address,
  availableInMinutes,
  price,
  onChat,
  onCall,
  phoneEnabled,
  onBuy
}) => {
  return (
    <div className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-2">
        <span className="bg-green-500/25 text-green-300 border border-green-400/50 rounded-md px-3 h-7 flex items-center text-xs font-bold">
          Activa
        </span>
        <span className="text-purple-400 font-bold text-sm">{price.toFixed(2)}€</span>
      </div>

      <div className="border-t border-gray-700/80 mb-2" />

      {/* CUERPO */}
      <div className="flex gap-2.5">
        <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500/40 bg-gray-900 flex-shrink-0">
          <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 h-[85px] flex flex-col">
          <p className="font-bold text-xl text-white leading-none">{name}</p>
          <p className="text-sm font-medium text-gray-200 leading-none mt-1">{carLabel}</p>

          <div className="mt-auto">
            <span className="bg-white text-black font-mono font-bold text-sm px-2 py-1 rounded-md">
              {plate}
            </span>
          </div>
        </div>
      </div>

      {/* INFO */}
      <div className="pt-1.5 border-t border-gray-700/80 mt-2 space-y-1.5">
        <div className="flex items-start gap-1.5 text-xs">
          <MapPin className="w-4 h-4 text-purple-400 mt-0.5" />
          <span className="text-gray-200">{address}</span>
        </div>

        <div className="flex items-start gap-1.5 text-xs">
          <Clock className="w-4 h-4 text-purple-400 mt-0.5" />
          <span className="text-gray-200">
            Se va en <span className="text-purple-400">{availableInMinutes} min</span>
          </span>
        </div>
      </div>

      {/* BOTONES */}
      <div className="mt-2 flex gap-2">
        <Button
          size="icon"
          className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-8 w-[42px]"
          onClick={onChat}
        >
          <MessageCircle className="w-4 h-4" />
        </Button>

        {phoneEnabled ? (
          <Button
            size="icon"
            className="bg-white hover:bg-gray-200 text-black rounded-lg h-8 w-[42px]"
            onClick={onCall}
          >
            <Phone className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            className="border-white/30 bg-white/10 text-white rounded-lg h-8 w-[42px] opacity-70"
            disabled
          >
            <PhoneOff className="w-4 h-4" />
          </Button>
        )}

        <Button
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg h-8"
          onClick={onBuy}
        >
          WaitMe!
        </Button>
      </div>
    </div>
  );
};

// ====================== HOME ======================
export default function Home() {
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    navigator.geolocation?.getCurrentPosition((p) =>
      setUserLocation([p.coords.latitude, p.coords.longitude])
    );
  }, []);

  const demoAlerts = useMemo(
    () => [
      {
        id: '1',
        user_name: 'Sofía',
        user_photo: 'https://randomuser.me/api/portraits/women/44.jpg',
        car_brand: 'SEAT',
        car_model: 'Ibiza',
        car_plate: '1234 KLM',
        address: 'Calle Uría, Oviedo',
        available_in_minutes: 6,
        price: 3,
        phone: null,
        latitude: 43.3619,
        longitude: -5.8494
      }
    ],
    []
  );

  useEffect(() => {
    setSelectedAlert(demoAlerts[0]);
  }, [demoAlerts]);

  return (
    <div className="min-h-screen bg-black text-white">
      <NotificationManager user={user} />
      <Header title="WaitMe!" />

      <main className="fixed inset-0">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <ParkingMap alerts={demoAlerts} userLocation={userLocation} />
        </div>

        <div className="absolute inset-0 bg-purple-900/40 pointer-events-none"></div>

        <div className="absolute bottom-[88px] left-0 right-0 px-4">
          {selectedAlert && (
            <MarcoContent
              photoUrl={selectedAlert.user_photo}
              name={selectedAlert.user_name}
              carLabel={`${selectedAlert.car_brand} ${selectedAlert.car_model}`}
              plate={selectedAlert.car_plate}
              address={selectedAlert.address}
              availableInMinutes={selectedAlert.available_in_minutes}
              price={selectedAlert.price}
              phoneEnabled={false}
              onChat={() => {}}
              onCall={() => {}}
              onBuy={() => {}}
            />
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}