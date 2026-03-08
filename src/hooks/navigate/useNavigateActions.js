/**
 * Handlers y acciones de la pantalla Navigate.
 * @module hooks/navigate/useNavigateActions
 */

import { useCallback, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import * as alerts from '@/data/alerts';
import * as chat from '@/data/chat';
import * as transactions from '@/data/transactions';
import { useQueryClient } from '@tanstack/react-query';
import { finalize, OUTCOME } from '@/lib/transactionEngine';
import { useTransactionMonitoring } from '@/hooks/useTransactionMonitoring';

export function useNavigateActions(state) {
  const {
    alert,
    user,
    userLocation,
    setUserLocation,
    sellerLocation,
    setSellerLocation,
    isTracking,
    setIsTracking,
    setPaymentReleased,
    setShowPaymentSuccess,
    setForceRelease,
    setShowAbandonWarning,
    setShowCancelWarning,
    displayAlert,
    displayAlertOrNearest,
    isBrowseMode,
    isSeller,
    isBuyer,
    isSellerHere,
    alertId,
    animationRef,
    hasReleasedPaymentRef,
    paymentReleased,
    forceRelease,
  } = state;

  const queryClient = useQueryClient();

  const doReleasePayment = useCallback(
    async (a, u) => {
      if (!a || !u || hasReleasedPaymentRef.current) return;
      hasReleasedPaymentRef.current = true;
      const amount = Number(a?.price ?? 0);
      const sellerId = a?.user_id ?? a?.user_email;
      const buyerId = u?.id;
      if (Number.isFinite(amount) && sellerId && buyerId) {
        finalize({ outcome: OUTCOME.FINALIZADA_OK, amount, sellerId, buyerId });
      }
      const isDemo = String(a.id).startsWith('demo_');
      if (!isDemo) {
        await alerts.updateAlert(a.id, { status: 'completed' });
        const sellerEarnings = a.price * 0.67;
        const platformFee = a.price * 0.33;
        const { error: txErr } = await transactions.createTransaction({
          alert_id: a.id,
          seller_id: a.user_id ?? a.seller_id,
          buyer_id: u.id,
          seller_name: a.user_name ?? 'Usuario',
          buyer_name: u.full_name?.split(' ')[0] || 'Usuario',
          amount: a.price,
          seller_earnings: sellerEarnings,
          platform_fee: platformFee,
          status: 'completed',
          address: a.address ?? a.address_text,
        });
        if (txErr) console.error('Error creando transacción:', txErr);
        const { data: conv } = await chat.createConversation({
          buyerId: u.id,
          sellerId: a.user_id || a.seller_id,
          alertId: a.id,
        });
        if (conv?.id) {
          await chat.sendMessage({
            conversationId: conv.id,
            senderId: u.id,
            body: `✅ Pago liberado: ${a.price.toFixed(2)}€. El vendedor recibirá ${sellerEarnings.toFixed(2)}€`,
          });
        }
      }
      setPaymentReleased(true);
      setShowPaymentSuccess(true);
      try {
        window.dispatchEvent(
          new CustomEvent('waitme:paymentReleased', {
            detail: { amount: Number(a?.price ?? 0) },
          })
        );
      } catch (error) {
        console.error('[WaitMe Error]', error);
      }
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['navigationAlert'] });
      queryClient.invalidateQueries({ queryKey: ['myTransactions'] });
      setTimeout(() => {
        window.location.href = createPageUrl('History');
      }, 3000);
    },
    [queryClient, setPaymentReleased, setShowPaymentSuccess, hasReleasedPaymentRef]
  );

  useTransactionMonitoring({
    enabled: !!(alert && user && !isSellerHere && !paymentReleased && !forceRelease),
    getUserALocation: () =>
      sellerLocation && sellerLocation.length >= 2
        ? { lat: sellerLocation[0], lng: sellerLocation[1] }
        : null,
    getUserBLocation: () =>
      userLocation && userLocation.length >= 2
        ? { lat: userLocation[0], lng: userLocation[1] }
        : null,
    getAlertLocation: () =>
      alert?.latitude != null && alert?.longitude != null
        ? { lat: alert.latitude, lng: alert.longitude }
        : null,
    onCompleted: () => doReleasePayment(alert, user),
  });

  useEffect(() => {
    if (!forceRelease || !alert || !user || hasReleasedPaymentRef.current || paymentReleased)
      return;
    if (isSellerHere) return;
    setForceRelease(false);
    doReleasePayment(alert, user);
  }, [forceRelease, alert, user, paymentReleased, isSellerHere, doReleasePayment, setForceRelease]);

  const startTracking = useCallback(() => {
    setIsTracking(true);
    try {
      window.localStorage.setItem('showBanner', 'true');
      window.dispatchEvent(new Event('waitme:requestsChanged'));
      window.dispatchEvent(new Event('waitme:showIncomingBanner'));
    } catch (error) {
      console.error('[WaitMe Error]', error);
    }

    const moveTowardsDestination = () => {
      setUserLocation((prevLoc) => {
        if (!prevLoc || !sellerLocation) return prevLoc;
        const lat1 = prevLoc[0],
          lon1 = prevLoc[1];
        const lat2 = sellerLocation[0],
          lon2 = sellerLocation[1];
        const R = 6371000;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
        const distM = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (distM < 5) return prevLoc;
        const stepSize = 15 / R;
        const fraction = Math.min(stepSize / (distM / R), 1);
        return [lat1 + (lat2 - lat1) * fraction, lon1 + (lon2 - lon1) * fraction];
      });

      setSellerLocation((prevLoc) => {
        if (!prevLoc || !userLocation) return prevLoc;
        const lat1 = prevLoc[0],
          lon1 = prevLoc[1];
        const lat2 = userLocation[0],
          lon2 = userLocation[1];
        const R = 6371000;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
        const distM = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (distM < 5) return prevLoc;
        const stepSize = 12 / R;
        const fraction = Math.min(stepSize / (distM / R), 1);
        return [lat1 + (lat2 - lat1) * fraction, lon1 + (lon2 - lon1) * fraction];
      });
    };
    animationRef.current = setInterval(moveTowardsDestination, 400);
  }, [
    setIsTracking,
    setUserLocation,
    setSellerLocation,
    sellerLocation,
    userLocation,
    animationRef,
  ]);

  const stopTracking = useCallback(() => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
    setIsTracking(false);
  }, [animationRef, setIsTracking]);

  const handleCancelAlert = useCallback(async () => {
    if (!displayAlert?.id) return;
    await alerts.updateAlert(displayAlert.id, {
      status: 'cancelled',
      cancel_reason: 'user_cancelled',
    });
    setShowCancelWarning(false);
    setTimeout(() => {
      window.location.href = createPageUrl('Home');
    }, 500);
  }, [displayAlert?.id, setShowCancelWarning]);

  return {
    startTracking,
    stopTracking,
    doReleasePayment,
    handleCancelAlert,
  };
}
