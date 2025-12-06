import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function BottomNav() {
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t-2 border-gray-700 px-4 py-2 safe-area-pb z-50">
      <div className="flex items-center justify-center max-w-md mx-auto">
        <Link to={createPageUrl('History')} className="flex-1 flex justify-center">
          <Button variant="ghost" className="flex flex-col items-center gap-0.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 h-auto py-1 px-3 rounded-lg">
            <svg className="w-11 h-11" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-bold">Historial</span>
          </Button>
        </Link>

        <div className="flex justify-center px-4">
          <Link to={createPageUrl('Home')}>
            <Button 
              className="w-24 h-24 rounded-full bg-purple-600 hover:bg-purple-500 shadow-xl -mt-12 mb-0 flex flex-col items-center justify-center p-0 border-4 border-purple-400"
              style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.6), 0 0 60px rgba(168, 85, 247, 0.3)' }}
            >
              <span className="text-4xl">🌍</span>
              <span className="text-[10px] font-bold text-white -mt-1">MAPA</span>
            </Button>
          </Link>
        </div>

        <Link to={createPageUrl('Profile')} className="flex-1 flex justify-center">
          <Button variant="ghost" className="flex flex-col items-center gap-0.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 h-auto py-1 px-3 rounded-lg">
            {user?.photo_url ? (
              <img src={user.photo_url} className="w-8 h-8 rounded-lg object-cover border border-purple-500" alt="" />
            ) : (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
            <span className="text-[10px] font-medium">Perfil</span>
          </Button>
        </Link>
      </div>
    </nav>
  );
}