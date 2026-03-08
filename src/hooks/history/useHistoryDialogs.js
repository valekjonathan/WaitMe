import { useState } from 'react';

export function useHistoryDialogs() {
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelConfirmAlert, setCancelConfirmAlert] = useState(null);
  const [expirePromptOpen, setExpirePromptOpen] = useState(false);
  const [expirePromptAlert, setExpirePromptAlert] = useState(null);
  const [cancelReservedOpen, setCancelReservedOpen] = useState(false);
  const [cancelReservedAlert, setCancelReservedAlert] = useState(null);
  const [expiredAlertExtend, setExpiredAlertExtend] = useState({});
  const [expiredAlertModalId, setExpiredAlertModalId] = useState(null);

  return {
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
  };
}
