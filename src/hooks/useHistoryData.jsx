import { useState, useEffect, useMemo } from 'react';
import * as alerts from '@/data/alerts';
import { useAuth } from '@/lib/AuthContext';
import { setCarsMovementMode, CARS_MOVEMENT_MODE } from '@/stores/carsMovementStore';
import { toMs, getActiveSellerAlerts } from '@/lib/alertSelectors';
import { stampFinalizedAt } from '@/lib/finalizedAtStore';
import { getCarFill, getCarFillThinking, formatPlate } from '@/utils/carUtils';
import {
  formatAddress,
  formatPriceInt,
  formatRemaining,
} from '@/components/history/historyItemUtils';
import {
  CarIconProfile,
  PlateProfile,
  SectionTag,
  CardHeaderRow,
  MoneyChip,
  MarcoContent,
  CountdownButton,
} from '@/components/history/HistoryItem';
import ReservedByContent from '@/components/history/ReservedByContent';
import { useHistoryTransforms } from '@/hooks/history/useHistoryTransforms';
import { useHistoryQueries } from '@/hooks/history/useHistoryQueries';
import { useHistoryFilters } from '@/hooks/history/useHistoryFilters';
import { useHistoryDialogs } from '@/hooks/history/useHistoryDialogs';
import { useHistoryActions } from '@/hooks/history/useHistoryActions';
import { useHistoryLocalSync } from '@/hooks/history/useHistoryLocalSync';
import { useHistoryDerived } from '@/hooks/history/useHistoryDerived';
import { useHistoryAutoExpire } from '@/hooks/history/useHistoryAutoExpire';

const labelNoClick = 'cursor-default select-none pointer-events-none';
const noScrollBar =
  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
const badgePhotoWidth = 'w-[95px] h-7 flex items-center justify-center text-center';

export function useHistoryData() {
  const { user } = useAuth();
  const [nowTs, setNowTs] = useState(Date.now());

  const {
    formatCardDate,
    statusLabelFrom,
    reservationMoneyModeFromStatus,
    avatarFor,
    getCreatedTs,
    getWaitUntilTs,
  } = useHistoryTransforms();

  const { myAlerts, transactionsData, loadingAlerts, loadingTransactions, queryClient } =
    useHistoryQueries(user?.id);

  const { hiddenKeys, hideKey } = useHistoryFilters();

  const {
    cancelConfirmOpen,
    setCancelConfirmOpen,
    cancelConfirmAlert,
    setCancelConfirmAlert,
    expirePromptOpen,
    setExpirePromptOpen,
    expirePromptAlert,
    setExpirePromptAlert,
    cancelReservedOpen,
    setCancelReservedOpen,
    cancelReservedAlert,
    setCancelReservedAlert,
    expiredAlertExtend,
    setExpiredAlertExtend,
    expiredAlertModalId,
    setExpiredAlertModalId,
  } = useHistoryDialogs();

  const { deleteAlertSafe, cancelAlertMutation, expireAlertMutation, repeatAlertMutation } =
    useHistoryActions(user);

  const { thinkingRequests, setThinkingRequests, rejectedRequests } = useHistoryLocalSync();

  const myActiveAlerts = useMemo(
    () => getActiveSellerAlerts(myAlerts, user?.id, user?.email),
    [myAlerts, user?.id, user?.email]
  );

  const visibleActiveAlerts = useMemo(
    () => myActiveAlerts.filter((a) => !hiddenKeys.has(`active-${a.id}`)),
    [myActiveAlerts, hiddenKeys]
  );

  const { finalItems, reservationsActiveAll, reservationsFinalAll } = useHistoryDerived({
    myAlerts,
    transactionsData,
    user,
    hiddenKeys,
    rejectedRequests,
  });

  const { autoFinalizedReservationsRef } = useHistoryAutoExpire({
    nowTs,
    visibleActiveAlerts,
    reservationsActiveAll,
    getCreatedTs,
    getWaitUntilTs,
    user,
    queryClient,
    expirePromptOpen,
    setExpirePromptAlert,
    setExpirePromptOpen,
  });

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const hasReservedAlerts = myActiveAlerts.filter((a) => a.status === 'reserved').length > 0;
  useEffect(() => {
    setCarsMovementMode(
      hasReservedAlerts ? CARS_MOVEMENT_MODE.WAITME_ACTIVE : CARS_MOVEMENT_MODE.STATIC
    );
    return () => setCarsMovementMode(CARS_MOVEMENT_MODE.STATIC);
  }, [hasReservedAlerts]);

  useEffect(() => {
    if (!visibleActiveAlerts) return;
    visibleActiveAlerts.forEach((alert) => {
      if (alert.status !== 'reserved') return;
      const waitUntilTs = getWaitUntilTs(alert);
      if (!waitUntilTs) return;
      const rem = Math.max(0, waitUntilTs - nowTs);
      if (rem === 0 && !expiredAlertExtend[alert.id]) {
        setExpiredAlertExtend((prev) => ({ ...prev, [alert.id]: true }));
        setExpiredAlertModalId(alert.id);
      }
    });
  }, [nowTs, visibleActiveAlerts, expiredAlertExtend]);

  const ReservedByContentWrapper = (props) => (
    <ReservedByContent
      {...props}
      expiredAlertExtend={expiredAlertExtend}
      setExpiredAlertExtend={setExpiredAlertExtend}
      setExpiredAlertModalId={setExpiredAlertModalId}
      avatarFor={avatarFor}
      queryClient={queryClient}
      stampFinalizedAt={stampFinalizedAt}
    />
  );

  const sellerContext = {
    finalItems,
    noScrollBar,
    SectionTag,
    thinkingRequests,
    setThinkingRequests,
    visibleActiveAlerts,
    nowTs,
    formatRemaining,
    getCreatedTs,
    getWaitUntilTs,
    hiddenKeys,
    hideKey,
    formatCardDate,
    formatPriceInt,
    formatAddress,
    getCarFill,
    getCarFillThinking,
    CarIconProfile,
    PlateProfile,
    badgePhotoWidth,
    labelNoClick,
    cancelAlertMutation,
    queryClient,
    ReservedByContent: ReservedByContentWrapper,
    CardHeaderRow,
    MoneyChip,
    CountdownButton,
    statusLabelFrom,
    MarcoContent,
    deleteAlertSafe,
    user,
    setCancelReservedAlert,
    setCancelReservedOpen,
    expiredAlertExtend,
    setExpiredAlertExtend,
    setExpiredAlertModalId,
    toMs,
    avatarFor,
    formatPlate,
    reservationMoneyModeFromStatus,
  };

  const buyerContext = {
    noScrollBar,
    SectionTag,
    reservationsActiveAll,
    nowTs,
    getCreatedTs,
    getWaitUntilTs,
    formatRemaining,
    hiddenKeys,
    autoFinalizedReservationsRef,
    formatCardDate,
    formatPriceInt,
    reservationMoneyModeFromStatus,
    CardHeaderRow,
    badgePhotoWidth,
    labelNoClick,
    MoneyChip,
    hideKey,
    user,
    queryClient,
    MarcoContent,
    formatAddress,
    reservationsFinalAll,
    toMs,
    deleteAlertSafe,
    statusLabelFrom,
  };

  const loading = loadingAlerts || loadingTransactions;

  return {
    sellerContext,
    buyerContext,
    loading,
    user,
    userLocation: null,
    cancelConfirmOpen,
    setCancelConfirmOpen,
    cancelConfirmAlert,
    setCancelConfirmAlert,
    expirePromptOpen,
    setExpirePromptOpen,
    expirePromptAlert,
    setExpirePromptAlert,
    cancelReservedOpen,
    setCancelReservedOpen,
    cancelReservedAlert,
    setCancelReservedAlert,
    hideKey,
    queryClient,
    formatCardDate,
    formatPriceInt,
    formatAddress,
    getCreatedTs,
    getWaitUntilTs,
    nowTs,
    cancelAlertMutation,
    expireAlertMutation,
    repeatAlertMutation,
    stampFinalizedAt,
    visibleActiveAlerts,
    myActiveAlerts,
    expiredAlertModalId,
    setExpiredAlertModalId,
    setExpiredAlertExtend,
    avatarFor,
    PlateProfile,
    CarIconProfile,
    getCarFill,
    badgePhotoWidth,
    labelNoClick,
    MoneyChip,
    CardHeaderRow,
    CountdownButton,
  };
}
