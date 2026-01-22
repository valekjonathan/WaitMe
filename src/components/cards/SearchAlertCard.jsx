import React from 'react';
import UserAlertCard from '@/components/cards/UserAlertCard';

/**
 * SearchAlertCard
 *
 * Ahora usa EXACTAMENTE la misma tarjeta
 * que se ve en "Tus reservas".
 *
 * Marco = Sofía (visual 100% idéntico)
 */
export default function SearchAlertCard({
  alert,
  onBuyAlert,
  onChat,
  onCall,
  isLoading,
  userLocation
}) {
  return (
    <UserAlertCard
      alert={alert}
      onBuyAlert={onBuyAlert}
      onChat={onChat}
      onCall={onCall}
      isLoading={isLoading}
      userLocation={userLocation}
    />
  );
}