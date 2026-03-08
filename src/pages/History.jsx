import { Tabs } from '@/components/ui/tabs';
import SellerLocationTracker from '@/components/SellerLocationTracker';
import { useHistoryData } from '@/hooks/useHistoryData';
import HistoryFilters from '@/components/history/HistoryFilters';
import HistoryList from '@/components/history/HistoryList';
import HistoryDialogs from '@/components/history/HistoryDialogs';

export default function Alertas() {
  const {
    sellerContext,
    buyerContext,
    userLocation,
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
    badgePhotoWidth,
    labelNoClick,
  } = useHistoryData();

  return (
    <div className="min-h-[100dvh] text-white flex flex-col" style={{ backgroundColor: '#0b0b0b' }}>
      <main className="flex-1 flex flex-col min-h-0 overflow-auto pt-[56px] pb-20 px-4">
        <Tabs defaultValue="alerts" className="w-full">
          <HistoryFilters />
          <HistoryList sellerContext={sellerContext} buyerContext={buyerContext} />
        </Tabs>
      </main>

      <HistoryDialogs
        cancelReservedOpen={cancelReservedOpen}
        setCancelReservedOpen={setCancelReservedOpen}
        cancelReservedAlert={cancelReservedAlert}
        setCancelReservedAlert={setCancelReservedAlert}
        cancelConfirmOpen={cancelConfirmOpen}
        setCancelConfirmOpen={setCancelConfirmOpen}
        cancelConfirmAlert={cancelConfirmAlert}
        setCancelConfirmAlert={setCancelConfirmAlert}
        expirePromptOpen={expirePromptOpen}
        setExpirePromptOpen={setExpirePromptOpen}
        expirePromptAlert={expirePromptAlert}
        setExpirePromptAlert={setExpirePromptAlert}
        expiredAlertModalId={expiredAlertModalId}
        setExpiredAlertModalId={setExpiredAlertModalId}
        hideKey={hideKey}
        queryClient={queryClient}
        stampFinalizedAt={stampFinalizedAt}
        formatCardDate={formatCardDate}
        formatPriceInt={formatPriceInt}
        getCreatedTs={getCreatedTs}
        getWaitUntilTs={getWaitUntilTs}
        nowTs={nowTs}
        cancelAlertMutation={cancelAlertMutation}
        expireAlertMutation={expireAlertMutation}
        repeatAlertMutation={repeatAlertMutation}
        visibleActiveAlerts={visibleActiveAlerts}
        avatarFor={avatarFor}
        badgePhotoWidth={badgePhotoWidth}
        labelNoClick={labelNoClick}
        setExpiredAlertExtend={setExpiredAlertExtend}
      />

      {myActiveAlerts
        .filter((a) => a.status === 'reserved')
        .map((alert) => (
          <SellerLocationTracker key={alert.id} alertId={alert.id} userLocation={userLocation} />
        ))}
    </div>
  );
}
