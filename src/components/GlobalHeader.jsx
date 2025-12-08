import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Settings, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalHeader() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Usuario no autenticado');
      }
    };
    fetchUser();
  }, []);

  // Obtener mensajes no leídos
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadMessages', user?.email],
    queryFn: async () => {
      const messages = await base44.entities.ChatMessage.filter({ receiver_id: user?.email, read: false });
      return messages.length;
    },
    enabled: !!user?.email,
    refetchInterval: 5000
  });

  return (
    <header className="fixed top-0 right-0 z-50 flex items-center gap-1 px-4 py-3 pr-16">
      <Link to={createPageUrl('Settings')}>
        <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 w-16 h-16 rounded-xl">
          <Settings className="w-12 h-12" strokeWidth={3} />
        </Button>
      </Link>
      <Link to={createPageUrl('Chats')} className="relative">
        <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 w-16 h-16 rounded-xl">
          <MessageCircle className="w-12 h-12" strokeWidth={3} />
        </Button>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>
    </header>
  );
}