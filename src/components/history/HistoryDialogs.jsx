import CancelReservedDialog from '@/components/history/dialogs/CancelReservedDialog';
import CancelConfirmDialog from '@/components/history/dialogs/CancelConfirmDialog';
import ExpiredAlertDialog from '@/components/history/dialogs/ExpiredAlertDialog';
import ExpiredReservationModal from '@/components/history/dialogs/ExpiredReservationModal';

export default function HistoryDialogs({
  cancelReservedOpen,
  setCancelReservedOpen,
  cancelReservedAlert,
  setCancelReservedAlert,
  cancelConfirmOpen,
  setCancelConfirmOpen,
  cancelConfirmAlert,
  setCancelConfirmAlert,
  expirePromptOpen,
  setExpirePromptOpen,
  expirePromptAlert,
  setExpirePromptAlert,
  expiredAlertModalId,
  setExpiredAlertModalId,
  hideKey,
  queryClient,
  stampFinalizedAt,
  formatCardDate,
  formatPriceInt,
  getCreatedTs,
  getWaitUntilTs,
  nowTs,
  cancelAlertMutation,
  expireAlertMutation,
  repeatAlertMutation,
  visibleActiveAlerts,
  avatarFor,
  badgePhotoWidth,
  labelNoClick,
  setExpiredAlertExtend,
}) {
  const expiredAlert = expiredAlertModalId
    ? visibleActiveAlerts?.find((a) => a.id === expiredAlertModalId)
    : null;

  return (
    <>
      <CancelReservedDialog
        open={cancelReservedOpen}
        alert={cancelReservedAlert}
        onClose={() => {
          setCancelReservedOpen(false);
          setCancelReservedAlert(null);
        }}
        hideKey={hideKey}
        queryClient={queryClient}
      />

      <CancelConfirmDialog
        open={cancelConfirmOpen}
        alert={cancelConfirmAlert}
        onOpenChange={(open) => {
          setCancelConfirmOpen(open);
          if (!open) setCancelConfirmAlert(null);
        }}
        onConfirm={(id) => {
          cancelAlertMutation.mutate(id);
          setCancelConfirmOpen(false);
          setCancelConfirmAlert(null);
        }}
        onReject={() => {
          setCancelConfirmOpen(false);
          setCancelConfirmAlert(null);
        }}
      />

      <ExpiredAlertDialog
        open={expirePromptOpen}
        alert={expirePromptAlert}
        getCreatedTs={getCreatedTs}
        getWaitUntilTs={getWaitUntilTs}
        nowTs={nowTs}
        formatCardDate={formatCardDate}
        formatPriceInt={formatPriceInt}
        onOpenChange={(open) => {
          setExpirePromptOpen(open);
          if (!open) setExpirePromptAlert(null);
        }}
        onAccept={(id) => {
          expireAlertMutation.mutate(id);
          setExpirePromptOpen(false);
          setExpirePromptAlert(null);
        }}
        onRepeat={(alert) => {
          repeatAlertMutation.mutate(alert);
          setExpirePromptOpen(false);
          setExpirePromptAlert(null);
        }}
      />

      {expiredAlertModalId && expiredAlert && (
        <ExpiredReservationModal
          alert={expiredAlert}
          getWaitUntilTs={getWaitUntilTs}
          avatarFor={avatarFor}
          onClose={() => setExpiredAlertModalId(null)}
          setExpiredAlertExtend={setExpiredAlertExtend}
          setExpiredAlertModalId={setExpiredAlertModalId}
          queryClient={queryClient}
        />
      )}
    </>
  );
}
