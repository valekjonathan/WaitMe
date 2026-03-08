/**
 * Estado vacío cuando no hay chats.
 */

import { MessageCircle } from 'lucide-react';

export default function ChatEmptyState() {
  return (
    <div className="min-h-[calc(100dvh-60px-96px)] flex items-center justify-center px-4">
      <div className="text-center">
        <MessageCircle className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <p className="text-gray-400 text-sm">No hay chats iniciados.</p>
      </div>
    </div>
  );
}
