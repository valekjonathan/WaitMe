// src/store/alertsService.js

let alerts = [];
let listeners = [];

export const subscribeAlerts = (callback) => {
  listeners.push(callback);
  callback(alerts);
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
};

const notify = () => {
  listeners.forEach(l => l(alerts));
};

export const getAlerts = () => alerts;

export const addAlertOptimistic = (alert) => {
  alerts = [alert, ...alerts];
  notify();
};

export const replaceAlert = (tempId, realAlert) => {
  alerts = alerts.map(a => a.id === tempId ? realAlert : a);
  notify();
};

export const removeAlert = (id) => {
  alerts = alerts.filter(a => a.id !== id);
  notify();
};