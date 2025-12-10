import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline } from 'react-leaflet';
import { Car, Navigation } from 'lucide-react';
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
      <svg width="40" height="28" viewBox="0 0 40 28" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <rect x="4" y="8" width="32" height="16" fill="${carColor}" stroke="white" stroke-width="2" rx="3"/>
        <rect x="8" y="4" width="24" height="8" fill="${carColor}" stroke="white" stroke-width="2" rx="2"/>
        <circle cx="12" cy="24" r="2" fill="#333"/>
        <circle cx="28" cy="24" r="2" fill="#333"/>
      </svg>
    `;
  } else if (vehicleType === 'suv') {
    vehicleSVG = `
      <svg width="40" height="28" viewBox="0 0 40 28" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <rect x="4" y="10" width="32" height="14" fill="${carColor}" stroke="white" stroke-width="2" rx="4"/>
        <rect x="10" y="5" width="20" height="8" fill="${carColor}" stroke="white" stroke-width="2" rx="2"/>
        <circle cx="12" cy="24" r="2.5" fill="#333"/>
        <circle cx="28" cy="24" r="2.5" fill="#333"/>
      </svg>
    `;
  } else {
    vehicleSVG = `
      <svg width="40" height="24" viewBox="0 0 40 24" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <rect x="4" y="10" width="32" height="10" fill="${carColor}" stroke="white" stroke-width="2" rx="3"/>
        <rect x="12" y="5" width="16" height="8" fill="${carColor}" stroke="white" stroke-width="2" rx="2"/>
        <circle cx="12" cy="20" r="2" fill="#333"/>
        <circle cx="28" cy="20" r="2" fill="#333"/>
      </svg>
    `;
  }

  return L.divIcon({
    className: 'custom-car-marker',
    html: `
      <div style="position: relative; width: 50px; height: 50px;">
        <div style="position: absolute; top: 12px; left: 5px;">
          ${vehicleSVG}
        </div>
        <div style="
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          background: #a855f7;
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 10px;
          white-space: nowrap;
        ">${Math.round(price)}€</div>
      </div>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 40],
    popupAnchor: [0, -40]
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
      map.flyTo(position, 16);
    }
  }, [position, map]);

  return null;
}

export default function ParkingMap({
  alerts = [],
  onAlertClick,
  isSelecting = false,
  selectedPosition,
  setSelectedPosition,
  userLocation,
  selectedAlert,
  showRoute = false,
  className = ''
}) {
  const defaultCenter = userLocation || [40.4168, -3.7038];
  const [route, setRoute] = useState(null);
  const [routeDistance, setRouteDistance] = useState(null);

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
    <div className={`relative ${className}`}>
      <MapContainer
        center={defaultCenter}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        className="rounded-2xl">

        <TileLayer
          attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" />

        
        {userLocation && <FlyToLocation position={userLocation} />}
        
        {/* Marcador de ubicación del usuario */}
        {userLocation &&
        <Marker position={userLocation}>
          </Marker>
        }
        
        {isSelecting &&
        <LocationMarker
          position={selectedPosition}
          setPosition={setSelectedPosition}
          isSelecting={isSelecting} />

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
        {alerts.map((alert) =>
        <Marker
          key={alert.id}
          position={[alert.latitude, alert.longitude]}
          icon={createCarIcon(alert.car_color, alert.price, alert.vehicle_type)}
          eventHandlers={{
            click: () => onAlertClick && onAlertClick(alert)
          }}>
          </Marker>
        )}
      </MapContainer>

      {/* Información de ruta */}
      {routeDistance &&
      <div className="bg-black/40 mr-8 ml-1 px-4 py-2 rounded-xl absolute top-4 right-4 z-[1000] backdrop-blur-sm border border-purple-500/30">
          <div className="flex items-center gap-2 text-white">
            <Navigation className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold">{routeDistance} km</span>
          </div>
        </div>
      }
    </div>);

}