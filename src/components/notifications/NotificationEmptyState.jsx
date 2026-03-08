/**
 * Estado vacío cuando no hay notificaciones.
 */

import { Bell } from 'lucide-react';

export default function NotificationEmptyState() {
  return (
    <div className="min-h-[calc(100dvh-80px-96px)] flex items-center justify-center px-4">
      <div className="text-center">
        <Bell className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <p className="text-gray-400 text-sm">No hay notificaciones.</p>
      </div>
    </div>
  );
}
