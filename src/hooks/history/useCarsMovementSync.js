import { useEffect } from 'react';
import { setCarsMovementMode, CARS_MOVEMENT_MODE } from '@/stores/carsMovementStore';

export function useCarsMovementSync(myActiveAlerts) {
  const hasReservedAlerts = myActiveAlerts.filter((a) => a.status === 'reserved').length > 0;
  useEffect(() => {
    setCarsMovementMode(
      hasReservedAlerts ? CARS_MOVEMENT_MODE.WAITME_ACTIVE : CARS_MOVEMENT_MODE.STATIC
    );
    return () => setCarsMovementMode(CARS_MOVEMENT_MODE.STATIC);
  }, [hasReservedAlerts]);
}
