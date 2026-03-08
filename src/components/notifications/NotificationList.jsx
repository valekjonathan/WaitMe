/**
 * Lista completa: solicitudes entrantes + cabecera + items de notificaciones.
 */

import NotificationHeader from './NotificationHeader';
import NotificationEmptyState from './NotificationEmptyState';
import NotificationItem from './NotificationItem';
import NotificationIncomingRequest from './NotificationIncomingRequest';

export default function NotificationList({
  incomingRequests,
  alertsById,
  notifications,
  unreadCount,
  onAcceptRequest,
  onRejectRequest,
  onMarkRead,
  onMarkAllRead,
  onOpenChat,
  onOpenNavigate,
  onRunAction,
}) {
  return (
    <>
      {incomingRequests.length > 0 && (
        <div className="px-4 pt-4 space-y-4">
          {incomingRequests.map((r) => (
            <NotificationIncomingRequest
              key={r?.id}
              request={r}
              alert={r?.alertId ? alertsById?.[r.alertId] : null}
              onAccept={onAcceptRequest}
              onReject={onRejectRequest}
            />
          ))}
        </div>
      )}

      {notifications.length === 0 ? (
        <NotificationEmptyState />
      ) : (
        <>
          <NotificationHeader unreadCount={unreadCount} onMarkAllRead={onMarkAllRead} />

          <div className="px-4 space-y-5 pt-4">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={onMarkRead}
                onOpenChat={onOpenChat}
                onOpenNavigate={onOpenNavigate}
                onRunAction={onRunAction}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
