/**
 * Datos del seller: items mergeados, finales, estados vacíos.
 * @module hooks/historySeller/useHistorySellerData
 */

import { useMemo } from 'react';

export function useHistorySellerData(sellerContext = {}) {
  const { finalItems = [], thinkingRequests = [], visibleActiveAlerts = [], toMs } = sellerContext;

  const mergedItems = useMemo(() => {
    const thinkingItems = thinkingRequests.map((item) => ({
      __type: 'thinking',
      __ts: item.alert?.created_date ? new Date(item.alert.created_date).getTime() : 0,
      item,
    }));
    const activeItems = visibleActiveAlerts.map((a, idx) => ({
      __type: 'active',
      __ts: toMs?.(a.created_date) || 0,
      item: a,
      index: idx,
    }));
    return [...thinkingItems, ...activeItems].sort((a, b) => b.__ts - a.__ts).slice(0, 1);
  }, [thinkingRequests, visibleActiveAlerts, toMs]);

  const isEmptyActivas = visibleActiveAlerts.length === 0 && thinkingRequests.length === 0;
  const isEmptyFinalizadas = finalItems.length === 0;

  return {
    mergedItems,
    finalItems,
    isEmptyActivas,
    isEmptyFinalizadas,
  };
}
