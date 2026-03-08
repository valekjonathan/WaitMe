import { useMemo } from 'react';
import { toMs, getBestFinalizedTs } from '@/lib/alertSelectors';
import { getFinalizedAtMap } from '@/lib/finalizedAtStore';

export function useHistoryDerived({
  myAlerts,
  transactionsData,
  user,
  hiddenKeys,
  rejectedRequests,
}) {
  const myFinalizedAlerts = useMemo(
    () =>
      myAlerts.filter((a) => {
        if (!a) return false;
        const isMine =
          (user?.id && (a.user_id === user.id || a.created_by === user.id)) ||
          (user?.email && a.user_email === user.email);
        if (!isMine) return false;
        return ['cancelled', 'completed', 'expired'].includes(String(a.status || '').toLowerCase());
      }),
    [myAlerts, user?.id, user?.email]
  );

  const myFinalizedAsSellerTx = useMemo(
    () => transactionsData.filter((t) => t.seller_id === user?.id),
    [transactionsData, user?.id]
  );

  const myFinalizedAll = useMemo(() => {
    const fatMap = getFinalizedAtMap();
    return [
      ...myFinalizedAlerts.map((a) => ({
        type: 'alert',
        id: `final-alert-${a.id}`,
        finalized_at: a.finalized_at || fatMap[a.id] || getBestFinalizedTs(a),
        data: a,
      })),
      ...myFinalizedAsSellerTx.map((t) => ({
        type: 'transaction',
        id: `final-tx-${t.id}`,
        finalized_at: fatMap[t.id] || getBestFinalizedTs(t),
        data: t,
      })),
      ...rejectedRequests.map((i) => ({
        type: 'rejected',
        id: `rejected-${i.id}`,
        finalized_at: i.finalized_at || i.savedAt || 0,
        data: i,
      })),
    ].sort((a, b) => b.finalized_at - a.finalized_at);
  }, [myFinalizedAlerts, myFinalizedAsSellerTx, rejectedRequests]);

  const finalItems = useMemo(
    () => myFinalizedAll.filter((item) => !hiddenKeys.has(item.id)),
    [myFinalizedAll, hiddenKeys]
  );

  const reservationsActiveAll = useMemo(
    () => myAlerts.filter((a) => a.reserved_by_id === user?.id && a.status === 'reserved'),
    [myAlerts, user?.id]
  );

  const reservationsFinalAll = useMemo(
    () =>
      [
        ...myAlerts
          .filter((a) => a.reserved_by_id === user?.id && a.status !== 'reserved')
          .map((a) => ({
            type: 'alert',
            id: `res-final-alert-${a.id}`,
            created_date: a.created_date,
            data: a,
          })),
        ...transactionsData
          .filter((t) => t.buyer_id === user?.id)
          .map((t) => ({
            type: 'transaction',
            id: `res-final-tx-${t.id}`,
            created_date: t.created_date,
            data: t,
          })),
      ].sort((a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0)),
    [myAlerts, transactionsData, user?.id]
  );

  return {
    myFinalizedAlerts,
    myFinalizedAll,
    finalItems,
    reservationsActiveAll,
    reservationsFinalAll,
  };
}
