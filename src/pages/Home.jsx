// src/pages/Home.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Car, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import ParkingMap from '@/components/map/ParkingMap';
import UserAlertCard from '@/components/cards/UserAlertCard';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import MapFilters from '@/components/map/MapFilters';
import BottomNav from '@/components/BottomNav';
import NotificationManager from '@/components/NotificationManager';
import Header from '@/components/Header';

function buildDemoAlerts(centerLat, centerLng) {
  const offsets = [
    [0.0009, 0.0009],
    [-0.0007, 0.0008],
    [0.0011, -0.0005],
    [-0.0010, -0.0007],
    [0.0004, -0.0011],
    [-0.0004, 0.0012]
  ];

  const base = [
    {
      id: 'demo_1',
      user_name: 'Sofía',
      user_photo: 'https://randomuser.me/api/portraits/women/44.jpg',
      car_brand: 'SEAT',
      car_model: 'Ibiza',
      car_color: 'blanco',
      car_plate: '1234 KLM',
      vehicle_type: 'car',
      price: 3,
      available_in_minutes: 6,
      address: 'Calle Uría, Oviedo'
    },
    {
      id: 'demo_2',
      user_name: 'Marco',
      user_photo: 'https://randomuser.me/api/portraits/men/32.jpg',
      car_brand: 'Volkswagen',
      car_model: 'Golf',
      car_color: 'negro',
      car_plate: '5678 HJP',
      vehicle_type: 'car',
      price: 5,
      available_in_minutes: 10,
      address: 'Calle Fray Ceferino, Oviedo'
    },
    {
      id: 'demo_3',
      user_name: 'Nerea',
      user_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
      car_brand: 'Toyota',
      car_model: 'RAV4',
      car_color: 'azul',
      car_plate: '9012 LSR',
      vehicle_type: 'suv',
      price: 7,
      available_in_minutes: 14,
      address: 'Calle Campoamor, Oviedo'
    },
    {
      id: 'demo_4',
      user_name: 'David',
      user_photo: 'https://randomuser.me/api/portraits/men/19.jpg',
      car_brand: 'Renault',
      car_model: 'Trafic',
      car_color: 'gris',
      car_plate: '3456 JTZ',
      vehicle_type: 'van',
      price: 4,
      available_in_minutes: 4,
      address: 'Plaza de la Escandalera, Oviedo'
    },
    {
      id: 'demo_5',
      user_name: 'Lucía',
      user_photo: 'https://randomuser.me/api/portraits/women/12.jpg',
      car_brand: 'Peugeot',
      car_model: '208',
      car_color: 'rojo',
      car_plate: '7890 EUI',
      vehicle_type: 'car',
      price: 6,
      available_in_minutes: 12,
      address: 'Calle Gascona, Oviedo'
    }
  ];

  return base.map((baseAlert, i) => ({
    ...baseAlert,
    id: baseAlert.id,
    address: `${centerLat + offsets[i][0]}, ${centerLng + offsets[i][1]}`,
    available_in_minutes: baseAlert.available_in_minutes,
    price: baseAlert.price
  }));
}

export default function Home() {
  const urlParams = new URLSearchParams(window.location.search);
  const [mode, setMode] = useState('search');
  const [userLocation, setUserLocation] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [myAlerts, setMyAlerts] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [openSidebar, setOpenSidebar] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [showShared, setShowShared] = useState(false);
  const [filter, setFilter] = useState({});
  const queryClient = useQueryClient();

  // ====== Descargas ======
  const { data: alertsData, isLoading: loadingAlerts, refetch } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.ParkingAlert.filter({ status: 'active' })
  });

  const { data: wallet, isLoading: loadingWallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => base44.entities.UserWallet.get()
  });

  const createAlertMutation = useMutation({
    mutationFn: async (data) => {
      const currentUser = await base44.auth.me();

      // Crear alerta con timestamps correctos
      const now = new Date();
      const futureTime = new Date(now.getTime() + data.available_in_minutes * 60 * 1000);

      const payload = {
        user_id: currentUser?.id,
        user_email: currentUser?.email || currentUser?.id || '',
        created_by: currentUser?.email || currentUser?.id || '',
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        price: data.price,
        available_in_minutes: data.available_in_minutes,
        car_brand: data.car_brand || '',
        car_model: data.car_model || '',
        car_color: data.car_color || '',
        car_plate: data.car_plate || '',
        wait_until: futureTime.toISOString(),
        status: 'active'
      };

      return base44.entities.ParkingAlert.create(payload);
    },
    onSuccess: (newAlert) => {
      queryClient.setQueryData(['myAlerts', newAlert.user_id], (old = []) => [...old, newAlert]);
      queryClient.invalidateQueries(['myAlerts', newAlert.user_id]);
      window.location.href = createPageUrl('History');
    }
  });

  // ... (rest of Home component)
  return (
    <div>
      {/* Resto del código de la página Home */}
      <Button onClick={() => setOpenCreate(true)} className="mt-4">
        <Car className="w-14 h-14" strokeWidth={2.5} />
        ¡ Estoy aparcado aquí !
      </Button>
      <AnimatePresence>
        {openCreate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <CreateAlertCard
              address={address}
              onAddressChange={setAddress}
              onUseCurrentLocation={async () => {
                if ('geolocation' in navigator) {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    const { latitude, longitude } = pos.coords;
                    setUserLocation([latitude, longitude]);
                    setSelectedPosition({ lat: latitude, lng: longitude });
                  });
                }
              }}
              onCreateAlert={(data) => {
                if (!selectedPosition || !address) {
                  alert('Por favor, selecciona una ubicación en el mapa');
                  return;
                }
                const currentUser = user;
                const payload = {
                  latitude: selectedPosition.lat,
                  longitude: selectedPosition.lng,
                  address: address,
                  price: data.price,
                  available_in_minutes: data.minutes,
                  user_name: currentUser?.full_name?.split(' ')[0] || currentUser?.display_name || 'Usuario',
                  user_photo: currentUser?.photo_url || null,
                  car_brand: currentUser?.car_brand || 'Sin marca',
                  car_model: currentUser?.car_model || 'Sin modelo',
                  car_color: currentUser?.car_color || 'gris',
                  car_plate: currentUser?.car_plate || '0000XXX',
                  phone: currentUser?.phone || null,
                  allow_phone_calls: currentUser?.allow_phone_calls || false
                };
                createAlertMutation.mutate(payload);
              }}
              isLoading={createAlertMutation.isPending}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <BottomNav active="Home" />
    </div>
  );
}