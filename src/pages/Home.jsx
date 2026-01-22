import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import UserCard from '@/components/cards/UserCard';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, Loader2, X } from 'lucide-react';

function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position && Array.isArray(position) && position.length === 2) {
      const [lat, lng] = position;
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        map.flyTo(position, 15, { duration: 0.7 });
      }
    }
  }, [position, map]);
  return null;
}

const carIcon = (color = '#A855F7') =>
  L.divIcon({
    className: '',
    html: `
    <div style="
      width:36px;height:22px;border-radius:12px;
      background:${color};
      border:2px solid rgba(255,255,255,0.8);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 8px 18px rgba(0,0,0,.35);
      font-weight:800;font-size:12px;color:#0b0b0b;">
      🚗
    </div>
  `,
    iconSize: [36, 22],
    iconAnchor: [18, 11]
  });

export default function Home() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search || '');
  const initialMode = urlParams.get('mode');

  const [mode, setMode] = useState(initialMode || null); // null | 'search' | 'create'
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [center, setCenter] = useState([43.3619, -5.8494]); // Oviedo aprox
  const mapRef = useRef(null);

  // Resetear mode cuando se navega a Home sin parámetros (al volver desde menú)
  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    if (!params.has('mode')) setMode(null);
  }, [location.search]);

  // Si se pulsa "Mapa" en el menú inferior, volvemos al Home principal sin recargar
  useEffect(() => {
    if (location.state?.resetHome) {
      setMode(null);
      setSelectedAlert(null);
      setShowFilters(false);
      setSearchQuery('');
    }
  }, [location.state]);

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        setLoadingUser(true);
        const me = await base44.auth.me();
        if (!mounted) return;
        setUser(me);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoadingUser(false);
      }
    };
    fetchUser();
    return () => {
      mounted = false;
    };
  }, []);

  // Datos demo de coches alrededor
  const demoCars = useMemo(
    () => [
      {
        id: 'c1',
        name: 'Sofía',
        car: 'SEAT Ibiza',
        plate: '1234 KLM',
        price: 3,
        eta: 6,
        address: 'Calle Uría, Oviedo',
        lat: 43.3626,
        lng: -5.8484,
        photo:
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80',
        color: '#A855F7'
      },
      {
        id: 'c2',
        name: 'Marco',
        car: 'BMW Serie 3',
        plate: '2847 BNM',
        price: 4,
        eta: 11,
        address: 'Calle Gran Vía, Oviedo',
        lat: 43.3613,
        lng: -5.8466,
        photo:
          'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?auto=format&fit=crop&w=256&q=80',
        color: '#22C55E'
      },
      {
        id: 'c3',
        name: 'Lucía',
        car: 'Toyota Yaris',
        plate: '9152 JTR',
        price: 2,
        eta: 4,
        address: 'Plaza Longoria, Oviedo',
        lat: 43.3622,
        lng: -5.8469,
        photo:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
        color: '#EF4444'
      },
      {
        id: 'c4',
        name: 'Hugo',
        car: 'Volkswagen Golf',
        plate: '7701 LVP',
        price: 5,
        eta: 8,
        address: 'C. San Francisco, Oviedo',
        lat: 43.3629,
        lng: -5.8502,
        photo:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
        color: '#3B82F6'
      },
      {
        id: 'c5',
        name: 'Paula',
        car: 'Renault Clio',
        plate: '4420 MKS',
        price: 4,
        eta: 7,
        address: 'Calle Campoamor, Oviedo',
        lat: 43.3608,
        lng: -5.8489,
        photo:
          'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=256&q=80',
        color: '#F59E0B'
      },
      {
        id: 'c6',
        name: 'Diego',
        car: 'Peugeot 208',
        plate: '1039 HBR',
        price: 6,
        eta: 12,
        address: 'Calle Rosal, Oviedo',
        lat: 43.3618,
        lng: -5.8512,
        photo:
          'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=256&q=80',
        color: '#10B981'
      }
    ],
    []
  );

  const filteredCars = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return demoCars;
    return demoCars.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.car.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        String(c.price).includes(q)
    );
  }, [demoCars, searchQuery]);

  const handleSelectCar = (car) => {
    if (!car || typeof car.lat !== 'number' || typeof car.lng !== 'number') return;
    if (isNaN(car.lat) || isNaN(car.lng)) return;
    setSelectedAlert(car);
    setCenter([car.lat, car.lng]);
  };

  const validCenter = useMemo(() => {
    if (Array.isArray(center) && center.length === 2) {
      const [lat, lng] = center;
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        return center;
      }
    }
    return [43.3619, -5.8494]; // Fallback to Oviedo
  }, [center]);

  const renderMainCard = () => {
    if (loadingUser) {
      return (
        <div className="w-full bg-gray-900/60 border border-purple-500/30 rounded-2xl p-4 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
          <span className="text-sm text-gray-200">Cargando...</span>
        </div>
      );
    }

    const sofia = demoCars[0];

    return (
      <div className="space-y-2">
        <UserCard user={sofia} />
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700 rounded-lg h-9"
          onClick={() => setMode('search')}
        >
          WaitMe!
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="WaitMe!" />

      {/* CONTENIDO */}
      <div className="pt-[60px] pb-[88px]">
        {/* HOME (principal) */}
        {mode === null && (
          <div className="max-w-md mx-auto px-3 space-y-3">
            {/* MAPA */}
            <div className="rounded-2xl overflow-hidden border border-purple-500/30 shadow-lg">
              <div className="h-[230px]">
                <MapContainer
                  center={validCenter}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                  whenCreated={(map) => {
                    mapRef.current = map;
                  }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {demoCars.map((c) => (
                    <Marker
                      key={c.id}
                      position={[c.lat, c.lng]}
                      icon={carIcon(c.color)}
                      eventHandlers={{
                        click: () => handleSelectCar(c)
                      }}
                    >
                      <Popup>
                        <div className="text-sm">
                          <div className="font-bold">{c.name}</div>
                          <div>{c.car}</div>
                          <div className="font-bold">{c.price}€</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  <FlyTo position={validCenter} />
                </MapContainer>
              </div>
            </div>

            {/* BUSCADOR */}
            <div className="bg-gray-900/50 border border-purple-500/30 rounded-xl px-3 py-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar dirección..."
                className="bg-transparent border-none text-gray-200 placeholder:text-gray-500 focus-visible:ring-0"
              />
            </div>

            {/* CARD PRINCIPAL */}
            {renderMainCard()}

            {/* BOTONES */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                className="bg-purple-600 hover:bg-purple-700 rounded-xl"
                onClick={() => setMode('search')}
              >
                ¿Dónde quieres aparcar?
              </Button>
              <Button
                className="bg-gray-800 hover:bg-gray-700 rounded-xl border border-purple-500/30"
                onClick={() => setMode('create')}
              >
                Estoy aparcado aquí
              </Button>
            </div>
          </div>
        )}

        {/* BUSCAR APARCAMIENTO */}
        {mode === 'search' && (
          <div className="fixed inset-x-0 top-[60px] bottom-[88px] max-w-md mx-auto flex flex-col">
            <div className="px-3 pt-3 pb-2 flex items-center justify-between">
              <div className="text-sm font-bold text-white">
                ¿Dónde quieres aparcar?
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="text-purple-300 hover:text-purple-200"
                  onClick={() => setShowFilters((v) => !v)}
                >
                  <Filter className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  className="text-gray-300 hover:text-white"
                  onClick={() => {
                    setMode(null);
                    setSelectedAlert(null);
                    setSearchQuery('');
                    setShowFilters(false);
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="px-3">
              <div className="rounded-2xl overflow-hidden border border-purple-500/30 shadow-lg">
                <div className="h-[42%] min-h-[220px]">
                  <MapContainer
                    center={validCenter}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {filteredCars.map((c) => (
                      <Marker
                        key={c.id}
                        position={[c.lat, c.lng]}
                        icon={carIcon(c.color)}
                        eventHandlers={{
                          click: () => handleSelectCar(c)
                        }}
                      />
                    ))}
                    <FlyTo position={validCenter} />
                  </MapContainer>
                </div>
              </div>
            </div>

            <div className="px-3 pt-2">
              <div className="bg-gray-900/50 border border-purple-500/30 rounded-xl px-3 py-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar dirección..."
                  className="bg-transparent border-none text-gray-200 placeholder:text-gray-500 focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
              {selectedAlert ? (
                <div className="space-y-2">
                  <UserCard user={selectedAlert} />
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 rounded-lg h-9"
                    onClick={() => console.log('Reservar')}
                  >
                    WaitMe!
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCars.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCar(c)}
                      className="w-full text-left bg-gray-900/50 border border-purple-500/20 rounded-xl px-3 py-2 hover:border-purple-500/40"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm">{c.name}</div>
                        <div className="font-bold text-purple-300">
                          {c.price}€
                        </div>
                      </div>
                      <div className="text-xs text-gray-300">{c.car}</div>
                      <div className="text-xs text-gray-500">{c.address}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CREAR ALERTA (poner alerta) */}
        {mode === 'create' && (
          <div className="fixed inset-x-0 top-[60px] bottom-[88px] max-w-md mx-auto flex flex-col">
            <div className="px-3 pt-3 pb-2 flex items-center justify-between">
              <div className="text-sm font-bold text-white">
                ¿Dónde estás aparcado?
              </div>
              <Button
                variant="ghost"
                className="text-gray-300 hover:text-white"
                onClick={() => setMode(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="px-3">
              <div className="rounded-2xl overflow-hidden border border-purple-500/30 shadow-lg">
                <div className="h-[40%] min-h-[210px]">
                  <MapContainer
                    center={validCenter}
                    zoom={16}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={validCenter} />
                    <FlyTo position={validCenter} />
                  </MapContainer>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden px-3 pb-2 pt-2">
              <CreateAlertCard
                initialAddress="Calle Campoamor, 13"
                onPublish={() => setMode(null)}
              />
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}