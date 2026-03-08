/**
 * Acciones del buyer: cancelar reserva, eliminar finalizada.
 * @module hooks/historyBuyer/useHistoryBuyerActions
 */

import * as alerts from '@/data/alerts';
import * as chat from '@/data/chat';

export function useHistoryBuyerActions(buyerContext = {}) {
  const { hideKey, user, queryClient, deleteAlertSafe } = buyerContext;

  const cancelReservation = async (alert, key) => {
    hideKey?.(key);
    const isMock = String(alert?.id).startsWith('mock-');
    if (isMock) return;

    await alerts.updateAlert(alert.id, { status: 'cancelled' });
    const { data: conv } = await chat.createConversation({
      buyerId: user?.id,
      sellerId: alert.user_id || alert.seller_id,
      alertId: alert.id,
    });
    if (conv?.id) {
      await chat.sendMessage({
        conversationId: conv.id,
        senderId: user?.id,
        body: `He cancelado mi reserva de ${Math.trunc(alert.price ?? 0)} €`,
      });
    }

    queryClient?.invalidateQueries({ queryKey: ['myAlerts'] });
  };

  const deleteFinalized = async (item, key) => {
    hideKey?.(key);
    const isAlert = item?.type === 'alert';
    const a = item?.data;
    const isMock = a && String(a.id).startsWith('mock-');

    if (isAlert && !isMock) {
      await deleteAlertSafe?.(a.id);
      queryClient?.invalidateQueries({ queryKey: ['myAlerts'] });
    }
  };

  return {
    cancelReservation,
    deleteFinalized,
  };
}
