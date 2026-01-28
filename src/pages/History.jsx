import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../hooks/useAlerts';

export default function History() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { myAlerts, refetchMyAlerts } = useAlerts();

  useEffect(() => {
    refetchMyAlerts();
  }, []);

  const myActiveAlerts = useMemo(() => {
    const dbAlerts = myAlerts.filter((a) => {
      if (a.user_id !== user?.id) return false;

      // 🔴 AQUÍ ESTABA EL PROBLEMA
      if (
        a.status !== 'active' &&
        a.status !== 'reserved' &&
        a.status !== 'created'
      )
        return false;

      return true;
    });

    return [...dbAlerts];
  }, [myAlerts, user?.id]);

  const myFinishedAlerts = useMemo(() => {
    const dbAlerts = myAlerts.filter((a) => {
      if (a.user_id !== user?.id) return false;
      if (a.status === 'active') return false;
      if (a.status === 'reserved') return false;
      if (a.status === 'created') return false;
      return true;
    });

    return [...dbAlerts];
  }, [myAlerts, user?.id]);

  return (
    <div className="history-page">
      <h1>Tus alertas</h1>

      <div className="alerts-section">
        <h2>Activas</h2>
        {myActiveAlerts.length === 0 && (
          <p>No tienes alertas activas</p>
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