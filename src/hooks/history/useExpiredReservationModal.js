import { useEffect } from 'react';

export function useExpiredReservationModal({
  nowTs,
  visibleActiveAlerts,
  expiredAlertExtend,
  setExpiredAlertExtend,
  setExpiredAlertModalId,
  getWaitUntilTs,
}) {
  useEffect(() => {
    if (!visibleActiveAlerts) return;
    visibleActiveAlerts.forEach((alert) => {
      if (alert.status !== 'reserved') return;
      const waitUntilTs = getWaitUntilTs(alert);
      if (!waitUntilTs) return;
      const rem = Math.max(0, waitUntilTs - nowTs);
      if (rem === 0 && !expiredAlertExtend[alert.id]) {
        setExpiredAlertExtend((prev) => ({ ...prev, [alert.id]: true }));
        setExpiredAlertModalId(alert.id);
      }
    });
  }, [
    nowTs,
    visibleActiveAlerts,
    expiredAlertExtend,
    setExpiredAlertExtend,
    setExpiredAlertModalId,
    getWaitUntilTs,
  ]);
}
