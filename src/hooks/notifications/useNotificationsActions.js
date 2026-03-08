/**
 * Acciones de notificaciones: aceptar, rechazar, marcar leído, navegar.
 * @module hooks/notifications/useNotificationsActions
 */

import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import * as alerts from '@/data/alerts';
import * as notificationsApi from '@/data/notifications';
import { setWaitMeRequestStatus } from '@/lib/waitmeRequests';
import {
  ensureConversationForAlert,
  ensureInitialWaitMeMessage,
  markDemoNotificationRead,
  markAllDemoRead,
  applyDemoAction,
} from '@/components/DemoFlowManager';

export function useNotificationsActions(data) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = data;

  const acceptRequest = async (req) => {
    try {
      const alertId = req?.alertId;
      if (!alertId) return;

      const buyer = req?.buyer || {};

      await alerts.updateAlert(alertId, {
        status: 'reserved',
        reserved_by_id: buyer?.id || 'buyer',
        reserved_by_email: null,
        reserved_by_name: buyer?.name || 'Usuario',
        reserved_by_photo: buyer?.photo || null,
        reserved_by_car: `${buyer?.brand || ''} ${buyer?.model || ''}`.trim(),
        reserved_by_car_color: buyer?.color || 'gris',
        reserved_by_plate: buyer?.plate || '',
        reserved_by_vehicle_type: buyer?.vehicle_type || 'car',
      });

      setWaitMeRequestStatus(req?.id, 'accepted');

      await queryClient.invalidateQueries({ queryKey: ['alerts'] });
      await queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
      try {
        window.dispatchEvent(new Event('waitme:badgeRefresh'));
      } catch (error) {
        console.error('[WaitMe Error]', error);
      }
      navigate(createPageUrl('History'));
    } catch (error) {
      console.error('[WaitMe Error]', error);
    }
  };

  const rejectRequest = (req) => {
    try {
      setWaitMeRequestStatus(req?.id, 'rejected');
    } catch (error) {
      console.error('[WaitMe Error]', error);
    }
  };

  const markRead = async (n) => {
    if (!n?.id) return;
    if (n._isReal && user?.id) {
      await notificationsApi.markAsRead(n.id, user.id);
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', user?.id] });
    } else {
      markDemoNotificationRead(n.id);
    }
  };

  const handleMarkAllRead = async () => {
    if (user?.id) {
      await notificationsApi.markAllAsRead(user.id);
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', user?.id] });
    }
    markAllDemoRead?.();
  };

  const openChat = (conversationId, alertId) => {
    if (!conversationId) return;
    navigate(
      createPageUrl(
        `Chat?demo=true&conversationId=${encodeURIComponent(
          conversationId
        )}&alertId=${encodeURIComponent(alertId || '')}`
      )
    );
  };

  const openNavigate = (alertId) => {
    if (!alertId) return;
    navigate(createPageUrl(`Navigate?alertId=${encodeURIComponent(alertId)}`));
  };

  const runAction = (n, action) => {
    if (!n) return;

    const alertId = n.alertId || null;
    const conv = ensureConversationForAlert(alertId, { fromName: n.fromName });
    ensureInitialWaitMeMessage(conv?.id);

    applyDemoAction({
      conversationId: conv?.id,
      alertId,
      action,
    });

    if (n?.id) markRead(n);

    openChat(conv?.id, alertId);
  };

  return {
    acceptRequest,
    rejectRequest,
    markRead,
    handleMarkAllRead,
    openChat,
    openNavigate,
    runAction,
  };
}
