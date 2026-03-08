import { useEffect, useRef } from 'react';
import * as alerts from '@/data/alerts';

export function useHistoryAutoExpire({
  nowTs,
  visibleActiveAlerts,
  reservationsActiveAll,
  getCreatedTs,
  getWaitUntilTs,
  user,
  queryClient,
  expirePromptOpen,
  setExpirePromptAlert,
  setExpirePromptOpen,
}) {
  const autoFinalizedRef = useRef(new Set());
  const autoFinalizedReservationsRef = useRef(new Set());

  useEffect(() => {
    if (!visibleActiveAlerts?.length) return;
    const toExpire = visibleActiveAlerts.filter((a) => {
      if (!a) return false;
      const st = String(a.status || '').toLowerCase();
      if (st === 'cancelled' || st === 'expired' || st !== 'active') return false;
      if (autoFinalizedRef.current.has(a.id)) return false;
      const createdTs = getCreatedTs(a);
      const waitUntilTs = getWaitUntilTs(a);
      if (!waitUntilTs || !createdTs) return false;
      return Math.max(0, waitUntilTs - nowTs) === 0;
    });
    if (!toExpire.length) return;
    toExpire.forEach((a) => autoFinalizedRef.current.add(a.id));
    const mine = toExpire.find((a) => {
      const uid = user?.id;
      const email = user?.email;
      return (
        (uid && (a.user_id === uid || a.created_by === uid)) || (email && a.user_email === email)
      );
    });
    if (mine && !expirePromptOpen) {
      setExpirePromptAlert(mine);
      setExpirePromptOpen(true);
    }
    const others = toExpire.filter((a) => !mine || a.id !== mine.id);
    Promise.all(
      others.map((a) =>
        alerts
          .updateAlert(a.id, { status: 'expired' })
          .then(() => null)
          .catch(() => null)
      )
    ).finally(() => {
      queryClient.setQueryData(['myAlerts'], (prev = []) =>
        prev.map((a) => (others.some((o) => o.id === a.id) ? { ...a, status: 'expired' } : a))
      );
    });
  }, [nowTs, visibleActiveAlerts, queryClient, user?.id, user?.email, expirePromptOpen]);

  useEffect(() => {
    if (!reservationsActiveAll?.length) return;
    const toExpire = reservationsActiveAll.filter((a) => {
      if (!a) return false;
      const st = String(a.status || '').toLowerCase();
      if (st === 'cancelled' || st === 'expired' || st !== 'reserved') return false;
      if (String(a.id || '').startsWith('mock-')) return false;
      if (autoFinalizedReservationsRef.current.has(a.id)) return false;
      const createdTs = getCreatedTs(a);
      const waitUntilTs = getWaitUntilTs(a);
      if (!waitUntilTs || !createdTs) return false;
      return Math.max(0, waitUntilTs - nowTs) === 0;
    });
    if (!toExpire.length) return;
    toExpire.forEach((a) => autoFinalizedReservationsRef.current.add(a.id));
    Promise.all(
      toExpire.map((a) =>
        alerts
          .updateAlert(a.id, { status: 'expired' })
          .then(() => null)
          .catch(() => null)
      )
    ).finally(() => {
      queryClient.setQueryData(['myAlerts'], (prev = []) =>
        prev.map((a) => (toExpire.some((o) => o.id === a.id) ? { ...a, status: 'expired' } : a))
      );
    });
  }, [nowTs, reservationsActiveAll, queryClient]);

  return { autoFinalizedRef, autoFinalizedReservationsRef };
}
