/**
 * Listeners y eventos globales de Home.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import * as alerts from '@/data/alerts';
import * as notifications from '@/data/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useLayoutHeader } from '@/lib/LayoutContext';

export function useHomeEvents({
  user,
  mode,
  resetToLogo,
  setHeader,
  handleBack,
  handleTitleClick,
}) {
  const queryClient = useQueryClient();
  const location = useLocation();

  useEffect(() => {
    const goLogo = () => resetToLogo({ invalidate: true });
    window.addEventListener('waitme:goLogo', goLogo);
    return () => window.removeEventListener('waitme:goLogo', goLogo);
  }, [resetToLogo]);

  useEffect(() => {
    if (!user?.id) return;
    const unsub = notifications.subscribeNotifications(user.id, () => {
      queryClient.invalidateQueries({ queryKey: ['unreadCount', user.id] });
    });
    return unsub;
  }, [user?.id, queryClient]);

  useEffect(() => {
    const unsub = alerts.subscribeAlerts({
      onUpsert: () => {
        queryClient.invalidateQueries({ queryKey: ['alerts', 'nearby'] });
        queryClient.invalidateQueries({ queryKey: ['alerts', 'viewport'] });
      },
      onDelete: () => {
        queryClient.invalidateQueries({ queryKey: ['alerts', 'nearby'] });
        queryClient.invalidateQueries({ queryKey: ['alerts', 'viewport'] });
      },
    });
    return unsub;
  }, [queryClient]);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('reset')) {
      resetToLogo({ invalidate: false });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location.search, resetToLogo]);

  useEffect(() => {
    setHeader({
      showBackButton: !!mode,
      onBack: mode ? handleBack : null,
      onTitleClick: handleTitleClick,
    });
    return () => setHeader({ showBackButton: false, onBack: null, onTitleClick: null });
  }, [mode, handleBack, handleTitleClick, setHeader]);

  useEffect(() => {
    if (!user?.id && !user?.email) return;
    queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
  }, [user?.id, user?.email, queryClient]);
}
