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

function CenterPinMarker({ onMapMove, onMapMoveEnd }) {
  const map = useMapEvents({
    move() {
      const center = map.getCenter();
      if (onMapMove) {
        onMapMove([center.lat, center.lng]);
      }
    },
    moveend() {
      const center = map.getCenter();
      if (onMapMoveEnd) {
        onMapMoveEnd([center.lat, center.lng]);
      }
    }
  });

  return null;
}

function FlyToLocation({ position, offsetY = 0, zoom = 16 }) {
  const map = useMap();

  useEffect(() => {
    if (position && position.lat != null && position.lng != null) {
      map.setView([position.lat, position.lng], 16);
    } else if (position && Array.isArray(position) && position.length === 2) {
      map.setView(position, 16);
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
  sellerLocation,
  className = '',
  zoomControl = true,
  buyerLocations = [],
  userLocationOffsetY = 0,
  useCenterPin = false,
  onMapMove,
  // NUEVO (solo overlay de navegación): muestra distancia + ETA dentro del mapa
  showRouteInfoOverlay = false,
  // NUEVO: estilo del marcador de seller cuando showRoute
  sellerMarkerVariant = 'pin', // 'pin' | 'car'
  sellerCarColor,
  onMapMoveEnd
}) {
  // Convertir userLocation a formato [lat, lng] si es objeto
  const normalizedUserLocation = userLocation 
    ? (Array.isArray(userLocation) 
        ? userLocation 
        : [userLocation.latitude || userLocation.lat, userLocation.longitude || userLocation.lng])
    : null;
  
  const defaultCenter = normalizedUserLocation || [43.3619, -5.8494];
  const [route, setRoute] = useState(null);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDurationMin, setRouteDurationMin] = useState(null);

  // Calcular ruta cuando se selecciona una alerta
  useEffect(() => {
    if (showRoute && normalizedUserLocation) {
      // Usar sellerLocation si está disponible, sino usar selectedAlert
      const targetLocation = sellerLocation || (selectedAlert ? [selectedAlert.latitude, selectedAlert.longitude] : null);
      
      if (!targetLocation) {
        setRoute(null);
        setRouteDistance(null);
        setRouteDurationMin(null);
        return;
      }

      const start = { lat: normalizedUserLocation[0], lng: normalizedUserLocation[1] };
      const end = { lat: targetLocation[0], lng: targetLocation[1] };

      // Usar OSRM para calcular la ruta
      fetch(`https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`).
      then((res) => res.json()).
      then((data) => {
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map((coord) => [coord[1], coord[0]]);
          setRoute(coords);
          setRouteDistance((data.routes[0].distance / 1000).toFixed(2)); // km
        }
          setRouteDurationMin(Math.round((data.routes[0].duration || 0) / 60)); // min
      }).
      catch((err) => console.log('Error calculando ruta:', err));
    } else {
      setRoute(null);
      setRouteDistance(null);
        setRouteDurationMin(null);
    }
  }, [showRoute, selectedAlert, sellerLocation, normalizedUserLocation]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {showRouteInfoOverlay && routeDistance && (
        <div className="absolute top-3 left-3 z-[1100] pointer-events-none">
          <div className="px-3 py-2 rounded-xl bg-black/65 border border-purple-500/25 backdrop-blur text-white">
            <div className="text-xs font-semibold leading-none">
              Distancia: <span className="text-purple-300">{routeDistance} km</span>
            </div>
            <div className="text-xs font-semibold leading-none mt-1">
              Llegada: <span className="text-purple-300">{routeDurationMin != null ? `${routeDurationMin} min` : '--'}</span>
            </div>
          </div>
        </div>
      )}
      {useCenterPin && (
        <div className="absolute top-1/2 left-1/2 z-[1000] pointer-events-none" style={{ transform: 'translate(-50%, -50%)' }}>
          <div style={{ position: 'relative', width: '40px', height: '60px' }}>
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '2px',
              height: '35px',
              background: '#a855f7'
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '18px',
              height: '18px',
              background: '#a855f7',
              borderRadius: '50%',
              boxShadow: '0 0 15px rgba(168, 85, 247, 0.8)'
            }}></div>
          </div>
        </div>
      )}
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
          background-color: rgba(0, 0, 0, 0.6) !important;
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
          background-color: rgba(168, 85, 247, 0.6) !important;
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

        
        {normalizedUserLocation && !useCenterPin && <FlyToLocation position={normalizedUserLocation} offsetY={userLocationOffsetY} />}
        
        {useCenterPin && <CenterPinMarker onMapMove={onMapMove} onMapMoveEnd={onMapMoveEnd} />}
        
        {normalizedUserLocation && useCenterPin && <FlyToLocation position={normalizedUserLocation} offsetY={userLocationOffsetY} />}
        
        {/* Marcador de ubicación del usuario estilo Uber */}
        {normalizedUserLocation && !useCenterPin &&
        <Marker 
          position={normalizedUserLocation}
          icon={createUserLocationIcon()}
          draggable={isSelecting}>
          </Marker>
        }

        {/* Buyer locations (usuarios en camino - tracking en tiempo real) */}
        {buyerLocations.map((loc) => (
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
            zIndexOffset={1500}
          >
            <Popup>Usuario en camino</Popup>
          </Marker>
        ))}

        {/* Seller location actualizada en tiempo real */}
        {/* Seller location en tiempo real */}
        {sellerLocation && showRoute && sellerLocation !== normalizedUserLocation && (
          <Marker
            position={sellerLocation}
            icon={
              sellerMarkerVariant === 'car'
                ? L.divIcon({
                    className: 'nav-seller-car',
                    html: `
                      <div style="position: relative; width: 72px; height: 40px;">
                        <div style="
                          position:absolute; inset:0;
                          filter: drop-shadow(0 6px 10px rgba(0,0,0,0.55));
                        ">
                          <svg viewBox="0 0 48 24" width="72" height="40" fill="none">
                            <path
                              d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
                              fill="${(sellerCarColor && carColors[sellerCarColor]) ? carColors[sellerCarColor] : '#6b7280'}"
                              stroke="white"
                              stroke-width="1.5"
                            />
                            <path
                              d="M16 9 L18 12 L30 12 L32 9 Z"
                              fill="rgba(255,255,255,0.28)"
                              stroke="white"
                              stroke-width="0.5"
                            />
                            <circle cx="14" cy="18" r="4" fill="#333" stroke="white" stroke-width="1" />
                            <circle cx="14" cy="18" r="2" fill="#666" />
                            <circle cx="36" cy="18" r="4" fill="#333" stroke="white" stroke-width="1" />
                            <circle cx="36" cy="18" r="2" fill="#666" />
                          </svg>
                        </div>
                      </div>
                    `,
                    iconSize: [72, 40],
                    iconAnchor: [36, 40],
                    popupAnchor: [0, -40],
                  })
                : L.divIcon({
                    className: 'custom-seller-icon',
                    html: `
                      <style>
                        @keyframes pulse-seller {
                          0%, 100% {
                            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
                          }
                          50% {
                            box-shadow: 0 0 0 15px rgba(34, 197, 94, 0);
                          }
                        }
                      </style>
                      <div style="
                        width: 40px;
                        height: 40px;
                        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                        border: 4px solid white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        animation: pulse-seller 2s infinite;
                      ">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                      </div>
                    `,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20],
                  })
            }
            zIndexOffset={2000}
          >
            <Popup>Vendedor: {selectedAlert?.user_name}</Popup>
          </Marker>
        )}

        {isSelecting && selectedPosition && selectedPosition.lat !== normalizedUserLocation?.[0] &&
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
