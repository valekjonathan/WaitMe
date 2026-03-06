let alerts = [];

export const addAlert = (alert) => {
  alerts.push(alert);
  return alert;
};

export const getAlerts = () => {
  return alerts;
};

export const removeAlert = (id) => {
  alerts = alerts.filter(a => a.id !== id);
};
