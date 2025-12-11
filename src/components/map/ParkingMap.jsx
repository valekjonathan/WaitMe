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
  className = '',
  zoomControl = true
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
      <style>{`
        .leaflet-top.leaflet-left {
          top: 10px !important;
          left: 10px !important;
        }
        .leaflet-control-zoom {
          border: 2px solid rgba(168, 85, 247, 0.5) !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
        }
        .leaflet-control-zoom a {
          background-color: rgba(0, 0, 0, 0.7) !important;
          backdrop-filter: blur(10px) !important;
          color: white !important;
          border: none !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 20px !important;
          font-weight: bold !important;
        }
        .leaflet-control-zoom a:hover {
          background-color: rgba(168, 85, 247, 0.9) !important;
        }
        .leaflet-control-zoom-in {
          border-bottom: 1px solid rgba(168, 85, 247, 0.3) !important;
        }
      `}</style>
      <MapContainer
        center={defaultCenter}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        className="rounded-2xl"
        zoomControl={true}>

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


    </div>);

}