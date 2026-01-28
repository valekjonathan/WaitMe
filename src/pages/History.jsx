import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function History() {
  const navigate = useNavigate();
  const location = useLocation();

  // Datos recibidos desde Home
  const { alerts = [], user = null } = location.state || {};

  const myActiveAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (!user || a.user_id !== user.id) return false;
      if (
        a.status !== 'active' &&
        a.status !== 'reserved' &&
        a.status !== 'created'
      ) {
        return false;
      }
      return true;
    });
  }, [alerts, user]);

  const myFinishedAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (!user || a.user_id !== user.id) return false;
      if (
        a.status === 'active' ||
        a.status === 'reserved' ||
        a.status === 'created'
      ) {
        return false;
      }
      return true;
    });
  }, [alerts, user]);

  return (
    <div className="history-page">
      <h1>Tus alertas</h1>

      <div className="alerts-section">
        <h2>Activas</h2>
        {myActiveAlerts.length === 0 && (
          <p>No tienes ninguna alerta activa.</p>
        )}
        {myActiveAlerts.map((alert) => (
          <div
            key={alert.id}
            className="alert-card"
            onClick={() => navigate(`/alert/${alert.id}`)}
          >
            <p>{alert.title}</p>
          </div>
        ))}
      </div>

      <div className="alerts-section">
        <h2>Finalizadas</h2>
        {myFinishedAlerts.map((alert) => (
          <div
            key={alert.id}
            className="alert-card finished"
            onClick={() => navigate(`/alert/${alert.id}`)}
          >
            <p>{alert.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}