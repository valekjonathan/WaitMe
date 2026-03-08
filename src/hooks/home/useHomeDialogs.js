/**
 * Estado de diálogos y modales de Home.
 */
import { useState } from 'react';

export function useHomeDialogs() {
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  const [pendingPublishPayload, setPendingPublishPayload] = useState(null);
  const [oneActiveAlertOpen, setOneActiveAlertOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, alert: null });

  return {
    confirmPublishOpen,
    setConfirmPublishOpen,
    pendingPublishPayload,
    setPendingPublishPayload,
    oneActiveAlertOpen,
    setOneActiveAlertOpen,
    confirmDialog,
    setConfirmDialog,
  };
}
