/**
 * Cabecera de la lista de notificaciones.
 */

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotificationHeader({ unreadCount, onMarkAllRead }) {
  return (
    <div className="px-4 pt-3 pb-2 border-b border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-purple-400" />
          <p className="text-sm text-gray-300">{unreadCount} sin leer</p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-purple-400 hover:text-purple-300"
          onClick={onMarkAllRead}
        >
          Marcar todas como leídas
        </Button>
      </div>
    </div>
  );
}
