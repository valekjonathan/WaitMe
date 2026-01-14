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

  // Filtrar conversaciones por búsqueda y ordenar sin leer primero
  const filteredConversations = React.useMemo(() => {
    let filtered = conversations;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = conversations.filter((conv) => {
        const otherUserName = conv.participant1_id === user?.id ?
        conv.participant2_name :
        conv.participant1_name;
        const lastMessage = conv.last_message_text || '';

        return otherUserName?.toLowerCase().includes(query) ||
        lastMessage.toLowerCase().includes(query);
      });
    }

    // Ordenar sin leer primero
    return filtered.sort((a, b) => {
      const aUnread = (a.participant1_id === user?.id ? a.unread_count_p1 : a.unread_count_p2) || 0;
      const bUnread = (b.participant1_id === user?.id ? b.unread_count_p1 : b.unread_count_p2) || 0;
      return bUnread - aUnread;
    });
  }, [conversations, searchQuery, user?.id]);

  // Función para calcular minutos desde el último mensaje
  const getMinutesSince = (timestamp) => {
    if (!timestamp) return 1;
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    return Math.max(1, minutes);
  };



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
        {/* Buscador justo debajo del header */}
        <div className="px-4 pt-2 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar conversaciones..."
              className="pl-10 pr-10 bg-gray-900 border-gray-800 text-white" />

            {searchQuery &&
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7">

                <X className="w-4 h-4" />
              </Button>
            }
          </div>
        </div>

        {isLoading ?
        <div className="text-center py-12 text-gray-500">
            Cargando conversaciones...
          </div> :
        filteredConversations.length === 0 ?
        <div className="text-center py-20 text-gray-500">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">
              {searchQuery ? 'No se encontraron conversaciones' : 'Sin conversaciones'}
            </p>
            <p className="text-sm">
              {searchQuery ? 'Intenta con otra búsqueda' : 'Cuando reserves o alguien reserve tu plaza, podrás chatear aquí'}
            </p>
          </div> :

        <div className="px-4 space-y-3">
            {filteredConversations.filter(conv => alertsMap.has(conv.alert_id)).map((conv, index) => {
            const isP1 = conv.participant1_id === user?.id;
            const otherUserId = isP1 ? conv.participant2_id : conv.participant1_id;
            const unreadCount = isP1 ? conv.unread_count_p1 : conv.unread_count_p2;
            const alert = alertsMap.get(conv.alert_id);

            // Borde encendido SOLO si tiene mensajes no leídos
            const hasUnread = unreadCount > 0;

            // Resolver datos del otro usuario desde usersMap
            const otherUserData = usersMap.get(otherUserId);
            const otherUserName = otherUserData?.display_name || (isP1 ? conv.participant2_name : conv.participant1_name);
            const otherUserPhoto = otherUserData?.photo_url || (isP1 ? conv.participant2_photo : conv.participant1_photo);
            const otherUserPhone = otherUserData?.phone || (isP1 ? conv.participant2_phone : conv.participant1_phone);
            const allowCalls = otherUserData?.allow_phone_calls ?? false;

            // Construir objeto otherUser
            const otherUser = {
              name: otherUserName,
              photo: otherUserPhoto,
              phone: otherUserPhone,
              allowCalls: allowCalls,
              initial: otherUserName ? otherUserName[0].toUpperCase() : '?'
            };

            // Calcular distancia (metros o km)
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

            return (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}>

                <div className={`bg-gray-900 rounded-2xl p-4 transition-all
                  ${hasUnread ?
                'border-2 border-purple-500 shadow-lg shadow-purple-500/20' :
                'border-2 border-gray-800'}
                `
                }>

                    <div className="flex items-start gap-3 flex-col w-full">
                      {/* Header: "Info del usuario:" + distancia + precio */}
                      <div className="flex items-center justify-between gap-2 w-full">
                        <p className="text-[13px] text-purple-400 font-medium">Info del usuario:</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {distanceText &&
                        <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                              <span className="text-purple-400 font-bold text-xs whitespace-nowrap">{distanceText}</span>
                            </div>
                        }
                          {alert &&
                        <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                              <span className="text-purple-400 font-bold text-xs whitespace-nowrap">{Math.round(alert.price)}€</span>
                            </div>
                        }
                        </div>
                      </div>

                      {/* Foto + Info derecha */}
                      <div className="flex gap-3 w-full">
                        {/* Foto + botones + info debajo */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Link to={createPageUrl(`Chat?conversationId=${conv.id}`)}>
                            <div className="w-[92px] h-20 rounded-lg overflow-hidden border-2 border-purple-500 bg-gray-800 flex items-center justify-center">
                              {otherUser.photo ?
                            <img src={otherUser.photo} className="w-full h-full object-cover" alt={otherUser.name} /> :
                            <span className="text-3xl font-bold text-purple-400">{otherUser.initial}</span>
                            }
                            </div>
                          </Link>

                          {/* Dirección debajo de foto - ocupa toda la línea */}
                          {alert?.address &&
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs w-full">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate flex-1">{alert.address}</span>
                            </div>
                        }

                          {/* Tiempo restante - ocupa toda la línea */}
                          {alert?.available_in_minutes !== undefined &&
                        <div className="flex items-center gap-1 text-gray-500 text-[10px]">
              <Clock className="w-3.5 h-3.5" />
              <span>Se va en {alert.available_in_minutes} min</span>
              <span className="text-purple-400">
                • Te espera hasta las {format(new Date(new Date().getTime() + alert.available_in_minutes * 60000), 'HH:mm', { locale: es })}
              </span>
            </div>
                        }

                          {/* Botones debajo */}
                          <div className="flex gap-2 items-center">
                            {/* Chat Button */}
                            <div>
                              <Link to={createPageUrl(`Chat?conversationId=${conv.id}`)}>
                                <Button
                                size="icon"
                                className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-8 w-[42px]">
                                  <MessageCircle className="w-4 h-4" />
                                </Button>
                              </Link>
                            </div>

                            {/* Phone Button */}
                            <div>
                              <Button
                              variant="outline"
                              size="icon"
                              className={`border-gray-700 h-8 w-[42px] ${alert.allow_phone_calls ? 'hover:bg-gray-800' : 'opacity-40 cursor-not-allowed'}`}
                              onClick={() => alert.allow_phone_calls && alert?.phone && (window.location.href = `tel:${alert.phone}`)}
                              disabled={!alert.allow_phone_calls}>
                                {alert.allow_phone_calls ?
                              <Phone className="w-4 h-4 text-green-400" /> :
                              <Phone className="w-4 h-4 text-gray-600" />
                              }
                              </Button>
                            </div>

                            {/* Countdown Timer */}
                            <div className="flex-1">
                              <CountdownTimer availableInMinutes={alert.available_in_minutes} />
                            </div>
                          </div>
                        </div>

                        {/* Info derecha */}
                        <div className="flex-1 flex flex-col gap-1 min-w-0 -ml-[140px] -mt-1">
                          {/* Nombre */}
                          <p className="font-bold text-xl text-white mb-1.5">
                            {otherUserName}
                          </p>

                          {/* Marca y modelo */}
                          {alert &&
                          <div className="flex items-center justify-between -mt-2.5 mb-1.5">
                             <p className="text-sm text-gray-400">
                               {alert.car_brand} {alert.car_model}
                             </p>
                             <Car className="w-4 h-4 text-gray-400 flex-shrink-0" />
                           </div>
                          }

                          {/* Matrícula */}
                          {alert &&
                          <div className="-mt-[7px] bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-8">
                              <div className="bg-blue-600 h-full w-5 flex items-center justify-center flex-shrink-0">
                                <span className="text-[8px] font-bold text-white">E</span>
                              </div>
                              <span className="flex-1 text-center font-mono font-bold text-xs tracking-wider text-black">
                                {alert.car_plate ? alert.car_plate.replace(/\s/g, '').toUpperCase().slice(0, 4) + ' ' + alert.car_plate.replace(/\s/g, '').toUpperCase().slice(4) : 'XXXX XXX'}
                              </span>
                            </div>
                          }
                          </div>
                          </div>



                      {/* Último mensaje */}
                      <div className="flex-1 min-w-0 w-full">
                        <p className="text-xs text-purple-400 font-medium mb-1">Ultimos mensajes:</p>
                        <Link to={createPageUrl(`Chat?conversationId=${conv.id}`)}>
                          <p className={`text-sm truncate ${hasUnread ? 'text-gray-300' : 'text-gray-500'}`}>
                            {conv.last_message_text || 'Sin mensajes'}
                          </p>
                        </Link>
                      </div>
                    </div>
                </div>
              </motion.div>);

          })}
                      </div>
        }
                      </main>

      <BottomNav />
    </div>);

}