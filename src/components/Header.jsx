import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Settings, MessageCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header({ showBackButton = false, backTo = 'Home' }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Error:', error);
      }
    };
    fetchUser();
  }, []);

  const { data: totalUnread = 0 } = useQuery({
    queryKey: ['conversationsMeta', user?.id],
    queryFn: async () => {
      const conversations = await base44.entities.Conversation.list();
      return conversations.reduce((sum, conv) => {
        const isP1 = conv.participant1_id === user?.id;
        const unread = isP1 ? conv.unread_count_p1 : conv.unread_count_p2;
        return sum + (unread || 0);
      }, 0);
    },
    enabled: !!user?.id,
    refetchInterval: 15000
    });

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-700">
      <div className="grid grid-cols-[48px_1fr_auto] items-center px-4 py-3">
        {showBackButton ? (
          <Link to={createPageUrl(backTo)}>
            <Button variant="ghost" size="icon" className="text-white">
              <ArrowLeft className="w-6  h-6" />
            </Button>
          </Link>
        ) : (
          <div className="w-10" /> 
        )}
        
        <div className="flex items-center justify-center gap-2">
          <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-1 flex items-center gap-1">
            <span className="text-purple-400 font-bold text-sm">{(user?.credits || 0).toFixed(2)}€</span>
          </div>
          <Link to={createPageUrl('Home')}>
            <h1 className="text-lg font-semibold cursor-pointer hover:opacity-80 transition-opacity">
              <span className="text-white">Wait</span><span className="text-purple-500">Me!</span>
            </h1>
          </Link>
        </div>

        <div className="flex items-center justify-end gap-1">
          <Link to={createPageUrl('Settings')}>
            <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
          <Link to={createPageUrl('Profile')} className="relative">
            <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20">
              <User className="w-5 h-5" />
            </Button>
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header> 
  );
}