import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ParkingMap from '@/components/map/ParkingMap';
import SearchAlertCard from '@/components/cards/SearchAlertCard';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import ActiveAlertCard from '@/components/cards/ActiveAlertCard';
import { useAuth } from '@/lib/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState(null); // null | 'search' | 'create'
  const [userLocation, setUserLocation] = useState(null);

  // ====== Geolocalización ======
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  }, []);

  // ====== Lee mode de la URL (Home?mode=search) ======
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const m = sp.get('mode');
    if (m === 'search' || m === 'create') setMode(m);
    else setMode(null);
  }, [window.location.search]);

  const goHome = () => {
    window.location.href = createPageUrl('Home');
  };

  const goSearch = () => {
    window.location.href = createPageUrl('Home?mode=search');
  };

  const goCreate = () => {
    window.location.href = createPageUrl('Home?mode=create');
  };

  // ====== Datos reales (si existen) ======
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['nearbyAlerts'],
    queryFn: async () => {
      // Si tienes un endpoint real, cámbialo aquí. Esto mantiene tu comportamiento actual.
      try {
        return await base44.entities.ParkingAlert.filter({ status: 'active' });
      } catch (e) {
        return [];
      }
    }
  });

  // ====== 6 coches inventados alrededor de ti (estables, no cambian cada tick) ======
  const mockCars = useMemo(() => {
    const base = userLocation || [43.3619, -5.8494]; // Oviedo fallback
    const [lat, lng] = base;

    const mk = (dLat, dLng, obj) => ({
      id: obj.id,
      status: 'active',
      user_id: obj.user_id,
      user_email: obj.user_email,
      user_name: obj.user_name,
      user_photo: obj.user_photo,
      car_brand: obj.car_brand,
      car_model: obj.car_model,
      car_color: obj.car_color,
      car_plate: obj.car_plate,
      vehicle_type: obj.vehicle_type,
      address: obj.address,
      available_in_minutes: obj.available_in_minutes,
      price: obj.price,
      latitude: lat + dLat,
      longitude: lng + dLng,
      created_date: new Date(Date.now() - obj.createdAgoMs).toISOString()
    });

    return [
      mk(0.0012, 0.0010, {
        id: 'mock-1',
        user_id: 'seller-m1',
        user_email: 'm1@test.com',
        user_name: 'Sofía',
        user_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
        car_brand: 'Seat',
        car_model: 'Ibiza',
        car_color: 'rojo',
        car_plate: '7780KLP',
        vehicle_type: 'coche',
        address: 'Calle Campoamor, 15',
        available_in_minutes: 8,
        price: 3.0,
        createdAgoMs: 1000 * 60 * 4
      }),
      mk(-0.0010, 0.0007, {
        id: 'mock-2',
        user_id: 'seller-m2',
        user_email: 'm2@test.com',
        user_name: 'Hugo',
        user_photo: 'https://randomuser.me/api/portraits/men/32.jpg',
        car_brand: 'BMW',
        car_model: 'Serie 1',
        car_color: 'gris',
        car_plate: '2847BNM',
        vehicle_type: 'coche',
        address: 'Calle Fray Ceferino, 10',
        available_in_minutes: 5,
        price: 6.5,
        createdAgoMs: 1000 * 60 * 9
      }),
      mk(0.0005, -0.0012, {
        id: 'mock-3',
        user_id: 'seller-m3',
        user_email: 'm3@test.com',
        user_name: 'Nuria',
        user_photo: 'https://randomuser.me/api/portraits/women/44.jpg',
        car_brand: 'Audi',
        car_model: 'A3',
        car_color: 'azul',
        car_plate: '1209KLP',
        vehicle_type: 'coche',
        address: 'Calle Uría, 10',
        available_in_minutes: 12,
        price: 4.0,
        createdAgoMs: 1000 * 60 * 12
      }),
      mk(-0.0007, -0.0009, {
        id: 'mock-4',
        user_id: 'seller-m4',
        user_email: 'm4@test.com',
        user_name: 'Iván',
        user_photo: 'https://randomuser.me/api/portraits/men/75.jpg',
        car_brand: 'Toyota',
        car_model: 'Yaris',
        car_color: 'blanco',
        car_plate: '4444XYZ',
        vehicle_type: 'coche',
        address: 'Calle Jovellanos, 3',
        available_in_minutes: 6,
        price: 2.5,
        createdAgoMs: 1000 * 60 * 2
      }),
      mk(0.0015, -0.0003, {
        id: 'mock-5',
        user_id: 'seller-m5',
        user_email: 'm5@test.com',
        user_name: 'Marco',
        user_photo: 'https://randomuser.me/api/portraits/men/12.jpg',
        car_brand: 'Mercedes',
        car_model: 'Clase A',
        car_color: 'negro',
        car_plate: '9981JTR',
        vehicle_type: 'coche',
        address: 'Calle Rosal, 8',
        available_in_minutes: 9,
        price: 8.0,
        createdAgoMs: 1000 * 60 * 7
      }),
      mk(-0.0013, 0.0014, {
        id: 'mock-6',
        user_id: 'seller-m6',
        user_email: 'm6@test.com',
        user_name: 'Laura',
        user_photo: 'https://randomuser.me/api/portraits/women/21.jpg',
        car_brand: 'Volkswagen',
        car_model: 'Golf',
        car_color: 'amarillo',
        car_plate: '3112HMD',
        vehicle_type: 'coche',
        address: 'Plaza Longoria Carbajal, 1',
        available_in_minutes: 15,
        price: 5.0,
        createdAgoMs: 1000 * 60 * 14
      })
    ];
  }, [userLocation]);

  // ====== Lo que se muestra en “Dónde quieres aparcar” (search) ======
  const searchAlerts = useMemo(() => {
    // mezcla reales + mocks (mocks primero para que siempre veas ejemplos)
    const real = Array.isArray(alerts) ? alerts : [];
    const merged = [...mockCars, ...real];

    // quita duplicados por id
    const seen = new Set();
    return merged.filter((a) => {
      const k = String(a?.id ?? '');
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [alerts, mockCars]);

  // ====== Puntos del mapa ======
  const mapAlerts = useMemo(() => {
    // En Home principal (null) también se ven los coches del ejemplo en el mapa
    if (mode === 'search') return searchAlerts;
    return mockCars;
  }, [mode, searchAlerts, mockCars]);

  // ====== Layout ======
  const mainHeight = 'calc(100vh - 56px - 80px)'; // header + bottomNav
  const mapHeight = mode === 'create' ? '40%' : '55%';

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="WaitMe!" showBackButton={false} />

      <main className="pt-[56px] pb-20">
        {/* Mapa siempre detrás en Home (sin tocar el resto de tu UI) */}
        <div style={{ height: mainHeight }} className="relative w-full">
          <div className="absolute inset-0">
            <ParkingMap userLocation={userLocation} alerts={mapAlerts} />
          </div>

          {/* Capa de contenido */}
          <div className="absolute inset-0 flex flex-col px-4">
            {/* Espacio arriba para que se vea el mapa */}
            <div className="w-full" style={{ height: mapHeight }} />

            {/* Tarjeta inferior */}
            <div className="flex-1 flex flex-col justify-end pb-3">
              {mode === null ? (
                <div className="bg-black/55 backdrop-blur-md rounded-2xl border border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.18)] p-3">
                  <div className="text-center font-semibold mb-2">¿Dónde estás aparcado?</div>

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={goSearch}
                      className="w-full rounded-xl border border-purple-500/40 bg-purple-600/20 hover:bg-purple-600/25 transition px-4 py-3 font-semibold"
                    >
                      Dónde quieres aparcar
                    </button>

                    <button
                      type="button"
                      onClick={goCreate}
                      className="w-full rounded-xl border border-purple-500/40 bg-purple-600/20 hover:bg-purple-600/25 transition px-4 py-3 font-semibold"
                    >
                      Estoy aparcado aquí
                    </button>
                  </div>
                </div>
              ) : null}

              {mode === 'search' ? (
                <div className="bg-black/55 backdrop-blur-md rounded-2xl border border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.18)] p-3 max-h-[45vh] overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">Dónde quieres aparcar</div>
                    <button
                      type="button"
                      onClick={goHome}
                      className="text-sm text-purple-300 hover:text-purple-200"
                    >
                      Volver
                    </button>
                  </div>

                  {isLoading ? (
                    <div className="text-center py-10 text-gray-400">
                      <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                      Cargando...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {searchAlerts.map((a) => (
                        <SearchAlertCard
                          key={a.id}
                          alert={a}
                          onOpen={() =>
                            (window.location.href = createPageUrl(
                              `AlertDetails?alertId=${a.id}&userId=${a.user_email || a.user_id}`
                            ))
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {mode === 'create' ? (
                <div className="bg-black/55 backdrop-blur-md rounded-2xl border border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.18)] p-3 max-h-[55vh] overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">Estoy aparcado aquí</div>
                    <button
                      type="button"
                      onClick={goHome}
                      className="text-sm text-purple-300 hover:text-purple-200"
                    >
                      Volver
                    </button>
                  </div>

                  {/* Aquí mantengo tu flujo tal cual: Create / Active según tu app */}
                  <div className="space-y-2 overflow-y-auto max-h-[48vh] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <ActiveAlertCard
                      userLocation={userLocation}
                      onRefresh={() => queryClient.invalidateQueries({ queryKey: ['nearbyAlerts'] })}
                    />
                    <CreateAlertCard
                      userLocation={userLocation}
                      onCreated={() => queryClient.invalidateQueries({ queryKey: ['nearbyAlerts'] })}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}