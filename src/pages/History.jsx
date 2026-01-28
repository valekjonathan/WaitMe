import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlerts } from '../hooks/useAlerts';

export default function History() {
  const navigate = useNavigate();
  const { myAlerts, refetchMyAlerts, user } = useAlerts();

  useEffect(() => {
    refetchMyAlerts();
  }, [refetchMyAlerts]);

  const myActiveAlerts = useMemo(() => {
    return myAlerts.filter((a) => {
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
  }, [myAlerts, user]);

  const myFinishedAlerts = useMemo(() => {
    return myAlerts.filter((a) => {
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
  }, [myAlerts, user]);

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