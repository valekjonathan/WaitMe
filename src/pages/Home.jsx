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
  // offsets (~0.001 ≈ 110m) para que se vean “alrededor”
  const offsets = [
    [0.0009, 0.0006],
    [-0.0007, 0.0008],
    [0.0011, -0.0005],
    [-0.0010, -0.0007],
    [0.0004, -0.0011],
    [-0.0004, 0.0012]
  ];

  // 6 coches inventados (variados: coche/suv/van, precios, tiempo, fotos)
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
      user_name: 'Álvaro',
      user_photo: 'https://randomuser.me/api/portraits/men/65.jpg',
      car_brand: 'Kia',
      car_model: 'Sportage',
      car_color: 'gris',
      car_plate: '2468 GHT',
      vehicle_type: 'car',
      price: 6,
      available_in_minutes: 18,
      address: 'Calle Jovellanos, Oviedo'
    },
    {
      id: 'demo_4',
      user_name: 'Hugo',
      user_photo: 'https://randomuser.me/api/portraits/men/31.jpg',
      car_brand: 'Renault',
      car_model: 'Scénic',
      car_color: 'azul',
      car_plate: '7780 KLP',
      vehicle_type: 'car',
      price: 4,
      available_in_minutes: 0,
      address: 'Calle Independencia, Oviedo'
    },
    {
      id: 'demo_5',
      user_name: 'Lucía',
      user_photo: 'https://randomuser.me/api/portraits/women/33.jpg',
      car_brand: 'Citroen',
      car_model: 'Berlingo',
      car_color: 'blanco',
      car_plate: '9012 LVC',
      vehicle_type: 'van',
      price: 7,
      available_in_minutes: 25,
      address: 'Avda. Galicia, Oviedo'
    },
    {
      id: 'demo_6',
      user_name: 'Ana',
      user_photo: 'https://randomuser.me/api/portraits/women/66.jpg',
      car_brand: 'Toyota',
      car_model: 'Prius',
      car_color: 'rojo',
      car_plate: '3456 XYZ',
      vehicle_type: 'car',
      price: 2,
      available_in_minutes: 2,
      address: 'Calle Foncalada, Oviedo'
    }
  ];

  // aplicar offsets desde el centro dado
  return base.map((alert, i) => ({
    ...alert,
    latitude: centerLat + offsets[i][0],
    longitude: centerLng + offsets[i][1],
    // calcular "wait_until" (hora hasta la que espera) sumando minutos disponibles
    wait_until: new Date(Date.now() + (alert.available_in_minutes || 0) * 60000).toISOString()
  }));
}

export default function Home() {
  const [filters, setFilters] = useState({ maxPrice: 7, maxMinutes: 25, maxDistance: 1 });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [mode, setMode] = useState('search'); // 'search' (buscando aparcamiento) o 'publish' (publicando alerta)
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Ajustar el modo según la URL (si viene de Login)
  useEffect(() => {
    if (window.location.hash.includes('publish')) {
      setMode('publish');
    }
  }, []);

  // Obtener datos de usuario
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  // Obtener localización del usuario (para centro del mapa)
  const [userLocation, setUserLocation] = useState(null);
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
        }
      );
    }
  }, []);

  // Obtener lista de alertas alrededor (en modo búsqueda) o demo data si no hay
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts', filters],
    queryFn: async () => {
      try {
        // Filtrar alertas reales por los criterios (si se quisiera, en este demo devolvemos siempre demoAlerts)
        const center = userLocation || { latitude: 43.3619, longitude: -5.8494 }; // Oviedo centro por defecto
        return buildDemoAlerts(center.latitude, center.longitude);
      } catch (error) {
        console.log('Error:', error);
        return [];
      }
    }
  });
  const demoAlerts = useMemo(() => {
    const center = userLocation || { latitude: 43.3619, longitude: -5.8494 };
    return buildDemoAlerts(center.latitude, center.longitude);
  }, [userLocation]);

  // Alertas a mostrar en el mapa (demo o reales)
  const homeMapAlerts = alerts.length ? alerts : demoAlerts;

  // Mutations para crear o comprar alertas (placeholder, sin lógica real backend)
  const queryClient = useQueryClient();
  const createAlertMutation = useMutation({
    mutationFn: async (newAlert) => {
      // Aquí se llamaría a base44.entities.ParkingAlert.create(newAlert)
      console.log('Creando alerta...', newAlert);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
    }
  });
  const buyAlertMutation = useMutation({
    mutationFn: async (alert) => {
      console.log('Comprando alerta WaitMe!', alert);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
    }
  });

  // ===== Render del contenido según modo (buscar o publicar) =====
  return (
    <>
      {/* Header */}
      <Header
        title="WaitMe!"
        rightElement={
          mode === 'search' ? (
            <Button variant="ghost" size="icon" onClick={() => setFilterDialogOpen(true)}>
              <SlidersHorizontal className="w-6 h-6 text-purple-400" />
            </Button>
          ) : null
        }
      />

      {/* Contenido principal */}
      <main className="fixed inset-0 top-[60px] bottom-[88px] flex flex-col">
        {/* Panel de notificaciones emergentes */}
        <NotificationManager />

        {/* Modo Publicar (usuario va a dejar su plaza) */}
        {mode === 'publish' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 top-[60px] bottom-[88px] flex flex-col items-center justify-center px-4"
          >
            <p className="text-sm text-gray-400 mb-3 text-center">
              ¿Vas a dejar tu plaza de aparcamiento?
              <br />
              ¡Compártela y gana dinero con WaitMe!
            </p>
            <Button
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-2xl flex items-center justify-center gap-4"
              onClick={() => setConfirmDialog({ action: 'create_alert' })}
            >
              <Car className="w-14 h-14" strokeWidth={2.5} />
              ¡Estoy aparcado aquí!
            </Button>
          </motion.div>
        )}

        {/* Modo Buscar (usuario busca plaza para aparcar) */}
        {mode === 'search' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-[60px] bottom-[88px] flex flex-col justify-center"
            style={{ overflow: 'hidden', height: 'calc(100vh - 148px)' }}
          >
            <div className="h-[42%] relative px-3 pt-1 flex-shrink-0">
              <ParkingMap
                alerts={homeMapAlerts}
                userLocation={userLocation}
                selectedAlert={selectedAlert}
                onAlertClick={setSelectedAlert}
                className="absolute inset-0 w-full h-full"
                zoomControl={false}
                filters={filters}
              />
            </div>

            <div className="px-4 py-2">
              <div className="relative">
                <MapPin className="absolute top-2 left-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar dirección..."
                  className="w-full bg-gray-900 border border-gray-700 text-white pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="mt-3">
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-xl disabled:opacity-50 disabled:pointer-events-none"
                  disabled={!address}
                  onClick={() => setConfirmDialog({ action: 'navigate_to_address' })}
                >
                  Navegar a esta dirección
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Mapa de fondo (siempre presente detrás de los paneles) */}
        <div className="relative flex-1">
          <ParkingMap
            alerts={homeMapAlerts}
            userLocation={userLocation}
            selectedAlert={selectedAlert}
            onAlertClick={setSelectedAlert}
            className="absolute inset-0 w-full h-full"
            zoomControl={false}
            filters={filters}
          />
        </div>

        {/* Tarjeta de alerta seleccionada (o placeholder inicial) */}
        <AnimatePresence mode="popLayout">
          {mode === 'search' && (
            <motion.div
              key={selectedAlert ? selectedAlert.id : 'empty'}
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute bottom-4 left-4 right-4 z-40"
            >
              <UserAlertCard
                alert={selectedAlert}
                userLocation={userLocation}
                isEmpty={!selectedAlert}
                onBuyAlert={(alert) => buyAlertMutation.mutate(alert)}
                onChat={(alert) => {
                  // Iniciar chat (redireccionar a pantalla de chat)
                  window.location.href = createPageUrl('Chat', { alertId: alert.id });
                }}
                onCall={(alert) => {
                  // Llamar por teléfono (simulado: mostrar dialogo de confirmación)
                  setConfirmDialog({ action: 'call_user', payload: alert });
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tarjeta para crear nueva alerta (publicar WaitMe) */}
        {mode === 'publish' && (
          <div className="absolute bottom-4 left-4 right-4 z-40">
            <CreateAlertCard
              address={address}
              onAddressChange={setAddress}
              onCreateAlert={() => {
                createAlertMutation.mutate({
                  latitude: userLocation?.latitude,
                  longitude: userLocation?.longitude,
                  address
                });
                setConfirmDialog({ action: 'alert_created' });
                setAddress('');
              }}
              isLoading={createAlertMutation.isLoading}
            />
          </div>
        )}

        {/* Filtros de mapa (slider) */}
        <AnimatePresence>
          {filterDialogOpen && (
            <MapFilters
              filters={filters}
              onFilterChange={(newFilters) => {
                setFilters(newFilters);
                setFilterDialogOpen(false);
              }}
              onClose={() => setFilterDialogOpen(false)}
              alertsCount={alerts.length || demoAlerts.length}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer (Navegación inferior) */}
      <BottomNav
        currentPage={mode === 'search' ? 'Mapa' : 'Mapa'}  // En ambos modos sigue siendo la sección Mapa activa
        onNavChange={(page) => {
          if (page === 'Alertas') {
            window.location.href = createPageUrl('History');
          } else if (page === 'Mapa') {
            // Volver a modo búsqueda si estaba en publicar
            setMode('search');
          } else if (page === 'Notificaciones') {
            window.location.href = createPageUrl('Notifications');
          } else if (page === 'Chats') {
            window.location.href = createPageUrl('Chats');
          }
        }}
        onAdd={() => {
          // Botón central para publicar una nueva alerta
          setMode('publish');
        }}
      />

      {/* Dialogos de confirmación (acciones secundarias) */}
      {confirmDialog?.action === 'create_alert' && (
        <Dialog open onOpenChange={() => setConfirmDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publicar alerta</DialogTitle>
              <DialogDescription>
                ¿Confirmas que quieres publicar una alerta WaitMe! en tu ubicación actual?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setConfirmDialog(null);
                  setMode('publish'); // seguir en modo publicar tras crear
                  createAlertMutation.mutate({
                    latitude: userLocation?.latitude,
                    longitude: userLocation?.longitude,
                    address
                  });
                }}
              >
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {confirmDialog?.action === 'navigate_to_address' && (
        <Dialog open onOpenChange={() => setConfirmDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Navegar</DialogTitle>
              <DialogDescription>
                ¿Quieres ver cómo llegar a <strong>{address}</strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setConfirmDialog(null);
                  // Cambiar a pantalla de navegación (pasando alertId para simular)
                  window.location.href = createPageUrl('Navigate', { alertId: 'demo_1' });
                }}
              >
                Navegar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {confirmDialog?.action === 'call_user' && (
        <Dialog open onOpenChange={() => setConfirmDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Llamar al usuario</DialogTitle>
              <DialogDescription>
                ¿Quieres realizar una llamada de teléfono para coordinarte con <strong>{confirmDialog.payload.user_name}</strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setConfirmDialog(null);
                  // Simular llamada (aquí podría integrarse con alguna API de llamada)
                  alert('Llamando a ' + confirmDialog.payload.user_name + '...');
                }}
              >
                Llamar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {confirmDialog?.action === 'alert_created' && (
        <Dialog open onOpenChange={() => setConfirmDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¡Alerta publicada!</DialogTitle>
              <DialogDescription>
                Tu plaza de aparcamiento ha sido compartida en WaitMe.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => {
                  setConfirmDialog(null);
                  setMode('search'); // volver a modo búsqueda después de publicar
                }}
              >
                Entendido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}