/**
 * Acciones del seller: aceptar, rechazar, dismiss thinking.
 * @module hooks/historySeller/useHistorySellerActions
 */

import * as alerts from '@/data/alerts';

export function useHistorySellerActions(sellerContext = {}) {
  const { thinkingRequests = [], setThinkingRequests, queryClient } = sellerContext;

  const acceptThinking = (item) => {
    const req = item?.request;
    const buyer = req?.buyer || {};
    const payload = {
      status: 'reserved',
      reserved_by_id: buyer?.id || 'buyer',
      reserved_by_name: buyer?.name || 'Usuario',
      reserved_by_photo: buyer?.photo || null,
      reserved_by_car: `${buyer?.brand || ''} ${buyer?.model || ''}`.trim(),
      reserved_by_car_color: buyer?.color || 'gris',
      reserved_by_plate: buyer?.plate || '',
    };
    try {
      setThinkingRequests([]);
      localStorage.setItem('waitme:thinking_requests', JSON.stringify([]));
      window.dispatchEvent(new Event('waitme:thinkingUpdated'));
    } catch (error) {
      console.error('[WaitMe Error]', error);
    }
    queryClient?.setQueryData(['myAlerts'], (old = []) =>
      old.map((a) => (a.id === req?.alertId ? { ...a, ...payload } : a))
    );
    alerts.updateAlert(req?.alertId, payload).then(() => {
      queryClient?.invalidateQueries({ queryKey: ['myAlerts'] });
    });
  };

  const rejectThinking = (item) => {
    try {
      const updated = thinkingRequests.filter((r) => r.id !== item?.id);
      setThinkingRequests(updated);
      localStorage.setItem('waitme:thinking_requests', JSON.stringify(updated));
      const rejected = JSON.parse(localStorage.getItem('waitme:rejected_requests') || '[]');
      rejected.push({ ...item, finalized_at: Date.now() });
      localStorage.setItem('waitme:rejected_requests', JSON.stringify(rejected));
    } catch (error) {
      console.error('[WaitMe Error]', error);
    }
  };

  const dismissThinking = (item) => {
    try {
      const updated = thinkingRequests.filter((r) => r.id !== item?.id);
      setThinkingRequests(updated);
      localStorage.setItem('waitme:thinking_requests', JSON.stringify(updated));
    } catch (error) {
      console.error('[WaitMe Error]', error);
    }
  };

  return {
    acceptThinking,
    rejectThinking,
    dismissThinking,
  };
}
