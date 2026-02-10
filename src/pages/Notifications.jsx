import { getDemoState } from '@/components/DemoFlowManager';

export default function Notifications() {
  const { notifications } = getDemoState();

  return (
    <div>
      {notifications.map(n => (
        <div key={n.id}>
          {n.type === 'reservation_request' && (
            <>
              <p>{n.user} quiere reservar</p>
              <button>Aceptar</button>
              <button>Rechazar</button>
              <button>Me lo pienso</button>
            </>
          )}
          {n.type === 'payment_completed' && (
            <p>Pago completado de {n.user}</p>
          )}
        </div>
      ))}
    </div>
  );
}
