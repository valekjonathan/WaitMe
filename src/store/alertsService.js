// src/store/alertsService.js

let alerts = [];
let listeners = [];

/* ======================
SUBSCRIPCIÓN
====================== */
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

/* ======================
GET
====================== */
export const getAlerts = () => alerts;

/* ======================
OPTIMISTIC ADD
====================== */
export const addAlertOptimistic = (alert) => {
  alerts = [alert, ...alerts];
  notify();
};

/* ======================
REPLACE (cuando responde backend)
====================== */
export const replaceAlert = (tempId, realAlert) => {
  alerts = alerts.map(a => a.id === tempId ? realAlert : a);
  notify();
};

/* ======================
REMOVE
====================== */
export const removeAlert = (id) => {
  alerts = alerts.filter(a => a.id !== id);
  notify();
};

/* ======================
CREAR ALERTA TEMPORAL (CLAVE)
====================== */
export const createTempAlert = (data) => {
  const tempId = 'temp-' + Date.now();

  const tempAlert = {
    ...data,
    id: tempId,
    status: 'active',
    _optimistic: true,
    created_date: new Date().toISOString()
  };

  addAlertOptimistic(tempAlert);

  return tempId;
};