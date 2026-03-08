import * as alerts from '@/data/alerts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { stampFinalizedAt } from '@/lib/finalizedAtStore';

export function useHistoryActions(user) {
  const queryClient = useQueryClient();

  const deleteAlertSafe = async (id) => {
    try {
      await alerts.deleteAlert(id);
    } catch (error) {
      console.error('[WaitMe Error]', error);
    }
  };

  const cancelAlertMutation = useMutation({
    mutationFn: async (alertId) => {
      await alerts.updateAlert(alertId, { status: 'cancelled' });

      const uid = user?.id;
      if (!uid) return;
      const { data: all } = await alerts.getMyAlerts(uid);
      const mine = (all || []).filter((a) => {
        if (!a) return false;
        const st = String(a.status || '').toLowerCase();
        return st === 'active';
      });
      await Promise.all(
        mine
          .filter((a) => a.id && a.id !== alertId)
          .map((a) =>
            alerts
              .updateAlert(a.id, { status: 'cancelled' })
              .then(() => null)
              .catch(() => null)
          )
      );
    },
    onMutate: async (alertId) => {
      queryClient.setQueryData(['myAlerts'], (old) => {
        const list = Array.isArray(old) ? old : old?.data || [];
        const now = Date.now();
        return list.map((a) => {
          if (a?.id !== alertId) return a;
          stampFinalizedAt(alertId);
          return {
            ...a,
            status: 'cancelled',
            finalized_at: now,
            updated_date: new Date(now).toISOString(),
          };
        });
      });

      try {
        window.dispatchEvent(new Event('waitme:badgeRefresh'));
      } catch (error) {
        console.error('[WaitMe Error]', error);
      }
    },
    onSuccess: () => {
      try {
        window.dispatchEvent(new Event('waitme:badgeRefresh'));
      } catch (error) {
        console.error('[WaitMe Error]', error);
      }
    },
  });

  const expireAlertMutation = useMutation({
    mutationFn: async (alertId) => {
      await alerts.updateAlert(alertId, { status: 'expired' });
    },
    onMutate: async (alertId) => {
      queryClient.setQueryData(['myAlerts'], (old) => {
        const list = Array.isArray(old) ? old : old?.data || [];
        return list.map((a) => (a?.id === alertId ? { ...a, status: 'expired' } : a));
      });
      try {
        window.dispatchEvent(new Event('waitme:badgeRefresh'));
      } catch (error) {
        console.error('[WaitMe Error]', error);
      }
    },
    onSuccess: () => {},
  });

  const repeatAlertMutation = useMutation({
    mutationFn: async (alert) => {
      if (!alert) return null;

      await alerts.updateAlert(alert.id, { status: 'expired' });

      const now = Date.now();
      const minutes = Number(alert.available_in_minutes || 0);
      const futureTime = new Date(now + minutes * 60 * 1000);

      const payload = {
        sellerId: alert.seller_id ?? alert.user_id,
        latitude: alert.latitude ?? alert.lat,
        longitude: alert.longitude ?? alert.lng,
        address: alert.address ?? alert.address_text,
        price: alert.price,
        wait_until: futureTime.toISOString(),
        metadata: {
          available_in_minutes: minutes,
          brand: alert.brand || '',
          model: alert.model || '',
          color: alert.color || '',
          plate: alert.plate || '',
          phone: alert.phone || null,
          allow_phone_calls: !!alert.allow_phone_calls,
        },
      };

      const { data } = await alerts.createAlert(payload);
      return data;
    },
    onSuccess: () => {
      try {
        window.dispatchEvent(new Event('waitme:badgeRefresh'));
      } catch (error) {
        console.error('[WaitMe Error]', error);
      }
    },
  });

  return {
    deleteAlertSafe,
    cancelAlertMutation,
    expireAlertMutation,
    repeatAlertMutation,
    queryClient,
  };
}
