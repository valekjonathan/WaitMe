/**
 * Cabecera del chat: foto, nombre, botones IR y teléfono.
 */

import { Navigation, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChatHeader({ otherUser }) {
  return (
    <div className="fixed top-[56px] left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
      <div className="flex items-center gap-3 px-4 py-1 pt-[10px]">
        <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-purple-500/50 flex-shrink-0">
          {otherUser?.photo ? (
            <img
              src={otherUser.photo}
              alt={otherUser.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xl">
              👤
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-semibold truncate">{otherUser?.name || 'Usuario'}</h2>
          <p className="text-xs text-gray-400">En línea</p>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700 border-2 border-blue-400/70 text-white rounded-lg h-9 px-3">
          <Navigation className="w-4 h-4 mr-1" />
          IR
        </Button>

        <div className="bg-purple-600/20 border border-purple-500/40 rounded-lg p-2 hover:bg-purple-600/30 cursor-pointer transition-colors">
          <Phone className="w-5 h-5 text-purple-300" />
        </div>
      </div>
    </div>
  );
}
