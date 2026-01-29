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
  rosa: '#ec4899'
};

const createCarIcon = (color = 'gris', price = 0, vehicleType = 'car') => {
  const fillColor = carColors[color?.toLowerCase()] || carColors.gris;

  const isCar = (vehicleType || 'car') === 'car';

  const svgIcon = `
    <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <circle cx="22" cy="22" r="18" fill="#111827" stroke="#7c3aed" stroke-width="2"/>
        <circle cx="22" cy="22" r="14" fill="${fillColor}" opacity="0.9"/>
        <text x="22" y="27" text-anchor="middle" fill="#fff" font-family="Arial" font-size="12" font-weight="700">
          ${Number(price || 0).toFixed(2)}€
        </text>
      </g>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-car-icon',
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });
};

const MapAutoCenter = ({ userLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (userLocation && Array.isArray(userLocation)) {
      map.setView(userLocation, 15);
    }
  }, [userLocation, map]);

  return null;
};

const SelectLocation = ({ isSelecting, selectedPosition, setSelectedPosition }) => {
  useMapEvents({
    click(e) {
      if (!isSelecting) return;
      setSelectedPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });

  return selectedPosition ? (
    <Marker position={[selectedPosition.lat, selectedPosition.lng]} />
  ) : null;
};

export default function ParkingMap({
  alerts = [],
  userLocation,
  onAlertClick,
  selectedAlert,
  showRoute = false,
  isSelecting = false,
  selectedPosition,
  setSelectedPosition,
  zoomControl = true,
  className = ''
}) {
  const [routeCoordinates, setRouteCoordinates] = useState(null);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!showRoute || !selectedAlert || !userLocation) {
        setRouteCoordinates(null);
        return;
      }

      const lat = selectedAlert?.latitude ?? selectedAlert?.lat;
      const lng = selectedAlert?.longitude ?? selectedAlert?.lng;

      if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
        setRouteCoordinates(null);
        return;
      }

      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${lng},${lat}?overview=full&geometries=geojson`
        );
        const data = await res.json();
        const coords = data?.routes?.[0]?.geometry?.coordinates;

        if (coords && Array.isArray(coords)) {
          setRouteCoordinates(coords.map(([lon, lat]) => [lat, lon]));
        } else {
          setRouteCoordinates(null);
        }
      } catch {
        setRouteCoordinates(null);
      }
    };

    fetchRoute();
  }, [showRoute, selectedAlert, userLocation]);

  const center = userLocation || [43.3619, -5.8494];

  return (
    <div className={`w-full h-full rounded-2xl overflow-hidden ${className}`}>
      <MapContainer
        center={center}
        zoom={15}
        style={{ width: '100%', height: '100%' }}
        zoomControl={zoomControl}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapAutoCenter userLocation={userLocation} />

        <SelectLocation
          isSelecting={isSelecting}
          selectedPosition={selectedPosition}
          setSelectedPosition={setSelectedPosition}
        />

        {routeCoordinates && (
          <Polyline
            positions={routeCoordinates}
            weight={5}
            opacity={0.8}
            dashArray="10, 10"
          />
        )}

        {/* ✅ FIX TAREA 2: aceptar coords en latitude/longitude O lat/lng y no “pintar nada” si viene vacío */}
        {alerts
          .filter((a) => {
            const lat = a?.latitude ?? a?.lat;
            const lng = a?.longitude ?? a?.lng;
            return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
          })
          .map((alert) => {
            const lat = Number(alert.latitude ?? alert.lat);
            const lng = Number(alert.longitude ?? alert.lng);
            return (
              <Marker
                key={alert.id}
                position={[lat, lng]}
                icon={createCarIcon(alert.car_color, alert.price, alert.vehicle_type)}
                eventHandlers={{
                  click: () => onAlertClick && onAlertClick(alert)
                }}
              />
            );
          })}
      </MapContainer>
    </div>
  );
}