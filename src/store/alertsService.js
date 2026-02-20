// src/store/alertsService.js

export const notifyAlertCreated = () => {
  try {
    window.dispatchEvent(new Event('waitme:badgeRefresh'));
  } catch {}
};

export const notifyAlertRemoved = () => {
  try {
    window.dispatchEvent(new Event('waitme:badgeRefresh'));
  } catch {}
};