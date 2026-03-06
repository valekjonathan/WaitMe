import { useState } from "react";
import { addAlert, getAlerts } from "../services/parkingAlertService";

export default function useParkingAlerts() {

  const [alerts, setAlerts] = useState(getAlerts());

  const createAlert = (alert) => {
    addAlert(alert);
    setAlerts([...getAlerts()]);
  };

  return {
    alerts,
    createAlert
  };

}
