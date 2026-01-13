import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

export default function SellerLocationTracker({ alertId, userLocation }) {
  const [alert, setAlert] = useState(null);

  // Obtener la alerta
  useEffect(() => {
    const fetchAlert = async () => {
      if (!alertId) return;
      const alerts = await base44.entities.ParkingAlert.filter({ id: alertId });
      if (alerts.length > 0) {
        setAlert(alerts[0]);
      }
    };
    fetchAlert();
  }, [alertId]);

  // Obtener ubicaciones de compradores que están navegando hacia esta alerta
  const { data: buyerLocations = [] } = useQuery({
    queryKey: ['buyerLocations', alertId],
    queryFn: async () => {
      const locs = await base44.entities.UserLocation.filter({ 
        alert_id: alertId, 
        is_active: true 
      });
      return locs;
    },
    enabled: !!alertId,
    refetchInterval: 3000 // Actualizar cada 3 segundos
  });

  // Calcular distancia del comprador más cercano
  const calculateDistance = (buyerLoc) => {
    if (!userLocation) return null;
    
    const R = 6371;
    const dLat = (buyerLoc.latitude - userLocation[0]) * Math.PI / 180;
    const dLon = (buyerLoc.longitude - userLocation[1]) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation[0] * Math.PI / 180) * Math.cos(buyerLoc.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;
    
    if (distanceKm < 1) {
      return { value: Math.round(distanceKm * 1000), unit: 'm' };
    }
    return { value: distanceKm.toFixed(1), unit: 'km' };
  };

  const closestBuyer = buyerLocations.length > 0 ? buyerLocations[0] : null;
  const distance = closestBuyer ? calculateDistance(closestBuyer) : null;

  if (!alert || buyerLocations.length === 0) {
    return null;
  }

  // Crear icono de ubicación del usuario estilo Uber
  const createUserLocationIcon = () => {
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
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-24 left-4 right-4 z-40 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 border-2 border-blue-500 shadow-2xl"
    >
      <div className="mb-2">
        <p className="text-white font-bold text-lg">¡El comprador viene hacia ti!</p>
        {distance && (
          <p className="text-blue-100 text-sm">
            Está a {distance.value}{distance.unit} de distancia
          </p>
        )}
      </div>

      <div className="h-48 rounded-xl overflow-hidden border-2 border-white/30">
        <MapContainer
          center={userLocation || [alert.latitude, alert.longitude]}
          zoom={16}
          style={{ height: '100%', width: '100%' }}
          className="rounded-xl"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          />
          
          {/* Marcador de ubicación del usuario con palito y bolita brillante */}
          {userLocation && (
            <Marker 
              position={userLocation}
              icon={createUserLocationIcon()}
            >
              <Popup>Tu ubicación</Popup>
            </Marker>
          )}

          {/* Marcadores de compradores en camino */}
          {buyerLocations.map((loc) => (
            <Marker 
              key={loc.id}
              position={[loc.latitude, loc.longitude]} 
              icon={L.divIcon({
                className: 'custom-buyer-icon',
                html: `
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
                  ">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2L2 19h20L12 2z"/>
                    </svg>
                  </div>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
              })}
            >
              <Popup>Usuario en camino</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </motion.div>
  );
}