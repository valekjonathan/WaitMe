import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { MessageCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export default function Chats() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
      } catch (e) {}
    })();
  }, []);

  const demoThreads = useMemo(() => {
    const avatar = (n) => `https://i.pravatar.cc/150?img=${n}`;
    return [
      {
        id: 'demo_chat_1',
        is_demo: true,
        name: 'Laura',
        photo: avatar(47),
        lastMessage: 'Estoy a 12 min. ¿Te vale 4€?',
        unread: 2
      },
      {
        id: 'demo_chat_2',
        is_demo: true,
        name: 'Carlos',
        photo: avatar(12),
        lastMessage: 'Ok, espero. Voy llegando.',
        unread: 0
      },
      {
        id: 'demo_chat_3',
        is_demo: true,
        name: 'Marta',
        photo: avatar(32),
        lastMessage: 'Perfecto, gracias. En 2 min estoy allí.',
        unread: 1
      }
    ];
  }, []);

  const { data: realThreads = [], isLoading } = useQuery({
    queryKey: ['chatThreads', user?.email],
    enabled: !!user?.email,
    refetchInterval: 7000,
    queryFn: async () => {
      try {
        // Si tu BD tiene otra entidad, esto no rompe: devuelve []
        if (!base44?.entities?.ChatThread) return [];
        const threads = await base44.entities.ChatThread.filter({ user_email: user?.email }, '-updated_date');
        return Array.isArray(threads) ? threads : [];
      } catch (e) {
        return [];
      }
    }
  });

  const threads = useMemo(() => {
    const hasReal = Array.isArray(realThreads) && realThreads.length > 0;
    if (hasReal) return realThreads;
    return demoThreads;
  }, [realThreads, demoThreads]);

  const goChat = (t) => {
    // Demo: abre Chat con parámetros demo
    if (String(t.id).startsWith('demo_')) {
      window.location.href = createPageUrl(`Chat?demo=${t.id}&name=${encodeURIComponent(t.name)}&photo=${encodeURIComponent(t.photo)}`);
      return;
    }
    // Real: ajusta si tú ya tienes otro esquema
    window.location.href = createPageUrl(`Chat?threadId=${t.id}`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Chats" showBackButton={true} backTo="Home" />

      <main className="pt-16 pb-24 px-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full bg-gray-900 border border-gray-700 text-white pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Buscar chat..."
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : threads.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">Sin chats</p>
          </div>
        ) : (
          <div className="space-y-3">
            {threads.map((t) => {
              const name = t.name || t.other_user_name || 'Usuario';
              const photo = t.photo || t.other_user_photo;
              const last = t.lastMessage || t.last_message || '...';
              const unread = Number(t.unread || t.unread_count || 0);

              return (
                <button
                  key={t.id}
                  onClick={() => goChat(t)}
                  className="w-full text-left bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-purple-500 transition"
                >
                  <div className="flex items-center gap-3">
                    {photo ? (
                      <img src={photo} alt="" className="w-14 h-14 rounded-xl object-cover border-2 border-purple-500" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gray-800 border-2 border-purple-500 flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-gray-500" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-white text-lg truncate">{name}</p>
                        {unread > 0 && (
                          <span className="bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 truncate">{last}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}