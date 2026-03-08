/**
 * Datos del buyer: reservas activas y finalizadas.
 * @module hooks/historyBuyer/useHistoryBuyerData
 */

import { useMemo } from 'react';

export function useHistoryBuyerData(buyerContext = {}) {
  const { reservationsActiveAll = [], reservationsFinalAll = [], hiddenKeys } = buyerContext;

  const visibleFinalItems = useMemo(
    () => reservationsFinalAll.filter((item) => !hiddenKeys?.has(item.id)),
    [reservationsFinalAll, hiddenKeys]
  );

  const isEmptyActivas = reservationsActiveAll.length === 0;
  const isEmptyFinalizadas = visibleFinalItems.length === 0;

  return {
    reservationsActiveAll,
    reservationsFinalAll,
    visibleFinalItems,
    isEmptyActivas,
    isEmptyFinalizadas,
  };
}
