import React from 'react';
import UserCard from '@/components/cards/UserCard';

/**
 * UserAlertCard
 *
 * Este componente actúa como ADAPTADOR.
 * Mantiene la API actual (para no romper Home),
 * pero renderiza EXACTAMENTE el mismo diseño
 * que se usa en "Tus reservas" (UserCard).
 */
export default function UserAlertCard({
  alert,
  isEmpty,
  onBuyAlert,
  onChat,
  onCall,
  isLoading,
  userLocation
}) {
  if (!alert || isEmpty) {
    return null;
  }

  return (
    <UserCard
      alert={alert}
      userLocation={userLocation}
      onChat={onChat}
      onCall={onCall}
      isLoading={isLoading}
      onPrimaryAction={
        alert.is_demo ? undefined : () => onBuyAlert?.(alert)
      }
      primaryLabel={alert.is_demo ? 'Demo' : 'WaitMe!'}
    />
  );
}