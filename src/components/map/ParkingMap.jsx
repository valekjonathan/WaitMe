import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

/**
 * ParkingMap (robusto)
 * - Evita pantallas en blanco por coordenadas inválidas
 * - Normaliza userLocation
 * - Detiene propagación del click del marker (evita recargas/eventos raros)
 */

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const carColors = {
  blanco: '#FFFFFF',
  negro: '#1a1a1a',
  rojo: '#ef4444',
  azul: '#3b82f6',
  amarillo: '#facc15',
  gris: '#6b7280',
  verde: '#22c55e'
};

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeLatLng(v) {
  // acepta [lat,lng] o {lat,lng} o {latitude,longitude}
  if (!v) return null;
  if (Array.isArray(v) && v.length === 2) {
    const lat = toNumber(v[0]);
    const lng = toNumber(v[1]);
    return lat != null && lng != null ? [lat, lng] : null;
  }
  if (typeof v === 'object') {
    const lat = toNumber(v.lat ?? v.latitude);
    const lng = toNumber(v.lng ?? v.lon ?? v.longitude);
    return lat != null && lng != null ? [lat, lng] : null;
  }
  return null;
}

function createCarIcon(colorValue, price, vehicleType) {
  const color = carColors[(colorValue || '').toLowerCase()] || '#a855f7';
  const label = `${Math.round(Number(price) || 0)}€`;

  const html = `
    <div style="
      position:relative;
      width:46px;height:46px;
      display:flex;align-items:center;justify-content:center;
      transform:translate(-50%,-50%);
    ">
      <div style="
        width:46px;height:46px;border-radius:16px;
        background: rgba(0,0,0,.78);
        border:2px solid rgba(168,85,247,.65);
        box-shadow:0 6px 16px rgba(0,0,0,.45);
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        gap:2px;
      ">
        <div style="font-size:12px;font-weight:800;color:white;line-height:1;">${label}</div>
        <div style="width:18px;height:18px;display:flex;align-items:center;justify-content:center;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 16c0 1.1.9 2 2 2h1a2 2 0 0 0 4 0h2a2 2 0 0 0 4 0h1c1.1 0 2-.9 2-2v-5l-2-5H7L5 11v5zm3-9h9l1.2 3H6.8L8 7zm1 12a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm8 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          </svg>
        </div>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'waitme-car-marker',
    html,
    iconSize: [46, 46],
    iconAnchor: [23, 23]
  });
}

function createUserLocationIcon() {
  const html = `
    <div style="
      width:18px;height:18px;border-radius:9999px;
      background:#a855f7;
      box-shadow:0 0 0 6px rgba(168,85,247,.25), 0 6px 16px rgba(0,0,0,.35);
      transform:translate(-50%,-50%);
    "></div>
  `;
  return L.divIcon({ className: 'waitme-user-dot', html, iconSize: [18, 18], iconAnchor: [9, 9] });
}

function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (!position) return;
    map.setView(position, Math.max(map.getZoom(), 15), { animate: true });
  }, [position, map]);
  return null;
}

async function fetchRoute(from, to) {
  const [fromLat, fromLng] = from;
  const [toLat, toLng] = to;

  const url = `https://router.project-osrm.org/route/v1/driving/${toLng},${toLat};${fromLng},${fromLat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  const coords = data?.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  return coords.map(([lng, lat]) => [lat, lng]);
}

export default function ParkingMap({
  alerts = [],
  onAlertClick,
  userLocation,
  selectedAlert,
  showRoute = false,
  className = '',
  zoomControl = true
}) {
  const userPos = useMemo(() => normalizeLatLng(userLocation), [userLocation]);

  const safeAlerts = useMemo(() => {
    const list = Array.isArray(alerts) ? alerts : [];
    return list
      .map((a) => {
        const lat = toNumber(a?.latitude ?? a?.lat);
        const lng = toNumber(a?.longitude ?? a?.lng);
        if (lat == null || lng == null) return null;
        return { ...a, latitude: lat, longitude: lng };
      })
      .filter(Boolean);
  }, [alerts]);

  const [route, setRoute] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!showRoute || !userPos || !selectedAlert) {
        setRoute(null);
        return;
      }
      const to = normalizeLatLng([selectedAlert.latitude, selectedAlert.longitude]);
      if (!to) {
        setRoute(null);
        return;
      }
      try {
        const r = await fetchRoute(userPos, to);
        if (!cancelled) setRoute(r);
      } catch {
        if (!cancelled) setRoute(null);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [showRoute, userPos, selectedAlert]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <style>{`
        .waitme-car-marker { background: transparent !important; border: none !important; }
        .leaflet-control-zoom a { background: rgba(0,0,0,.65) !important; color: white !important; border: 1px solid rgba(168,85,247,.35) !important; }
        .leaflet-control-attribution { display:none; }
      `}</style>

      <MapContainer
        center={userPos || [43.3619, -5.8494]}
        zoom={15}
        zoomControl={zoomControl}
        className="w-full h-full rounded-2xl overflow-hidden"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="" />

        {userPos && (
          <>
            <FlyTo position={userPos} />
            <Marker position={userPos} icon={createUserLocationIcon()} />
          </>
        )}

        {route && (
          <Polyline
            positions={route}
            pathOptions={{ color: '#a855f7', weight: 4, opacity: 0.85, dashArray: '10,10' }}
          />
        )}

        {safeAlerts.map((alert) => (
          <Marker
            key={String(alert.id)}
            position={[alert.latitude, alert.longitude]}
            icon={createCarIcon(alert.car_color, alert.price, alert.vehicle_type)}
            eventHandlers={{
              click: (e) => {
                // Esto es lo que evita el “blanco” en muchos casos (eventos raros en Base44/preview)
                if (e?.originalEvent) {
                  L.DomEvent.stopPropagation(e.originalEvent);
                  L.DomEvent.preventDefault(e.originalEvent);
                }
                try {
                  onAlertClick && onAlertClick(alert);
                } catch {
                  // nunca romper la app por un click
                }
              }
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}