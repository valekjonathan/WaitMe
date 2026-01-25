import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix iconos Leaflet
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

const isFiniteNum = (n) => Number.isFinite(n);

const normalizeLatLng = (loc) => {
  if (!loc) return null;

  // [lat,lng]
  if (Array.isArray(loc) && loc.length === 2) {
    const lat = Number(loc[0]);
    const lng = Number(loc[1]);
    if (isFiniteNum(lat) && isFiniteNum(lng)) return [lat, lng];
    return null;
  }

  // {lat,lng} o {latitude,longitude}
  if (typeof loc === 'object') {
    const lat = Number(loc.latitude ?? loc.lat);
    const lng = Number(loc.longitude ?? loc.lng);
    if (isFiniteNum(lat) && isFiniteNum(lng)) return [lat, lng];
  }

  return null;
};

function createCarIcon(colorName, price, vehicleType = 'car') {
  const carColor = carColors[colorName] || '#6b7280';
  const p = Number(price);
  const priceText = Number.isFinite(p) ? `${Math.round(p)}€` : '€';

  let vehicleSVG = '';

  if (vehicleType === 'van') {
    vehicleSVG = `
      <svg width="80" height="50" viewBox="0 0 48 30" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <path d="M6 12 L6 24 L42 24 L42 14 L38 12 Z" fill="${carColor}" stroke="white" stroke-width="1.5"/>
        <circle cx="14" cy="24" r="3" fill="#333" stroke="white" stroke-width="1"/>
        <circle cx="34" cy="24" r="3" fill="#333" stroke="white" stroke-width="1"/>
        <text x="24" y="20" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="9" font-weight="bold" stroke="black" stroke-width="0.8">${priceText}</text>
      </svg>
    `;
  } else if (vehicleType === 'suv') {
    vehicleSVG = `
      <svg width="80" height="50" viewBox="0 0 48 30" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <path d="M8 18 L10 10 L16 8 L32 8 L38 10 L42 16 L42 24 L8 24 Z" fill="${carColor}" stroke="white" stroke-width="1.5"/>
        <circle cx="14" cy="24" r="4" fill="#333" stroke="white" stroke-width="1"/>
        <circle cx="36" cy="24" r="4" fill="#333" stroke="white" stroke-width="1"/>
        <text x="24" y="18" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="9" font-weight="bold" stroke="black" stroke-width="0.8">${priceText}</text>
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
        <text x="24" y="19" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="9" font-weight="bold" stroke="black" stroke-width="0.8">${priceText}</text>
      </svg>
    `;
  }

  return L.divIcon({
    className: 'custom-car-marker',
    html: `<div style="position: relative; width: 80px; height: 50px;">${vehicleSVG}</div>`,
    iconSize: [80, 50],
    iconAnchor: [40, 50],
    popupAnchor: [0, -50]
  });
}

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

function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    const p = normalizeLatLng(position);
    if (p) map.setView(p, 16);
  }, [position, map]);
  return null;
}

function SelectPositionMarker({ isSelecting, selectedPosition, setSelectedPosition }) {
  useMapEvents({
    click(e) {
      if (!isSelecting) return;
      setSelectedPosition?.(e.latlng);
    }
  });

  if (!isSelecting) return null;
  if (!selectedPosition) return null;

  const p = normalizeLatLng(selectedPosition) || (selectedPosition.lat != null && selectedPosition.lng != null
    ? [Number(selectedPosition.lat), Number(selectedPosition.lng)]
    : null);

  if (!p) return null;

  return <Marker position={p} icon={createUserLocationIcon()} />;
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
  zoomControl = true,
  buyerLocations = []
}) {
  const normalizedUserLocation = useMemo(() => normalizeLatLng(userLocation), [userLocation]);
  const defaultCenter = normalizedUserLocation || [43.3619, -5.8494];

  const [route, setRoute] = useState(null);

  useEffect(() => {
    const userP = normalizedUserLocation;
    if (!showRoute || !selectedAlert || !userP) {
      setRoute(null);
      return;
    }

    const endLat = Number(selectedAlert.latitude ?? selectedAlert.lat);
    const endLng = Number(selectedAlert.longitude ?? selectedAlert.lng);

    if (!isFiniteNum(endLat) || !isFiniteNum(endLng)) {
      setRoute(null);
      return;
    }

    const start = { lat: userP[0], lng: userP[1] };
    const end = { lat: endLat, lng: endLng };

    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data?.routes?.[0]?.geometry?.coordinates) {
          const coords = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
          setRoute(coords);
        } else {
          setRoute(null);
        }
      })
      .catch(() => setRoute(null));
  }, [showRoute, selectedAlert, normalizedUserLocation]);

  return (
    <div className={`relative ${className}`}>
      <style>{`
        .leaflet-top.leaflet-left { top: 10px !important; left: 10px !important; z-index: 1000 !important; }
        .leaflet-control-zoom {
          border: 1px solid rgba(168, 85, 247, 0.3) !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 0 2px 8px rgba(0,0,0,.4) !important;
          background: transparent !important;
        }
        .leaflet-control-zoom a{
          background-color: rgba(0,0,0,.7) !important;
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
        .leaflet-control-zoom a:hover{ background-color: rgba(168, 85, 247, .8) !important; }
        .leaflet-control-zoom-in{ border-bottom: 1px solid rgba(168, 85, 247, 0.3) !important; }
      `}</style>

      <MapContainer
        center={defaultCenter}
        zoom={16}
        zoomControl={zoomControl}
        style={{ height: '100%', width: '100%' }}
        className="rounded-2xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        />

        {normalizedUserLocation && <FlyToLocation position={normalizedUserLocation} />}

        {normalizedUserLocation && (
          <Marker position={normalizedUserLocation} icon={createUserLocationIcon()} />
        )}

        <SelectPositionMarker
          isSelecting={isSelecting}
          selectedPosition={selectedPosition}
          setSelectedPosition={setSelectedPosition}
        />

        {Array.isArray(buyerLocations) &&
          buyerLocations
            .filter((loc) => isFiniteNum(Number(loc?.latitude)) && isFiniteNum(Number(loc?.longitude)))
            .map((loc) => (
              <Marker
                key={loc.id ?? `${loc.latitude}-${loc.longitude}`}
                position={[Number(loc.latitude), Number(loc.longitude)]}
                icon={L.divIcon({
                  className: 'custom-buyer-icon',
                  html: `
                    <style>@keyframes pulse-buyer{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}</style>
                    <div style="
                      width:40px;height:40px;
                      background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);
                      border:3px solid white;border-radius:50%;
                      box-shadow:0 4px 12px rgba(59,130,246,.6);
                      display:flex;align-items:center;justify-content:center;
                      animation:pulse-buyer 2s infinite;">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2L2 19h20L12 2z"/>
                      </svg>
                    </div>
                  `,
                  iconSize: [40, 40],
                  iconAnchor: [20, 20]
                })}
                zIndexOffset={1500}
              />
            ))}

        {route && (
          <Polyline positions={route} color="#a855f7" weight={4} opacity={0.85} dashArray="10, 10" />
        )}

        {Array.isArray(alerts) &&
          alerts
            .filter((a) => a && isFiniteNum(Number(a.latitude ?? a.lat)) && isFiniteNum(Number(a.longitude ?? a.lng)))
            .map((alert) => {
              const lat = Number(alert.latitude ?? alert.lat);
              const lng = Number(alert.longitude ?? alert.lng);
              return (
                <Marker
                  key={alert.id ?? `${lat}-${lng}`}
                  position={[lat, lng]}
                  icon={createCarIcon(alert.car_color, alert.price, alert.vehicle_type)}
                  eventHandlers={{
                    click: () => {
                      try {
                        onAlertClick?.(alert);
                      } catch {
                        // evita pantalla en blanco por error del handler
                      }
                    }
                  }}
                />
              );
            })}
      </MapContainer>
    </div>
  );
}