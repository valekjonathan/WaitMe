import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, User, Settings, Search, X, Phone, PhoneOff, Navigation, MapPin, Clock, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import MarcoCard from '@/components/cards/MarcoCard';

// Componente contador de cuenta atrás
function CountdownTimer({ availableInMinutes }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const totalSeconds = availableInMinutes * 60;
      const now = Math.floor(Date.now() / 1000);
      const startTime = Math.floor((Date.now() - (availableInMinutes * 60000)) / 1000);
      const elapsed = now - startTime;
      const remaining = Math.max(0, totalSeconds - elapsed);

      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [availableInMinutes]);

  return (
    <div className="w-full h-8 rounded-lg border-2 border-gray-700 bg-gray-800 flex items-center justify-center px-3">
      <span className="text-purple-400 text-sm font-mono font-bold">{timeLeft}</span>
    </div>);

}

export default function Chats() {
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      const allConversations = await base44.entities.Conversation.list('-last_message_at', 50);
      
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
        },
        {
            id: 'mock4',
            participant1_id: user?.id || 'user1',
            participant1_name: 'Tu',
            participant1_photo: user?.photo_url,
            participant2_id: 'user5',
            participant2_name: 'Sofía',
            participant2_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
            alert_id: 'alert4',
            last_message_text: 'Ya voy llegando, 2 minutos',
            last_message_at: new Date(Date.now() - 1 * 60000).toISOString(),
            unread_count_p1: 2,
            unread_count_p2: 0
          },
          {
            id: 'mock5',
            participant1_id: user?.id || 'user1',
            participant1_name: 'Tu',
            participant1_photo: user?.photo_url,
            participant2_id: 'user6',
            participant2_name: 'Marco',
            participant2_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80&w=400',
            alert_id: 'alert5',
            last_message_text: '¿A qué hora te liberas?',
            last_message_at: new Date(Date.now() - 3 * 60000).toISOString(),
            unread_count_p1: 0,
            unread_count_p2: 1,
            status: 'reserved'
          }
        ];

      const combined = [...mockConversations, ...allConversations];
      return combined.sort((a, b) =>
      new Date(b.last_message_at || b.updated_date || b.created_date) -
      new Date(a.last_message_at || a.updated_date || a.created_date)
      );
    },
    staleTime: 10000,
    refetchInterval: false
  });

  // Obtener usuarios para resolver datos completos
  const { data: users = [] } = useQuery({
    queryKey: ['usersForChats'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user?.id,
    staleTime: 60000,
    refetchInterval: false
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
      const realAlerts = await base44.entities.ParkingAlert.list('-created_date', 100);
      
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
        },
        {
          id: 'alert4',
          user_name: 'Sofía',
          user_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
          car_brand: 'Renault',
          car_model: 'Clio',
          car_plate: '7733 MNP',
          price: 6,
          available_in_minutes: 8,
          address: 'Calle Uría, 33',
          latitude: 43.362776,
          longitude: -5.845890,
          allow_phone_calls: true,
          phone: '+34677889900'
        },
        {
          id: 'alert5',
          user_name: 'Marco',
          user_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80&w=400',
          car_brand: 'BMW',
          car_model: 'Serie 3',
          car_plate: '5521 LKP',
          price: 5.5,
          available_in_minutes: 12,
          address: 'Calle Campoamor, 15',
          latitude: 43.357815,
          longitude: -5.849790,
          allow_phone_calls: true,
          phone: '+34666554433',
          reserved_by_id: user?.id || 'buyer1',
          reserved_by_name: 'Tu',
          reserved_by_email: user?.email,
          status: 'reserved'
        }
        ];
      
      return [...mockAlerts, ...realAlerts];
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: false
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
      <Header title="Chats" showBackButton={true} backTo="Home" unreadCount={totalUnread} />

      <main className="pt-[60px] pb-24">
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-white pl-10 pr-10 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

         <div className="px-4 space-y-3 pt-1">
             {filteredConversations.map((conv, index) => {
             const alert = alertsMap.get(conv.alert_id);
             if (!alert) return null;
             const isP1 = conv.participant1_id === user?.id;
             const otherUserId = isP1 ? conv.participant2_id : conv.participant1_id;
             const unreadCount = isP1 ? conv.unread_count_p1 : conv.unread_count_p2;

            // Borde encendido SOLO si tiene mensajes no leídos
            const hasUnread = unreadCount > 0;

            // Formatear fecha creación/último mensaje
             const formatCardDate = (ts) => {
               if (!ts) return '--';
               const date = new Date(ts);
               const day = date.toLocaleString('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit' });
               const month = date.toLocaleString('es-ES', { timeZone: 'Europe/Madrid', month: 'short' }).replace('.', '');
               const time = date.toLocaleString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false });
               return `${day} ${month} - ${time}`;
             };

            const cardDate = formatCardDate(conv.last_message_at || conv.created_date);

            // Resolver datos del otro usuario desde usersMap
            const otherUserData = usersMap.get(otherUserId);
            const otherUserName = otherUserData?.display_name || (isP1 ? conv.participant2_name : conv.participant1_name);
            let otherUserPhoto = otherUserData?.photo_url || (isP1 ? conv.participant2_photo : conv.participant1_photo);

            // Generar foto con IA si no existe
            if (!otherUserPhoto) {
              const photoUrls = [
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
                'https://randomuser.me/api/portraits/women/68.jpg',
                'https://randomuser.me/api/portraits/men/32.jpg',
                'https://randomuser.me/api/portraits/women/44.jpg',
                'https://randomuser.me/api/portraits/men/75.jpg'
              ];
              otherUserPhoto = photoUrls[(conv.id || '').charCodeAt(0) % photoUrls.length];
            }

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
              return `${Math.min(meters, 999)}m`;
            };
            const distanceText = calculateDistance();

            return (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}>

                <div className={`bg-gradient-to-br ${hasUnread ? 'from-gray-800 to-gray-900' : 'from-gray-900/50 to-gray-900/50'} rounded-xl p-2.5 transition-all border-2 ${hasUnread ? 'border-purple-500/50' : 'border-gray-700/80'}`}>

                    <div className="flex flex-col h-full">
                      {/* Header: "Info del usuario:" + fecha + distancia + precio */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-shrink-0">
                          <Badge className={`${hasUnread ? 'bg-purple-500/20 text-purple-300 border-purple-400/50' : 'bg-red-500/20 text-red-400 border-red-500/30'} border font-bold text-xs h-7 w-[95px] flex items-center justify-center text-center cursor-default select-none pointer-events-none`}>
                            {alert?.reserved_by_id === user?.id ? 'Reservaste a:' : alert?.reserved_by_id ? 'Te reservó' : 'Info usuario'}
                          </Badge>
                        </div>
                        <div className={`flex-1 text-center text-xs ${hasUnread ? 'text-white' : 'text-gray-600'} truncate`}>
                          {cardDate}
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-1">
                          {distanceText && (
                            <div className={`backdrop-blur-sm border rounded-full px-2 py-0.5 flex items-center gap-1 h-7 ${hasUnread ? 'bg-black/40 border-purple-500/30' : 'bg-black/20 border-gray-600/30'}`}>
                              <Navigation className={`w-3 h-3 ${hasUnread ? 'text-purple-400' : 'text-gray-500'}`} />
                              <span className={`font-bold text-xs ${hasUnread ? 'text-white' : 'text-gray-400'}`}>{distanceText}</span>
                            </div>
                          )}
                          <div className={`border rounded-lg px-3 py-0.5 flex items-center gap-1 h-7 ${hasUnread ? 'bg-purple-600/20 border-purple-500/30' : 'bg-gray-600/10 border-gray-600/30 opacity-40'}`}>
                            <span className={`font-bold text-xs ${hasUnread ? 'text-purple-300' : 'text-gray-400'}`}>{Math.floor(alert.price)}€</span>
                          </div>
                        </div>
                      </div>

                      {/* Tarjeta de usuario con MarcoCard */}
                      <div className="border-t border-gray-700/80 mb-1.5 pt-2">
                       <MarcoCard
                         photoUrl={otherUser.photo}
                         name={otherUserName}
                         carLabel={`${alert.car_brand || ''} ${alert.car_model || ''}`.trim()}
                         plate={alert.car_plate}
                         carColor={alert.car_color || 'gris'}
                         address={alert.address}
                         timeLine={<><span className={hasUnread ? "text-white" : "text-gray-400"}>Se va en {alert.available_in_minutes} min ·</span> Te espera hasta las {new Date(Date.now() + alert.available_in_minutes * 60000).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false })}</>}
                         onChat={() => window.location.href = createPageUrl(`Chat?conversationId=${conv.id}`)}
                         statusText={new Date(Date.now() + alert.available_in_minutes * 60000).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false })}
                         phoneEnabled={alert.allow_phone_calls}
                         onCall={() => alert.allow_phone_calls && alert?.phone && (window.location.href = `tel:${alert.phone}`)}
                         dimmed={!hasUnread}
                       />
                      </div>

                      {/* Ultimos mensajes */}
                      <div className="border-t border-gray-700/80 mt-2 pt-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.location.href = createPageUrl(`Chat?conversationId=${conv.id}`)}>
                        <div className="flex justify-between items-center">
                          <p className={`text-xs font-bold ${hasUnread ? 'text-purple-400' : 'text-gray-500'}`}>Ultimos mensajes:</p>
                          {unreadCount > 0 && (
                            <div className="w-6 h-6 bg-red-500/20 border-2 border-red-500/30 rounded-full flex items-center justify-center relative top-[8px]">
                              <span className="text-red-400 text-xs font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                            </div>
                          )}
                        </div>
                        <p className={`text-xs ${hasUnread ? 'text-gray-300' : 'text-gray-500'} mt-1`}>{conv.last_message_text || 'Sin mensajes'}</p>
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