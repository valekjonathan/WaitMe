import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (!position || !Number.isFinite(position[0]) || !Number.isFinite(position[1])) return;
    map.flyTo(position, Math.max(map.getZoom(), 15), { duration: 0.8 });
  }, [map, position]);
  return null;
}

const safeNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);

const createUserLocationIcon = () =>
  L.divIcon({
    className: 'wm-user-marker',
    html: `
      <div style="
        width:18px;height:18px;border-radius:9999px;
        background:#a855f7;border:3px solid #fff;
        box-shadow:0 6px 14px rgba(168,85,247,.55);
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });

const createBuyerIcon = () =>
  L.divIcon({
    className: 'wm-buyer-marker',
    html: `
      <div style="
        width:18px;height:18px;border-radius:9999px;
        background:#3b82f6;border:3px solid #fff;
        box-shadow:0 6px 14px rgba(59,130,246,.55);
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });

const getCarFill = (carColor) => {
  const c = String(carColor || '').toLowerCase();
  if (c.includes('rojo')) return '#ef4444';
  if (c.includes('azul')) return '#3b82f6';
  if (c.includes('verde')) return '#22c55e';
  if (c.includes('amar')) return '#facc15';
  if (c.includes('gris')) return '#6b7280';
  if (c.includes('negro')) return '#111827';
  return '#e5e7eb';
};

const createCarIcon = (carColor, price, vehicleType) =>
  L.divIcon({
    className: 'wm-car-marker',
    html: `
      <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
        <div style="
          padding:2px 8px;
          border-radius:9999px;
          background:rgba(0,0,0,.70);
          border:1px solid rgba(168,85,247,.35);
          color:#fff;
          font-weight:800;
          font-size:12px;
          line-height:18px;
          margin-bottom:4px;
          backdrop-filter: blur(6px);
        ">
          ${safeNum(price) != null ? `${Math.round(price)}€` : '€'}
        </div>
        <div style="
          width:30px;height:18px;
          border-radius:8px;
          background:${getCarFill(carColor)};
          border:2px solid rgba(255,255,255,.85);
          box-shadow:0 6px 14px rgba(0,0,0,.35);
          display:flex; align-items:center; justify-content:center;
        ">
          <svg width="18" height="12" viewBox="0 0 48 24" fill="none">
            <path d="M6 8 L6 18 L42 18 L42 10 L38 8 Z" fill="rgba(255,255,255,.22)" stroke="white" stroke-width="1.2"/>
            <rect x="8" y="9" width="8" height="6" fill="rgba(255,255,255,0.12)"/>
            <rect x="12" y="5" width="20" height="4" fill="white" opacity="0.85"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 36]
  });

export default function ParkingMap({
  alerts = [],
  userLocation = null,
  selectedAlert = null,
  showRoute = false,
  onAlertClick,
  className = 'h-full',
  zoomControl = true,
  isSelecting = false,
  selectedPosition = null,
  setSelectedPosition
}) {
  const mapRef = useRef(null);
  const [route, setRoute] = useState(null);

  const normalizedUserLocation = useMemo(() => {
    if (!userLocation) return null;
    if (Array.isArray(userLocation)) {
      const lat = safeNum(userLocation[0]);
      const lng = safeNum(userLocation[1]);
      return lat != null && lng != null ? [lat, lng] : null;
    }
    const lat = safeNum(userLocation.latitude ?? userLocation.lat);
    const lng = safeNum(userLocation.longitude ?? userLocation.lng ?? userLocation.lon);
    return lat != null && lng != null ? [lat, lng] : null;
  }, [userLocation]);

  const safeAlerts = useMemo(() => {
    return (alerts || []).filter((a) => {
      const lat = safeNum(a?.latitude);
      const lng = safeNum(a?.longitude);
      return a && lat != null && lng != null;
    });
  }, [alerts]);

  // Ruta (si hay selectedAlert + userLocation)
  useEffect(() => {
    let cancelled = false;

    const buildRoute = async () => {
      if (!showRoute) return setRoute(null);
      if (!normalizedUserLocation) return setRoute(null);

      const endLat = safeNum(selectedAlert?.latitude);
      const endLng = safeNum(selectedAlert?.longitude);
      if (endLat == null || endLng == null) return setRoute(null);

      const [startLat, startLng] = normalizedUserLocation;

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        const coords = data?.routes?.[0]?.geometry?.coordinates;
        if (!coords || !Array.isArray(coords)) return setRoute(null);

        const poly = coords.map(([lng, lat]) => [lat, lng]).filter((p) => p && Number.isFinite(p[0]) && Number.isFinite(p[1]));
        if (!cancelled) setRoute(poly.length ? poly : null);
      } catch {
        if (!cancelled) setRoute(null);
      }
    };

    buildRoute();
    return () => {
      cancelled = true;
    };
  }, [showRoute, normalizedUserLocation, selectedAlert]);

  const center = normalizedUserLocation || [43.3619, -5.8494];

  return (
    <div className={`w-full ${className}`} style={{ minHeight: 220 }}>
      <MapContainer
        center={center}
        zoom={15}
        className="w-full h-full rounded-2xl overflow-hidden"
        whenCreated={(m) => (mapRef.current = m)}
        zoomControl={false}
        attributionControl={true}
        style={{ background: '#0b0b0b' }}
        onClick={(e) => {
          if (!isSelecting || !setSelectedPosition) return;
          if (!e?.latlng) return;
          setSelectedPosition(e.latlng);
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {zoomControl ? <ZoomControl position="topleft" /> : null}

        {normalizedUserLocation ? <FlyToLocation position={normalizedUserLocation} /> : null}

        {normalizedUserLocation ? (
          <Marker position={normalizedUserLocation} icon={createUserLocationIcon()} />
        ) : null}

        {isSelecting && selectedPosition?.lat != null && selectedPosition?.lng != null ? (
          <Marker position={[selectedPosition.lat, selectedPosition.lng]} icon={createUserLocationIcon()} />
        ) : null}

        {route ? (
          <Polyline
            positions={route}
            pathOptions={{ color: '#a855f7', weight: 4, opacity: 0.85, dashArray: '10 10' }}
          />
        ) : null}

        {safeAlerts.map((alert) => (
          <Marker
            key={alert.id}
            position={[Number(alert.latitude), Number(alert.longitude)]}
            icon={createCarIcon(alert.car_color, alert.price, alert.vehicle_type)}
            eventHandlers={{
              click: () => {
                // IMPORTANTÍSIMO: NO navegamos ni recargamos aquí. Solo llamamos callback.
                if (typeof onAlertClick === 'function') onAlertClick(alert);
              }
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}