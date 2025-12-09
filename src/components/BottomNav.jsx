import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
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

  // Obtener alertas activas del usuario
  const { data: activeAlerts = [] } = useQuery({
    queryKey: ['userActiveAlerts', user?.email],
    queryFn: async () => {
      const alerts = await base44.entities.ParkingAlert.filter({ 
        user_email: user?.email, 
        status: 'active' 
      });
      return alerts;
    },
    enabled: !!user?.email,
    refetchInterval: 5000
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t-2 border-gray-700 px-4 py-3 safe-area-pb z-50">
      <div className="flex items-center justify-around max-w-md mx-auto gap-2">
        <Link to={createPageUrl('History')} className="flex-1 flex justify-center">
          <Button variant="ghost" className="relative flex flex-col items-center gap-1 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 h-auto py-2 px-3 rounded-lg">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <path d="M20 8 L10 8 L10 6 L6 9 L10 12 L10 10 L20 10 Z" fill="currentColor"/>
              <path d="M4 16 L14 16 L14 18 L18 15 L14 12 L14 14 L4 14 Z" fill="currentColor"/>
            </svg>
            <span className="text-[10px] font-bold">Actividad</span>
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1 right-1 bg-green-500/20 border-2 border-green-500 text-green-400 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {activeAlerts.length > 9 ? '9+' : activeAlerts.length}
              </span>
            )}
          </Button>
        </Link>

        <div className="w-px h-10 bg-gray-700"></div>

        <Link to={createPageUrl('Home')} className="flex-1 flex justify-center">
          <Button variant="ghost" className="flex flex-col items-center gap-1 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 h-auto py-2 px-3 rounded-lg">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="text-[10px] font-bold">Mapa</span>
          </Button>
        </Link>

        <div className="w-px h-10 bg-gray-700"></div>

        <Link to={createPageUrl('Profile')} className="flex-1 flex justify-center">
          <Button variant="ghost" className="flex flex-col items-center gap-1 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 h-auto py-2 px-3 rounded-lg">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-bold">Perfil</span>
          </Button>
        </Link>
      </div>
    </nav>
  );
}