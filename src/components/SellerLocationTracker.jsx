import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import ParkingMap from '@/components/map/ParkingMap';
import { motion } from 'framer-motion';

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
        <ParkingMap
          alerts={[alert]}
          userLocation={userLocation}
          buyerLocations={buyerLocations}
          showRoute={false}
          zoomControl={false}
          className="h-full"
        />
      </div>
    </motion.div>
  );
}