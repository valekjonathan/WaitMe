import { useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
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
import { badgePhotoWidth, labelNoClick } from '@/hooks/history/buildHistoryContexts';
import { useHistoryContexts } from '@/hooks/history/useHistoryContexts';
import { useHistoryTransforms } from '@/hooks/history/useHistoryTransforms';
import { useHistoryQueries } from '@/hooks/history/useHistoryQueries';
import { useHistoryFilters } from '@/hooks/history/useHistoryFilters';
import { useHistoryDialogs } from '@/hooks/history/useHistoryDialogs';
import { useHistoryActions } from '@/hooks/history/useHistoryActions';
import { useHistoryLocalSync } from '@/hooks/history/useHistoryLocalSync';
import { useHistoryDerived } from '@/hooks/history/useHistoryDerived';
import { useHistoryAutoExpire } from '@/hooks/history/useHistoryAutoExpire';
import { useHistoryClock } from '@/hooks/history/useHistoryClock';
import { useCarsMovementSync } from '@/hooks/history/useCarsMovementSync';
import { useExpiredReservationModal } from '@/hooks/history/useExpiredReservationModal';

export function useHistoryData() {
  const { user } = useAuth();
  const nowTs = useHistoryClock();

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

  useCarsMovementSync(myActiveAlerts);
  useExpiredReservationModal({
    nowTs,
    visibleActiveAlerts,
    expiredAlertExtend,
    setExpiredAlertExtend,
    setExpiredAlertModalId,
    getWaitUntilTs,
  });

  const { sellerContext, buyerContext } = useHistoryContexts({
    finalItems,
    thinkingRequests,
    setThinkingRequests,
    visibleActiveAlerts,
    nowTs,
    getCreatedTs,
    getWaitUntilTs,
    hiddenKeys,
    hideKey,
    formatCardDate,
    formatPriceInt,
    formatAddress,
    statusLabelFrom,
    reservationMoneyModeFromStatus,
    avatarFor,
    cancelAlertMutation,
    queryClient,
    deleteAlertSafe,
    user,
    setCancelReservedAlert,
    setCancelReservedOpen,
    expiredAlertExtend,
    setExpiredAlertExtend,
    setExpiredAlertModalId,
    reservationsActiveAll,
    reservationsFinalAll,
    autoFinalizedReservationsRef,
  });

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
