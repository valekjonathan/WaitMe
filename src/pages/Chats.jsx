import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, Settings, Search, X, Archive, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BottomNav from '@/components/BottomNav';
import ConversationItem from '@/components/chat/ConversationItem';



export default function Chats() {
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();

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

    // Obtener ubicación del usuario
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.log('Error obteniendo ubicación:', error)
      );
    }
  }, []);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      // Obtener TODAS las conversaciones ordenadas por más reciente
      const allConversations = await base44.entities.Conversation.list();
      
      // Datos mock para demostración
      const mockConversations = [
        {
          id: 'mock1',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'user2',
          participant2_name: 'Laura',
          participant2_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
          alert_id: 'alert1',
          last_message_text: 'Genial, aguanto.',
          last_message_at: new Date(Date.now() - 2 * 60000).toISOString(),
          unread_count_p1: 0,
          unread_count_p2: 0
        },
        {
          id: 'mock2',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'user3',
          participant2_name: 'Marta',
          participant2_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
          alert_id: 'alert2',
          last_message_text: 'Vale, llego en 10 minutos',
          last_message_at: new Date(Date.now() - 5 * 60000).toISOString(),
          unread_count_p1: 1,
          unread_count_p2: 0
        },
        {
          id: 'mock3',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'user4',
          participant2_name: 'Carlos',
          participant2_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
          alert_id: 'alert3',
          last_message_text: 'Perfecto, ya estoy ahí',
          last_message_at: new Date(Date.now() - 15 * 60000).toISOString(),
          unread_count_p1: 0,
          unread_count_p2: 0
        }
      ];

      const combined = [...mockConversations, ...allConversations];
      return combined.sort((a, b) =>
      new Date(b.last_message_at || b.updated_date || b.created_date) -
      new Date(a.last_message_at || a.updated_date || a.created_date)
      );
    },
    refetchInterval: 5000
  });

  // Obtener usuarios para resolver datos completos
  const { data: users = [] } = useQuery({
    queryKey: ['usersForChats'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user?.id
  });

  const usersMap = React.useMemo(() => {
    const map = new Map();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  // Obtener alertas para mostrar info
  const { data: alerts = [] } = useQuery({
    queryKey: ['alertsForChats'],
    queryFn: async () => {
      const realAlerts = await base44.entities.ParkingAlert.list();
      
      // Datos mock de alertas
      const mockAlerts = [
        {
          id: 'alert1',
          user_name: 'Laura',
          user_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
          car_brand: 'Opel',
          car_model: 'Corsa',
          car_plate: '9812 GHJ',
          price: 4,
          available_in_minutes: 28,
          address: 'Paseo de la Castellana, 42',
          latitude: 40.464667,
          longitude: -3.632623,
          allow_phone_calls: true,
          phone: '+34612345678'
        },
        {
          id: 'alert2',
          user_name: 'Marta',
          user_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
          car_brand: 'Seat',
          car_model: 'Ibiza',
          car_plate: '1234 ABC',
          price: 3,
          available_in_minutes: 15,
          address: 'Calle Mayor, 18',
          latitude: 40.416775,
          longitude: -3.703790,
          allow_phone_calls: false,
          phone: null
        },
        {
          id: 'alert3',
          user_name: 'Carlos',
          user_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
          car_brand: 'Toyota',
          car_model: 'Yaris',
          car_plate: '5678 DEF',
          price: 5,
          available_in_minutes: 45,
          address: 'Avenida del Paseo, 25',
          latitude: 40.456775,
          longitude: -3.688790,
          allow_phone_calls: true,
          phone: '+34698765432'
        }
      ];
      
      return [...mockAlerts, ...realAlerts];
    },
    enabled: !!user?.id
  });

  const alertsMap = React.useMemo(() => {
    const map = new Map();
    alerts.forEach((alert) => map.set(alert.id, alert));
    return map;
  }, [alerts]);

  // Calcular total de no leídos
  const totalUnread = React.useMemo(() => {
    return conversations.reduce((sum, conv) => {
      const isP1 = conv.participant1_id === user?.id;
      const unread = isP1 ? conv.unread_count_p1 : conv.unread_count_p2;
      return sum + (unread || 0);
    }, 0);
  }, [conversations, user?.id]);

  // Filtrar conversaciones por búsqueda, pestañas y ordenar
  const filteredConversations = React.useMemo(() => {
    if (!user?.id) return [];
    
    const isP1 = (conv) => conv.participant1_id === user?.id;
    let filtered = conversations;

    // Filtrar por pestaña
    if (activeTab === 'important') {
      filtered = filtered.filter(conv => isP1(conv) ? conv.important_for_p1 : conv.important_for_p2);
    } else if (activeTab === 'archived') {
      filtered = filtered.filter(conv => isP1(conv) ? conv.archived_by_p1 : conv.archived_by_p2);
    } else {
      // "all" - excluir archivadas
      filtered = filtered.filter(conv => !(isP1(conv) ? conv.archived_by_p1 : conv.archived_by_p2));
    }

    // Búsqueda por nombre o mensaje
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((conv) => {
        const otherUserName = isP1(conv) ? conv.participant2_name : conv.participant1_name;
        const lastMessage = conv.last_message_text || '';
        return otherUserName?.toLowerCase().includes(query) || lastMessage.toLowerCase().includes(query);
      });
    }

    // Ordenar: importantes primero, luego sin leer, luego por fecha
    return filtered.sort((a, b) => {
      const aImportant = isP1(a) ? a.important_for_p1 : a.important_for_p2;
      const bImportant = isP1(b) ? b.important_for_p1 : b.important_for_p2;
      if (aImportant !== bImportant) return bImportant ? 1 : -1;

      const aUnread = (isP1(a) ? a.unread_count_p1 : a.unread_count_p2) || 0;
      const bUnread = (isP1(b) ? b.unread_count_p1 : b.unread_count_p2) || 0;
      if (aUnread !== bUnread) return bUnread - aUnread;

      return new Date(b.last_message_at || b.updated_date || b.created_date) - 
             new Date(a.last_message_at || a.updated_date || a.created_date);
    });
  }, [conversations, searchQuery, user?.id, activeTab]);

  // Mutations para actualizar conversaciones
  const toggleImportantMutation = useMutation({
    mutationFn: async ({ convId, isImportant }) => {
      const isP1 = conversations.find(c => c.id === convId)?.participant1_id === user?.id;
      const field = isP1 ? 'important_for_p1' : 'important_for_p2';
      await base44.entities.Conversation.update(convId, { [field]: !isImportant });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] })
  });

  const toggleArchiveMutation = useMutation({
    mutationFn: async (convId) => {
      const conv = conversations.find(c => c.id === convId);
      const isP1 = conv?.participant1_id === user?.id;
      const field = isP1 ? 'archived_by_p1' : 'archived_by_p2';
      await base44.entities.Conversation.update(convId, { [field]: true });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] })
  });

  // Contador de conversaciones por pestaña
  const conversationCounts = React.useMemo(() => {
    if (!user?.id) return { all: 0, important: 0, archived: 0 };
    const isP1 = (conv) => conv.participant1_id === user?.id;
    
    return {
      all: conversations.filter(conv => !(isP1(conv) ? conv.archived_by_p1 : conv.archived_by_p2)).length,
      important: conversations.filter(conv => isP1(conv) ? conv.important_for_p1 : conv.important_for_p2).length,
      archived: conversations.filter(conv => isP1(conv) ? conv.archived_by_p1 : conv.archived_by_p2).length
    };
  }, [conversations, user?.id]);



  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="text-white">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-1 flex items-center gap-1">
              <span className="text-purple-400 font-bold text-sm">{(user?.credits || 0).toFixed(2)}€</span>
            </div>
            <Link to={createPageUrl('Home')}>
              <h1 className="text-lg font-semibold cursor-pointer hover:opacity-80 transition-opacity">
                <span className="text-white">Wait</span><span className="text-purple-500">Me!</span>
              </h1>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <Link to={createPageUrl('Settings')}>
              <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Link to={createPageUrl('Chats')} className="relative">
              <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20">
                <MessageCircle className="w-5 h-5" />
              </Button>
              {totalUnread > 0 &&
              <span className="absolute -top-1 -right-1 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              }
            </Link>
          </div>
        </div>


      </header>

      <main className="pt-[60px] pb-24">
        {/* Buscador */}
        <div className="px-4 pt-2 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o mensaje..."
              className="pl-10 pr-10 bg-gray-900 border-gray-800 text-white"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Pestañas de filtrado */}
        <div className="px-4 pb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-900">
              <TabsTrigger value="all" className="data-[state=active]:bg-purple-600">
                Todas {conversationCounts.all > 0 && `(${conversationCounts.all})`}
              </TabsTrigger>
              <TabsTrigger value="important" className="data-[state=active]:bg-purple-600">
                <Star className="w-4 h-4 mr-1" />
                {conversationCounts.important > 0 && conversationCounts.important}
              </TabsTrigger>
              <TabsTrigger value="archived" className="data-[state=active]:bg-purple-600">
                <Archive className="w-4 h-4 mr-1" />
                {conversationCounts.archived > 0 && conversationCounts.archived}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">
            Cargando conversaciones...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">
              {searchQuery ? 'No se encontraron conversaciones' : 
               activeTab === 'important' ? 'Sin conversaciones importantes' :
               activeTab === 'archived' ? 'Sin conversaciones archivadas' :
               'Sin conversaciones'}
            </p>
            <p className="text-sm">
              {searchQuery ? 'Intenta con otra búsqueda' : 
               activeTab === 'important' ? 'Marca conversaciones como importantes desde el menú' :
               activeTab === 'archived' ? 'Las conversaciones archivadas aparecerán aquí' :
               'Cuando reserves o alguien reserve tu plaza, podrás chatear aquí'}
            </p>
          </div>
        ) : (
          <div className="px-4 space-y-3">
            {filteredConversations.filter(conv => alertsMap.has(conv.alert_id)).map((conv, index) => {
              const isP1 = conv.participant1_id === user?.id;
              const otherUserId = isP1 ? conv.participant2_id : conv.participant1_id;
              const unreadCount = isP1 ? conv.unread_count_p1 : conv.unread_count_p2;
              const alert = alertsMap.get(conv.alert_id);

              const otherUserData = usersMap.get(otherUserId);
              const otherUserName = otherUserData?.display_name || (isP1 ? conv.participant2_name : conv.participant1_name);
              const otherUserPhoto = otherUserData?.photo_url || (isP1 ? conv.participant2_photo : conv.participant1_photo);

              const otherUser = {
                name: otherUserName,
                photo: otherUserPhoto,
                initial: otherUserName ? otherUserName[0].toUpperCase() : '?'
              };

              const calculateDistance = () => {
                if (!alert?.latitude || !alert?.longitude || !userLocation) return null;
                const R = 6371;
                const dLat = (alert.latitude - userLocation[0]) * Math.PI / 180;
                const dLon = (alert.longitude - userLocation[1]) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(userLocation[0] * Math.PI / 180) * Math.cos(alert.latitude * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distanceKm = R * c;
                const meters = Math.round(distanceKm * 1000);
                return meters > 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`;
              };
              const distanceText = calculateDistance();

              const isImportant = isP1 ? conv.important_for_p1 : conv.important_for_p2;

              return (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  user={user}
                  alert={alert}
                  otherUser={otherUser}
                  unreadCount={unreadCount}
                  distanceText={distanceText}
                  index={index}
                  onToggleImportant={() => toggleImportantMutation.mutate({ convId: conv.id, isImportant })}
                  onToggleArchive={() => toggleArchiveMutation.mutate(conv.id)}
                />
              );
            })}
          </div>
        )}
                      </main>

      <BottomNav />
    </div>);

}