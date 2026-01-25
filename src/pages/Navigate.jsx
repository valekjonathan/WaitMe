import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Navigation, Phone, MessageCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ParkingMap from '@/components/map/ParkingMap';
import { motion } from 'framer-motion';

export default function Navigate() {
  const urlParams = new URLSearchParams(window.location.search);
  const alertId = urlParams.get('alertId');
  
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Error:', error);
      }
    };
    fetchUser();
  }, []);

  // Obtener alerta
  const { data: alert } = useQuery({
    queryKey: ['navigationAlert', alertId],
    queryFn: async () => {
      const alerts = await base44.entities.ParkingAlert.filter({ id: alertId });
      return alerts[0];
    },
    enabled: !!alertId
  });

  // Mutation para actualizar ubicación
  const updateLocationMutation = useMutation({
    mutationFn: async ({ latitude, longitude, heading, speed }) => {
      // Buscar si ya existe un registro de ubicación para este usuario y alerta
      const existing = await base44.entities.UserLocation.filter({ 
        user_id: user?.id, 
        alert_id: alertId 
      });

      if (existing.length > 0) {
        await base44.entities.UserLocation.update(existing[0].id, {
          latitude,
          longitude,
          heading: heading || 0,
          speed: speed || 0,
          is_active: true
        });
      } else {
        await base44.entities.UserLocation.create({
          user_id: user?.id,
          user_email: user?.email,
          alert_id: alertId,
          latitude,
          longitude,
          heading: heading || 0,
          speed: speed || 0,
          is_active: true
        });
      }
    }
  });

  // Iniciar seguimiento de ubicación
  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('Tu dispositivo no soporta geolocalización');
      return;
    }

    setIsTracking(true);
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading, speed } = position.coords;
        setUserLocation([latitude, longitude]);
        
        // Actualizar ubicación en base de datos
        updateLocationMutation.mutate({
          latitude,
          longitude,
          heading: heading || 0,
          speed: speed || 0
        });
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
        alert('No se pudo obtener tu ubicación. Verifica los permisos.');
        stopTracking();
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  // Detener seguimiento
  const stopTracking = async () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);

    // Marcar como inactivo en base de datos
    if (user?.id && alertId) {
      const existing = await base44.entities.UserLocation.filter({ 
        user_id: user?.id, 
        alert_id: alertId 
      });
      if (existing.length > 0) {
        await base44.entities.UserLocation.update(existing[0].id, {
          is_active: false
        });
      }
    }
  };

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Calcular distancia
  const calculateDistance = () => {
    if (!userLocation || !alert?.latitude || !alert?.longitude) return null;
    
    const R = 6371;
    const dLat = (alert.latitude - userLocation[0]) * Math.PI / 180;
    const dLon = (alert.longitude - userLocation[1]) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation[0] * Math.PI / 180) * Math.cos(alert.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;
    
    if (distanceKm < 1) {
      return { value: Math.round(distanceKm * 1000), unit: 'm' };
    }
    return { value: distanceKm.toFixed(1), unit: 'km' };
  };

  const distance = calculateDistance();

  if (!alert) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={createPageUrl('Notifications')}>
            <Button variant="ghost" size="icon" className="text-white">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Navegación</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Mapa */}
      <div className="flex-1 pt-[60px]">
        <ParkingMap
          alerts={[alert]}
          userLocation={userLocation}
          selectedAlert={alert}
          showRoute={!!(isTracking && userLocation && userLocation.length === 2)}
          zoomControl={true}
          className="h-full"
        />
      </div>

      {/* Panel inferior */}
      <div className="bg-black/95 backdrop-blur-sm border-t-2 border-gray-700 p-4 space-y-3">
        {/* Info de destino */}
        <div className="bg-gray-900 rounded-xl p-3 border-2 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-semibold text-white">{alert.user_name}</p>
              <p className="text-sm text-gray-400">{alert.car_brand} {alert.car_model}</p>
            </div>
            {distance && (
              <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-2">
                <span className="text-purple-400 font-bold">{distance.value}{distance.unit}</span>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            {alert.address}
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          {!isTracking ? (
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 text-base"
              onClick={startTracking}
            >
              <Navigation className="w-5 h-5 mr-2" />
              Iniciar navegación
            </Button>
          ) : (
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold h-12 text-base"
              onClick={stopTracking}
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              Detener navegación
            </Button>
          )}
        </div>

        {/* Botones de contacto */}
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white h-10"
            onClick={() => window.location.href = createPageUrl(`Chat?alertId=${alertId}&userId=${alert.user_email || alert.user_id}`)}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Chat
          </Button>
          <Button
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white h-10"
            onClick={() => alert.phone && (window.location.href = `tel:${alert.phone}`)}
            disabled={!alert.allow_phone_calls || !alert.phone}
          >
            <Phone className="w-5 h-5 mr-2" />
            Llamar
          </Button>
        </div>

        {isTracking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-2 text-center"
          >
            <p className="text-xs text-blue-400">
              Tu ubicación se está compartiendo en tiempo real
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}