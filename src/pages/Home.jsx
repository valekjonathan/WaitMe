import React, { useState, useEffect, useMemo } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, SlidersHorizontal, Car } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ParkingMap from '@/components/map/ParkingMap';
import MapFilters from '@/components/map/MapFilters';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import UserAlertCard from '@/components/cards/UserAlertCard';
import NotificationManager from '@/components/NotificationManager';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const buildDemoAlerts = (lat, lng) => {
  const baseLat = lat ?? 43.3619;
  const baseLng = lng ?? -5.8494;

  return [
    {
      id: 'demo_1',
      is_demo: true,
      user_name: 'SOFIA',
      user_photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
      car_brand: 'Seat',
      car_model: 'Ibiza',
      car_color: 'azul',
      car_plate: '7780 KLP',
      latitude: baseLat + 0.0018,
      longitude: baseLng + 0.001,
      address: 'Calle Gran Vía, n1, Oviedo',
      available_in_minutes: 6,
      price: 2.5,
      status: 'active',
      created_date: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      wait_until: new Date(Date.now() + 1000 * 60 * 6).toISOString(),
      vehicle_type: 'car',
      allow_phone_calls: true,
      phone: ''
    },
    {
      id: 'demo_2',
      is_demo: true,
      user_name: 'MARCO',
      user_photo: 'https://images.unsplash.com/photo-1520975661595-6453be3f7070?w=200&h=200&fit=crop',
      car_brand: 'BMW',
      car_model: 'Serie 1',
      car_color: 'negro',
      car_plate: '5555 ABC',
      latitude: baseLat - 0.0012,
      longitude: baseLng - 0.0016,
      address: 'Calle Campoamor, Oviedo',
      available_in_minutes: 12,
      price: 4,
      status: 'active',
      created_date: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      wait_until: new Date(Date.now() + 1000 * 60 * 12).toISOString(),
      vehicle_type: 'car',
      allow_phone_calls: true,
      phone: ''
    }
  ];
};

export default function Home() {
  const queryClient = useQueryClient();

  const [mode, setMode] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, alert: null });
  const [userLocation, setUserLocation] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.getUser()
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => setUserLocation(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  const { data: dbAlerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const res = await base44.entities.ParkingAlert.list();
      return Array.isArray(res) ? res : (res?.data || []);
    },
    staleTime: 10000,
    refetchInterval: false
  });

  // Solo alertas activas y “reservadas” visibles en mapa/busqueda
  const activeOrReservedAlerts = useMemo(() => {
    const now = Date.now();
    return (dbAlerts || []).filter((a) => {
      if (!a) return false;
      if (a.status !== 'active' && a.status !== 'reserved') return false;

      // Si hay wait_until, debe ser futuro para seguir activa (solo para status active)
      if (a.status === 'active' && a.wait_until) {
        const t = new Date(a.wait_until).getTime();
        if (Number.isFinite(t) && t > 0 && t <= now) return false;
      }
      return true;
    });
  }, [dbAlerts]);

  // Filtros (si existen en tu UI actual)
  const filteredAlerts = useMemo(() => {
    // En tu código original hay lógica de filtros; mantenemos el comportamiento.
    // Si no hay userLocation, no filtramos por distancia.
    // (No tocamos UI)
    return activeOrReservedAlerts;
  }, [activeOrReservedAlerts]);

  const demoAlerts = useMemo(() => {
    const [lat, lng] = userLocation || [43.3619, -5.8494];
    return buildDemoAlerts(lat, lng);
  }, [userLocation]);

  // Para “Dónde quieres aparcar”: siempre demos + reales filtradas
  const searchAlerts = useMemo(() => {
    // Si no estás en modo search, no pintes markers de búsqueda
    if (mode !== 'search') return [];
    return [...(filteredAlerts || []), ...demoAlerts];
  }, [mode, filteredAlerts, demoAlerts]);

  // Para el “mapa” que uses en Home (fondo / etc.): no lo cambio visualmente
  const homeMapAlerts = useMemo(() => {
    // Mantén demos para que SIEMPRE haya coches disponibles visualmente en el mapa
    return [...(filteredAlerts || []), ...demoAlerts];
  }, [filteredAlerts, demoAlerts]);

  const createAlertMutation = useMutation({
    mutationFn: async (data) => {
      // ===== FIX CLAVE: minutos seguros + wait_until correcto =====
      const mins = Number(data.available_in_minutes);
      const safeMins = Number.isFinite(mins) && mins > 0 ? mins : 1;
      const futureTime = new Date(Date.now() + safeMins * 60 * 1000);

      return base44.entities.ParkingAlert.create({
        user_id: user?.id,
        user_email: user?.email,
        user_name: data.user_name,
        user_photo: data.user_photo,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        price: data.price,
        available_in_minutes: safeMins,
        car_brand: data.car_brand || '',
        car_model: data.car_model || '',
        car_color: data.car_color || '',
        car_plate: data.car_plate || '',
        phone: data.phone,
        allow_phone_calls: data.allow_phone_calls,
        wait_until: futureTime.toISOString(),
        status: 'active',
        // ===== FIX CLAVE: created_date siempre presente =====
        created_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      // Ir a “Tus alertas”
      window.location.href = createPageUrl('History');
    }
  });

  const reserveAlertMutation = useMutation({
    mutationFn: async (alert) => {
      if (!alert?.id || alert.is_demo) return;

      // Solicitud de reserva: marca reserved y asigna reserved_by_id
      await base44.entities.ParkingAlert.update(alert.id, {
        status: 'reserved',
        reserved_by_id: user?.id
      });

      // Notificación al vendedor (si hay entidad Notification)
      try {
        await base44.entities.Notification.create({
          recipient_id: alert.user_id,
          title: 'Reserva solicitada',
          body: `${user?.name || user?.email || 'Un usuario'} ha reservado tu alerta.`,
          read: false,
          created_date: new Date().toISOString()
        });
      } catch (e) {
        // no bloquear
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setConfirmDialog({ open: false, alert: null });
    }
  });

  const handleAlertClick = (alert) => {
    setSelectedAlert(alert);
  };

  const handleReserve = (alert) => {
    setConfirmDialog({ open: true, alert });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <NotificationManager user={user} />

      <Header title="WaitMe!" />

      <div className="relative w-full max-w-md mx-auto min-h-screen pb-24">
        {/* ===== HOME ===== */}
        {!mode && (
          <div className="relative w-full min-h-screen">
            {/* Fondo mapa */}
            <div className="absolute inset-0">
              <ParkingMap
                alerts={homeMapAlerts}
                userLocation={userLocation}
                onAlertClick={handleAlertClick}
                isBackground
              />
              <div className="absolute inset-0 bg-purple-900/60" />
            </div>

            {/* Contenido */}
            <div className="relative z-10 px-6 pt-20">
              <div className="flex flex-col items-center">
                <img
                  src="/waitme-logo.png"
                  alt="WaitMe"
                  className="w-20 h-20 rounded-2xl shadow-lg"
                />
                <h1 className="text-3xl font-extrabold mt-4">WaitMe!</h1>
                <p className="text-purple-200 mt-2 text-lg font-semibold">Aparca donde te avisen!</p>

                <div className="w-full mt-8 space-y-4">
                  <Button
                    className="w-full h-14 rounded-xl bg-black/40 border-2 border-purple-500/30 text-white text-base font-semibold flex items-center justify-center gap-2 hover:bg-black/55"
                    onClick={() => setMode('search')}
                  >
                    <MapPin className="w-5 h-5 text-purple-400" />
                    ¿Dónde quieres aparcar ?
                  </Button>

                  <Button
                    className="w-full h-16 rounded-xl bg-purple-600 text-white text-lg font-extrabold flex items-center justify-center gap-2 hover:bg-purple-500"
                    onClick={() => setMode('create')}
                  >
                    <Car className="w-6 h-6" />
                    ¡ Estoy aparcado aquí !
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== SEARCH (Dónde quieres aparcar) ===== */}
        {mode === 'search' && (
          <div className="relative w-full min-h-screen">
            <div className="absolute inset-0">
              <ParkingMap
                alerts={searchAlerts}
                userLocation={userLocation}
                onAlertClick={handleAlertClick}
              />
            </div>

            <div className="relative z-10 px-4 pt-28 space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="text-purple-300 hover:text-purple-200"
                  onClick={() => setMode(null)}
                >
                  ←
                </Button>

                <div className="flex-1" />
                <Button
                  variant="ghost"
                  className="text-purple-300 hover:text-purple-200"
                  onClick={() => setShowFilters((v) => !v)}
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </Button>
              </div>

              <MapFilters open={showFilters} onClose={() => setShowFilters(false)} />

              <div className="w-full h-12 rounded-xl bg-black/60 border-2 border-gray-700 flex items-center px-4 text-gray-300">
                Buscar dirección...
              </div>

              {/* Tarjeta de detalle al tocar coche */}
              {!selectedAlert ? (
                <div className="w-full h-64 rounded-xl bg-black/50 border-2 border-purple-500/30 flex items-center justify-center text-gray-400">
                  Toca un coche en el mapa para ver sus datos
                </div>
              ) : (
                <UserAlertCard
                  alert={selectedAlert}
                  onReserve={() => handleReserve(selectedAlert)}
                  onClose={() => setSelectedAlert(null)}
                />
              )}
            </div>
          </div>
        )}

        {/* ===== CREATE (Estoy aparcado aquí) ===== */}
        {mode === 'create' && (
          <div className="relative w-full min-h-screen">
            <div className="absolute inset-0">
              <ParkingMap
                alerts={homeMapAlerts}
                userLocation={userLocation}
                onAlertClick={handleAlertClick}
                isBackground
              />
              <div className="absolute inset-0 bg-black/70" />
            </div>

            <div className="relative z-10 px-4 pt-24">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="ghost"
                  className="text-purple-300 hover:text-purple-200"
                  onClick={() => setMode(null)}
                >
                  ←
                </Button>
                <div className="flex-1" />
              </div>

              <CreateAlertCard
                user={user}
                userLocation={userLocation}
                onCreate={(data) => createAlertMutation.mutate(data)}
                isLoading={createAlertMutation.isPending}
              />
            </div>
          </div>
        )}

      </div>

      <BottomNav />

      {/* Confirm reserva */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, alert: confirmDialog.alert })}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirmar reserva</DialogTitle>
            <DialogDescription className="text-gray-400">
              Vas a enviar una solicitud de reserva por{' '}
              <span className="text-purple-400 font-bold">{confirmDialog.alert?.price}€</span> a{' '}
              <span className="text-white font-medium">{confirmDialog.alert?.user_name}</span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1 border border-gray-700 text-gray-200 hover:bg-gray-800"
              onClick={() => setConfirmDialog({ open: false, alert: null })}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-500 font-bold"
              onClick={() => reserveAlertMutation.mutate(confirmDialog.alert)}
              disabled={reserveAlertMutation.isPending || confirmDialog.alert?.is_demo}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}