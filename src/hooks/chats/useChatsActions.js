/**
 * Handlers y acciones de la pantalla Chats.
 * @module hooks/chats/useChatsActions
 */

import { useNavigate } from 'react-router-dom';
import * as notifications from '@/data/notifications';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { pickCoords, hasLatLon } from './useChatsData';

export function useChatsActions(data) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setDemoConvs } = data;

  const openDirectionsToAlert = (alert) => {
    const coords = hasLatLon(alert) ? pickCoords(alert) : null;
    if (!coords) return;
    const { lat, lon } = coords;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`;
    window.location.href = url;
  };

  const navigateToChat = (conv, otherUserName, otherUserPhoto) => {
    const name = encodeURIComponent(otherUserName || '');
    const photo = encodeURIComponent(otherUserPhoto || '');
    navigate(
      `/chat?conversationId=${conv.id}&alertId=${conv.alert_id}&otherName=${name}&otherPhoto=${photo}`
    );
  };

  const navigateToDemoChat = (dc) => {
    navigate(
      `/chat?demo=true&conversationId=${dc.id}&alertId=${dc.alert_id}&otherName=${encodeURIComponent(dc.buyer_name || '')}&otherPhoto=${encodeURIComponent(dc.buyer_photo || '')}`
    );
  };

  const clearDemoUnread = (dc, demoConvs) => {
    try {
      const updated = demoConvs.map((c) => (c.id === dc.id ? { ...c, unread: 0 } : c));
      setDemoConvs(updated);
      localStorage.setItem('waitme:demo_conversations', JSON.stringify(updated));
      const total = updated.reduce((s, c) => s + (c.unread || 0), 0);
      localStorage.setItem('waitme:chat_unread', String(total));
      window.dispatchEvent(new Event('waitme:chatUnreadUpdate'));
    } catch (error) {
      console.error('[WaitMe Error]', error);
    }
  };

  const removeDemoConv = (dc, demoConvs) => {
    const updated = demoConvs.filter((c) => c.id !== dc.id);
    setDemoConvs(updated);
    localStorage.setItem('waitme:demo_conversations', JSON.stringify(updated));
    const total = updated.reduce((s, c) => s + (c.unread || 0), 0);
    localStorage.setItem('waitme:chat_unread', String(total));
    window.dispatchEvent(new Event('waitme:chatUnreadUpdate'));
  };

  const handleProrroga = async ({
    selectedProrroga,
    currentExpiredAlert,
    setShowProrrogaDialog,
    setSelectedProrroga,
    setCurrentExpiredAlert,
  }) => {
    if (!selectedProrroga || !currentExpiredAlert) return;

    const { minutes, price } = selectedProrroga;
    const { alert, isBuyer } = currentExpiredAlert;

    try {
      const recipientId = isBuyer ? alert.user_id : alert.reserved_by_id;
      const { error } = await notifications.createNotification({
        user_id: recipientId,
        type: 'extension_request',
        title: 'Prórroga solicitada',
        message: `${minutes} min por ${price}€`,
        metadata: {
          sender_id: user?.id,
          sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Usuario',
          alert_id: alert.id,
          amount: price,
          extension_minutes: minutes,
          status: 'pending',
        },
      });
      if (error) throw error;

      toast({
        title: '✅ PRÓRROGA ENVIADA',
        description: `${minutes} min por ${price}€`,
      });
    } catch (err) {
      console.error('Error creando notificación de prórroga:', err);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la prórroga. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    }

    setShowProrrogaDialog(false);
    setSelectedProrroga(null);
    setCurrentExpiredAlert(null);
  };

  const openExpiredDialog = ({
    alert,
    isBuyer,
    expiredHandledRef,
    setCurrentExpiredAlert,
    setSelectedProrroga,
    setShowProrrogaDialog,
  }) => {
    if (!alert?.id) return;
    if (expiredHandledRef?.current?.has(alert.id)) return;
    expiredHandledRef?.current?.add(alert.id);

    const title = isBuyer ? '⏱️ No te has presentado' : '⏱️ Usuario no se ha presentado';
    const desc = isBuyer
      ? 'No te has presentado, se te devolverá tu importe menos la comisión de WaitMe!'
      : 'Usuario no se ha presentado, se te ingresará el 33% del importe de la operación como compensación por tu espera';

    toast({ title, description: desc });

    setCurrentExpiredAlert({ alert, isBuyer });
    setSelectedProrroga(null);
    setShowProrrogaDialog(true);
  };

  return {
    openDirectionsToAlert,
    navigateToChat,
    navigateToDemoChat,
    clearDemoUnread,
    removeDemoConv,
    handleProrroga,
    openExpiredDialog,
  };
}
