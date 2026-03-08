/**
 * Página de notificaciones. Orquestador ligero.
 */

import { useNotificationsData } from '@/hooks/notifications/useNotificationsData';
import { useNotificationsActions } from '@/hooks/notifications/useNotificationsActions';
import NotificationList from '@/components/notifications/NotificationList';

export default function Notifications() {
  const data = useNotificationsData();
  const actions = useNotificationsActions(data);

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col">
      <main className="flex-1 flex flex-col min-h-0 overflow-auto">
        <NotificationList
          incomingRequests={data.incomingRequests}
          alertsById={data.alertsById}
          notifications={data.notifications}
          unreadCount={data.unreadCount}
          onAcceptRequest={actions.acceptRequest}
          onRejectRequest={actions.rejectRequest}
          onMarkRead={actions.markRead}
          onMarkAllRead={actions.handleMarkAllRead}
          onOpenChat={actions.openChat}
          onOpenNavigate={actions.openNavigate}
          onRunAction={actions.runAction}
        />
      </main>
    </div>
  );
}
