import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix iconos Leaflet (Vite)
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

function normalizeLatLng(input) {
  if (!input) return null;
  if (Array.isArray(input) && input.length === 2) {
    const lat = Number(input[0]);
    const lng = Number(input[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
    return null;
  }
  // objeto tipo {lat,lng} o {latitude,longitude}
  const lat = Number(input.lat ?? input.latitude);
  const lng = Number(input.lng ?? input.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
  return null;
}

function createCarIcon(color, price, vehicleType = 'car') {
  const carColor = carColors[color] || '#6b7280';
  const p = Number.isFinite(Number(price)) ? Math.round(Number(price)) : '';

  const svg =
    vehicleType === 'van'
      ? `
    <svg width="80" height="50" viewBox="0 0 48 30" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
      <path d="M6 12 L6 24 L42 24 L42 14 L38 12 Z" fill="${carColor}" stroke="white" stroke-width="1.5"/>
      <circle cx="14" cy="24" r="3" fill="#333" stroke="white" stroke-width="1"/>
      <circle cx="34" cy="24" r="3" fill="#333" stroke="white" stroke-width="1"/>
      <text x="24" y="20" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="9" font-weight="700" stroke="black" stroke-width="0.8">${p}€</text>
    </svg>`
      : vehicleType === 'suv'
      ? `
    <svg width="80" height="50" viewBox="0 0 48 30" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
      <path d="M8 18 L10 10 L16 8 L32 8 L38 10 L42 16 L42 24 L8 24 Z" fill="${carColor}" stroke="white" stroke-width="1.5"/>
      <circle cx="14" cy="24" r="4" fill="#333" stroke="white" stroke-width="1"/>
      <circle cx="36" cy="24" r="4" fill="#333" stroke="white" stroke-width="1"/>
      <text x="24" y="18" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="9" font-weight="700" stroke="black" stroke-width="0.8">${p}€</text>
    </svg>`
      : `
    <svg width="80" height="50" viewBox="0 0 48 30" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
      <path d="M8 20 L10 14 L16 12 L32 12 L38 14 L42 18 L42 24 L8 24 Z" fill="${carColor}" stroke="white" stroke-width="1.5"/>
      <circle cx="14" cy="24" r="4" fill="#333" stroke="white" stroke-width="1"/>
      <circle cx="14" cy="24" r="2" fill="#666"/>
      <circle cx="36" cy="24" r="4" fill="#333" stroke="white" stroke-width="1"/>
      <circle cx="36" cy="24" r="2" fill="#666"/>
      <text x="24" y="19" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="9" font-weight="700" stroke="black" stroke-width="0.8">${p}€</text>
    </svg>`;

  return L.divIcon({
    className: 'custom-car-marker',
    html: `<div style="position:relative;width:80px;height:50px;">${svg}</div>`,
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
        <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:2px;height:35px;background:#a855f7;"></div>
        <div style="position:absolute;bottom:30px;left:50%;transform:translateX(-50%);width:18px;height:18px;background:#a855f7;border-radius:50%;box-shadow:0 0 15px rgba(168,85,247,.8);animation:pulse-purple 1.5s ease-in-out infinite;"></div>
      </div>
    `,
    iconSize: [40, 60],
    iconAnchor: [20, 60]
  });
}

function FlyToLocation({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] != null && center[1] != null) {
      map.setView(center, Math.max(map.getZoom(), 16));
    }
  }, [center, map]);
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
  zoomControl = true,
  buyerLocations = []
}) {
  const normalizedUserLocation = useMemo(() => normalizeLatLng(userLocation), [userLocation]);
  const defaultCenter = normalizedUserLocation || [43.3619, -5.8494];

  const normalizedSelectedPosition = useMemo(() => {
    // acepta {lat,lng} o [lat,lng]
    if (!selectedPosition) return null;
    if (Array.isArray(selectedPosition)) return normalizeLatLng(selectedPosition);
    return normalizeLatLng({ lat: selectedPosition.lat, lng: selectedPosition.lng });
  }, [selectedPosition]);

  const [route, setRoute] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function calc() {
      if (!showRoute || !selectedAlert || !normalizedUserLocation) {
        setRoute(null);
        return;
      }

      const endLat = Number(selectedAlert.latitude ?? selectedAlert.lat);
      const endLng = Number(selectedAlert.longitude ?? selectedAlert.lng);
      if (!Number.isFinite(endLat) || !Number.isFinite(endLng)) {
        setRoute(null);
        return;
      }

      const start = { lat: normalizedUserLocation[0], lng: normalizedUserLocation[1] };

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${endLng},${endLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled) return;

        const coords = data?.routes?.[0]?.geometry?.coordinates;
        if (Array.isArray(coords)) {
          setRoute(coords.map(([lng, lat]) => [lat, lng]));
        } else {
          setRoute(null);
        }
      } catch {
        if (!cancelled) setRoute(null);
      }
    }

    calc();
    return () => {
      cancelled = true;
    };
  }, [showRoute, selectedAlert, normalizedUserLocation]);

  return (
    <div className={`relative ${className}`}>
      <style>{`
        .leaflet-top.leaflet-left {
          top: 10px !important;
          left: 10px !important;
          z-index: 1000 !important;
        }
        .leaflet-control-zoom {
          border: 1px solid rgba(168, 85, 247, 0.3) !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4) !important;
          background: transparent !important;
        }
        .leaflet-control-zoom a {
          background-color: rgba(0,0,0,0.7) !important;
          backdrop-filter: blur(4px) !important;
          color: white !important;
          border: none !important;
          width: 40px !important;
          height: 40px !important;
          line-height: 40px !important;
          font-size: 20px !important;
          font-weight: 700 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-decoration: none !important;
        }
        .leaflet-control-zoom a:hover { background-color: rgba(168,85,247,0.8) !important; }
        .leaflet-control-zoom-in { border-bottom: 1px solid rgba(168,85,247,0.3) !important; }
      `}</style>

      <MapContainer
        center={defaultCenter}
        zoom={16}
        zoomControl={zoomControl}
        className="rounded-2xl"
        style={{ height: '100%', width: '100%' }}
        key={`map-${zoomControl ? 1 : 0}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        />

        {normalizedUserLocation && <FlyToLocation center={normalizedUserLocation} />}

        {normalizedUserLocation && (
          <Marker position={normalizedUserLocation} icon={createUserLocationIcon()} draggable={false} />
        )}

        {Array.isArray(buyerLocations) &&
          buyerLocations
            .filter((loc) => Number.isFinite(Number(loc?.latitude)) && Number.isFinite(Number(loc?.longitude)))
            .map((loc) => (
              <Marker
                key={loc.id ?? `${loc.latitude}-${loc.longitude}`}
                position={[Number(loc.latitude), Number(loc.longitude)]}
                icon={L.divIcon({
                  className: 'custom-buyer-icon',
                  html: `
                    <style>
                      @keyframes pulse-buyer { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
                    </style>
                    <div style="
                      width:40px;height:40px;border-radius:50%;
                      background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);
                      border:3px solid white; box-shadow:0 4px 12px rgba(59,130,246,.6);
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
              >
                <Popup>Usuario en camino</Popup>
              </Marker>
            ))}

        {isSelecting && normalizedSelectedPosition && (
          <Marker
            position={normalizedSelectedPosition}
            icon={createUserLocationIcon()}
            eventHandlers={{
              click: () => {
                if (typeof setSelectedPosition === 'function') {
                  setSelectedPosition({ lat: normalizedSelectedPosition[0], lng: normalizedSelectedPosition[1] });
                }
              }
            }}
          />
        )}

        {route && (
          <Polyline positions={route} color="#a855f7" weight={4} opacity={0.85} dashArray="10, 10" />
        )}

        {Array.isArray(alerts) &&
          alerts
            .filter((a) => Number.isFinite(Number(a?.latitude)) && Number.isFinite(Number(a?.longitude)))
            .map((alert) => (
              <Marker
                key={alert.id ?? `${alert.latitude}-${alert.longitude}-${alert.price}`}
                position={[Number(alert.latitude), Number(alert.longitude)]}
                icon={createCarIcon(alert.car_color, alert.price, alert.vehicle_type)}
                eventHandlers={{
                  click: () => {
                    if (typeof onAlertClick === 'function') onAlertClick(alert);
                  }
                }}
              />
            ))}
      </MapContainer>
    </div>
  );
}