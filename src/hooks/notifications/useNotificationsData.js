/**
 * Datos de notificaciones y solicitudes entrantes.
 * @module hooks/notifications/useNotificationsData
 */

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as notificationsApi from '@/data/notifications';
import * as alerts from '@/data/alerts';
import { useAuth } from '@/lib/AuthContext';
import { getWaitMeRequests } from '@/lib/waitmeRequests';
import { getDemoNotifications } from '@/components/DemoFlowManager';

export function useNotificationsData() {
  const { user } = useAuth();
  const [tick, _setTick] = useState(0);

  const { data: realNotifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await notificationsApi.listNotifications(user.id);
      return data ?? [];
    },
    staleTime: 10_000,
  });

  const [requestsTick, setRequestsTick] = useState(0);
  const [requests, setRequests] = useState([]);
  const [alertsById, setAlertsById] = useState({});

  useEffect(() => {
    const load = () => {
      const list = getWaitMeRequests() || [];
      setRequests(Array.isArray(list) ? list : []);
      setRequestsTick((t) => t + 1);
    };

    load();
    const onChange = () => load();
    window.addEventListener('waitme:requestsChanged', onChange);
    return () => window.removeEventListener('waitme:requestsChanged', onChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const ids = (requests || [])
        .map((r) => r?.alertId)
        .filter(Boolean)
        .filter((id) => !alertsById?.[id]);

      if (!ids.length) return;

      try {
        const pairs = await Promise.all(
          ids.map(async (id) => {
            try {
              const { data: a } = await alerts.getAlert(id);
              return [id, a];
            } catch {
              return [id, null];
            }
          })
        );

        if (cancelled) return;
        setAlertsById((prev) => {
          const next = { ...(prev || {}) };
          pairs.forEach(([id, a]) => {
            if (a) next[id] = a;
          });
          return next;
        });
      } catch {
        // noop
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [requestsTick, requests, alertsById]);

  const notifications = useMemo(() => {
    const demo = getDemoNotifications?.() || [];
    const real = (realNotifications || []).map((n) => ({ ...n, _isReal: true }));
    const merged = [...demo.map((d) => ({ ...d, _isReal: false })), ...real];
    return merged.sort((a, b) => (b?.t ?? b?.createdAt ?? 0) - (a?.t ?? a?.createdAt ?? 0));
  }, [tick, realNotifications]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n?.read).length, [notifications]);

  const incomingRequests = useMemo(
    () => requests.filter((r) => r?.type === 'incoming_waitme_request'),
    [requests]
  );

  return {
    user,
    realNotifications,
    requests,
    incomingRequests,
    alertsById,
    notifications,
    unreadCount,
  };
}
