import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline } from 'react-leaflet';
import { Car } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '@/components/ui/button';

// Fix para iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const carColors = {
  negro: '#1a1a1a',
  blanco: '#f5f5f5',
  gris: '#6b7280',
  rojo: '#ef4444',
  azul: '#3b82f6',
  verde: '#22c55e',
  amarillo: '#eab308',
  naranja: '#f97316',
  morado: '#a855f7',
  marron: '#92400e'
};

function createCarIcon(color, price, vehicleType = 'car') {
  const carColor = carColors[color] || '#6b7280';

  let vehicleSVG = '';

  if (vehicleType === 'van') {
    vehicleSVG = `
      <svg width="80" height="50" viewBox="0 0 48 30" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <path d="M6 12 L6 24 L42 24 L42 14 L38 12 Z" fill="${carColor}" stroke="white" stroke-width="1.5"/>
        <circle cx="14" cy="24" r="3" fill="#333" stroke="white" stroke-width="1"/>
        <circle cx="34" cy="24" r="3" fill="#333" stroke="white" stroke-width="1"/>
        <text x="24" y="20" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="9" font-weight="bold" stroke="black" stroke-width="0.8">${Math.round(price)}€</text>
      </svg>
    `;
  } else if (vehicleType === 'suv') {
    vehicleSVG = `
      <svg width="80" height="50" viewBox="0 0 48 30" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <path d="M8 18 L10 10 L16 8 L32 8 L38 10 L42 16 L42 24 L8 24 Z" fill="${carColor}" stroke="white" stroke-width="1.5"/>
        <circle cx="14" cy="24" r="4" fill="#333" stroke="white" stroke-width="1"/>
        <circle cx="36" cy="24" r="4" fill="#333" stroke="white" stroke-width="1"/>
        <text x="24" y="18" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="9" font-weight="bold" stroke="black" stroke-width="0.8">${Math.round(price)}€</text>
      </svg>
    `;
  } else {
    vehicleSVG = `
      <svg width="80" height="50" viewBox="0 0 48 30" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <path d="M8 20 L10 14 L16 12 L32 12 L38 14 L42 18 L42 24 L8 24 Z" fill="${carColor}" stroke="white" stroke-width="1.5"/>
        <circle cx="14" cy="24" r="4" fill="#333" stroke="white" stroke-width="1"/>
        <circle cx="14" cy="24" r="2" fill="#666"/>
        <circle cx="36" cy="24" r="4" fill="#333" stroke="white" stroke-width="1"/>
        <circle cx="36" cy="24" r="2" fill="#666"/>
        <text x="24" y="19" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="9" font-weight="bold" stroke="black" stroke-width="0.8">${Math.round(price)}€</text>
      </svg>
    `;
  }

  return L.divIcon({
    className: 'custom-car-marker',
    html: `
      <div style="position: relative; width: 80px; height: 50px;">
        ${vehicleSVG}
      </div>
    `,
    iconSize: [80, 50],
    iconAnchor: [40, 50],
    popupAnchor: [0, -50]
  });
}

// Crear icono de ubicación del usuario estilo Uber
function createUserLocationIcon() {
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <style>
        @keyframes pulse-purple {
          0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.7; transform: translateX(-50%) scale(1.1); }
        }
      </style>
      <div style="position: relative; width: 40px; height: 60px;">
        <div style="
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 35px;
          background: #a855f7;
        "></div>
        <div style="
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          width: 18px;
          height: 18px;
          background: #a855f7;
          border-radius: 50%;
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.8);
          animation: pulse-purple 1.5s ease-in-out infinite;
        "></div>
      </div>
    `,
    iconSize: [40, 60],
    iconAnchor: [20, 60]
  });
}

function LocationMarker({ position, setPosition, isSelecting }) {
  const map = useMapEvents({
    click(e) {
      if (isSelecting) {
        setPosition(e.latlng);
      }
    }
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null :
  <Marker position={position}>
    </Marker>;

}

function FlyToLocation({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 16);
    }
  }, [position, map]);

  return null;
}

const generateMockAlerts = (userLocation) => {
  const baseLocation = userLocation || [40.4168, -3.7038];
  return [
  {
    id: 'mock-1',
    latitude: baseLocation[0] + 0.0008,
    longitude: baseLocation[1] + 0.0008,
    price: 2.50,
    car_color: 'negro',
    car_brand: 'Toyota',
    car_model: 'Corolla',
    car_plate: '1234ABC',
    user_name: 'Diego R.',
    user_photo: 'https://xsgames.co/randomusers/assets/avatars/male/42.jpg',
    available_in_minutes: 15,
    vehicle_type: 'car'
  },
  {
    id: 'mock-2',
    latitude: baseLocation[0] - 0.0006,
    longitude: baseLocation[1] + 0.001,
    price: 3.00,
    car_color: 'rojo',
    car_brand: 'Seat',
    car_model: 'Ibiza',
    car_plate: '5678DEF',
    user_name: 'Laura V.',
    user_photo: 'https://xsgames.co/randomusers/assets/avatars/female/32.jpg',
    available_in_minutes: 20,
    vehicle_type: 'car'
  },
  {
    id: 'mock-3',
    latitude: baseLocation[0] + 0.001,
    longitude: baseLocation[1] - 0.0008,
    price: 2.00,
    car_color: 'azul',
    car_brand: 'Renault',
    car_model: 'Megane',
    car_plate: '9012GHI',
    user_name: 'Miguel Á.',
    user_photo: 'https://xsgames.co/randomusers/assets/avatars/male/67.jpg',
    available_in_minutes: 10,
    vehicle_type: 'suv'
  },
  {
    id: 'mock-4',
    latitude: baseLocation[0] - 0.001,
    longitude: baseLocation[1] - 0.0006,
    price: 3.50,
    car_color: 'blanco',
    car_brand: 'Audi',
    car_model: 'A3',
    car_plate: '3456JKL',
    user_name: 'Sofia M.',
    user_photo: 'https://xsgames.co/randomusers/assets/avatars/female/55.jpg',
    available_in_minutes: 25,
    vehicle_type: 'car'
  },
  {
    id: 'mock-5',
    latitude: baseLocation[0] + 0.003,
    longitude: baseLocation[1] - 0.001,
    price: 1.75,
    car_color: 'gris',
    car_brand: 'Peugeot',
    car_model: '308',
    car_plate: '7890MNO',
    user_name: 'Roberto L.',
    user_photo: 'https://xsgames.co/randomusers/assets/avatars/male/28.jpg',
    available_in_minutes: 18,
    vehicle_type: 'car'
  },
  {
    id: 'mock-6',
    latitude: baseLocation[0] - 0.0008,
    longitude: baseLocation[1] + 0.0009,
    price: 2.75,
    car_color: 'verde',
    car_brand: 'Volkswagen',
    car_model: 'Golf',
    car_plate: '2468PQR',
    user_name: 'Patricia N.',
    user_photo: 'https://xsgames.co/randomusers/assets/avatars/female/48.jpg',
    available_in_minutes: 22,
    vehicle_type: 'van'
  },
  {
    id: 'mock-7',
    latitude: baseLocation[0] + 0.0004,
    longitude: baseLocation[1] - 0.0009,
    price: 2.25,
    car_color: 'amarillo',
    car_brand: 'Honda',
    car_model: 'Civic',
    car_plate: '1357SUV',
    user_name: 'Andrea T.',
    user_photo: 'https://xsgames.co/randomusers/assets/avatars/female/19.jpg',
    available_in_minutes: 12,
    vehicle_type: 'car'
  },
  {
    id: 'mock-8',
    latitude: baseLocation[0] - 0.0009,
    longitude: baseLocation[1] - 0.0007,
    price: 2.90,
    car_color: 'azul',
    car_brand: 'Fiat',
    car_model: '500',
    car_plate: '2468FIA',
    user_name: 'Marco V.',
    user_photo: 'https://xsgames.co/randomusers/assets/avatars/male/74.jpg',
    available_in_minutes: 16,
    vehicle_type: 'car'
  }];

};

export default function ParkingMap({
  alerts = [],
  onAlertClick,
  isSelecting = false,
  selectedPosition,
  setSelectedPosition,
  userLocation,
  selectedAlert,
  showRoute = false,
  className = '',
  zoomControl = true,
  buyerLocations = []
}) {
  const defaultCenter = userLocation || [40.4168, -3.7038];
  const [route, setRoute] = useState(null);
  const [routeDistance, setRouteDistance] = useState(null);

  // Combinar alertas reales con mock alerts si no hay alertas
  const allAlerts = alerts.length > 0 ? alerts : generateMockAlerts(userLocation);

  // Calcular ruta cuando se selecciona una alerta
  useEffect(() => {
    if (showRoute && selectedAlert && userLocation) {
      const start = { lat: userLocation[0], lng: userLocation[1] };
      const end = { lat: selectedAlert.latitude, lng: selectedAlert.longitude };

      // Usar OSRM para calcular la ruta
      fetch(`https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`).
      then((res) => res.json()).
      then((data) => {
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map((coord) => [coord[1], coord[0]]);
          setRoute(coords);
          setRouteDistance((data.routes[0].distance / 1000).toFixed(2)); // km
        }
      }).
      catch((err) => console.log('Error calculando ruta:', err));
    } else {
      setRoute(null);
      setRouteDistance(null);
    }
  }, [showRoute, selectedAlert, userLocation]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <style>{`
        .leaflet-top.leaflet-left {
          top: 10px !important;
          left: 10px !important;
          z-index: 1000 !important;
          display: block !important;
          visibility: visible !important;
        }
        .leaflet-control-zoom {
          border: 1px solid rgba(168, 85, 247, 0.3) !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
          background: transparent !important;
          display: flex !important;
          flex-direction: column !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        .leaflet-control-zoom a {
          background-color: rgba(0, 0, 0, 0.7) !important;
          backdrop-filter: blur(4px) !important;
          color: white !important;
          border: none !important;
          width: 40px !important;
          height: 40px !important;
          line-height: 40px !important;
          font-size: 20px !important;
          font-weight: bold !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-decoration: none !important;
        }
        .leaflet-control-zoom a:hover {
          background-color: rgba(168, 85, 247, 0.8) !important;
        }
        .leaflet-control-zoom-in {
          border-bottom: 1px solid rgba(168, 85, 247, 0.3) !important;
          border-radius: 8px 8px 0 0 !important;
        }
        .leaflet-control-zoom-out {
          border-radius: 0 0 8px 8px !important;
        }
      `}</style>
      <MapContainer
        center={defaultCenter}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        className="rounded-2xl"
        zoomControl={zoomControl}
        key={`map-${zoomControl}`}>

        <TileLayer
          attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" />

        
        {userLocation && <FlyToLocation position={userLocation} />}
        
        {/* Marcador de ubicación del usuario estilo Uber */}
        {userLocation &&
        <Marker
          position={userLocation}
          icon={createUserLocationIcon()}
          draggable={isSelecting}>
          </Marker>
        }

        {/* Buyer locations (usuarios en camino - tracking en tiempo real) */}
        {buyerLocations.map((loc) =>
        <Marker
          key={loc.id}
          position={[loc.latitude, loc.longitude]}
          icon={L.divIcon({
            className: 'custom-buyer-icon',
            html: `
                <style>
                  @keyframes pulse-buyer {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                  }
                </style>
                <div style="
                  width: 40px; 
                  height: 40px; 
                  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  animation: pulse-buyer 2s infinite;
                ">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2L2 19h20L12 2z"/>
                  </svg>
                </div>
              `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          })}
          zIndexOffset={1500}>

            <Popup>Usuario en camino</Popup>
          </Marker>
        )}

        {isSelecting && selectedPosition && selectedPosition.lat !== userLocation?.[0] &&
        <Marker
          position={selectedPosition}
          icon={createUserLocationIcon()}>
          </Marker>
        }
        
        {/* Ruta */}
        {route &&
        <Polyline
          positions={route}
          color="#a855f7"
          weight={4}
          opacity={0.8}
          dashArray="10, 10" />

        }
        
        {/* Alertas */}
         {allAlerts.map((alert) =>
        <Marker
          key={alert.id}
          position={[alert.latitude, alert.longitude]}
          icon={createCarIcon(alert.car_color, alert.price, alert.vehicle_type)}
          eventHandlers={{
            click: () => onAlertClick && onAlertClick(JSON.parse(JSON.stringify(alert)))
          }}>
           </Marker>
        )}
      </MapContainer>


    </div>);

}