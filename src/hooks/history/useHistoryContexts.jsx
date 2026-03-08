import { stampFinalizedAt } from '@/lib/finalizedAtStore';
import { getCarFill, getCarFillThinking, formatPlate } from '@/utils/carUtils';
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
import {
  noScrollBar,
  badgePhotoWidth,
  labelNoClick,
  buildSellerContext,
  buildBuyerContext,
} from '@/hooks/history/buildHistoryContexts';
import { toMs } from '@/lib/alertSelectors';
import {
  formatAddress,
  formatPriceInt,
  formatRemaining,
} from '@/components/history/historyItemUtils';

export function useHistoryContexts({
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
}) {
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

  const sellerContext = buildSellerContext({
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
    getCarFill,
    getCarFillThinking,
    CarIconProfile,
    PlateProfile,
    badgePhotoWidth,
    labelNoClick,
    cancelAlertMutation,
    queryClient,
    ReservedByContentWrapper,
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
  });

  const buyerContext = buildBuyerContext({
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
  });

  return { sellerContext, buyerContext };
}
