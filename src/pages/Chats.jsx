import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, User, Settings, Search, X, Phone, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import BottomNav from '@/components/BottomNav';

// Componente contador de cuenta atrás
function CountdownTimer({ availableInMinutes, createdDate }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const created = new Date(createdDate);
      const targetTime = new Date(created.getTime() + availableInMinutes * 60000);
      const now = new Date();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft('0:00');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor(diff % 60000 / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [availableInMinutes, createdDate]);

  return (
    <div className="h-7 rounded-lg border-2 border-gray-700 bg-gray-800 flex items-center justify-center px-2">
      <span className="text-purple-400 text-xs font-mono font-bold">{timeLeft}</span>
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
      const allConversations = await base44.entities.Conversation.list();
      return allConversations.sort((a, b) =>
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
    queryFn: () => base44.entities.ParkingAlert.list(),
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

  // Filtrar conversaciones por búsqueda
  const filteredConversations = React.useMemo(() => {
    if (!searchQuery) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      const otherUserName = conv.participant1_id === user?.id ?
      conv.participant2_name :
      conv.participant1_name;
      const lastMessage = conv.last_message_text || '';

      return otherUserName?.toLowerCase().includes(query) ||
      lastMessage.toLowerCase().includes(query);
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
            {filteredConversations.map((conv, index) => {
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

                  <div
                  className={`
                      bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 transition-all
                      ${hasUnread ?
                  'border-2 border-purple-500 shadow-lg shadow-purple-500/20' :
                  'border-2 border-gray-800'}
                    `
                  }>

                    <div className="flex gap-3 px-2">
                      {/* Foto a la izquierda */}
                      <Link to={createPageUrl(`Chat?conversationId=${conv.id}`)}>
                        <div className="w-24 h-28 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0 border-2 border-purple-500">
                          {otherUser.photo ? (
                            <img src={otherUser.photo} className="w-full h-full object-cover" alt={otherUser.name} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl text-gray-500">
                              <span className="text-3xl font-bold text-purple-400">{otherUser.initial}</span>
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Info a la derecha */}
                      <div className="flex-1 flex flex-col justify-between pr-2">
                        {/* Nombre */}
                        <p className={`font-bold text-lg ${hasUnread ? 'text-white' : 'text-gray-400'}`}>{otherUserName}</p>
                        
                        {/* Marca y Modelo con icono */}
                        {alert && (
                          <div className="flex items-center justify-between">
                            <p className={`text-xs font-medium ${hasUnread ? 'text-white' : 'text-gray-400'}`}>
                              {alert.car_brand} {alert.car_model}
                            </p>
                            {(() => {
                              const carColors = {
                                'blanco': '#FFFFFF',
                                'negro': '#1a1a1a',
                                'rojo': '#ef4444',
                                'azul': '#3b82f6',
                                'amarillo': '#facc15',
                                'gris': '#6b7280'
                              };
                              const color = carColors[alert.car_color] || '#6b7280';
                              
                              if (alert.vehicle_type === 'van') {
                                return (
                                  <svg viewBox="0 0 48 30" className="w-8 h-5" fill="none">
                                    <path d="M6 12 L6 24 L42 24 L42 14 L38 12 Z" fill={color} stroke="white" strokeWidth="1.5" />
                                    <circle cx="14" cy="24" r="3" fill="#333" stroke="white" strokeWidth="1" />
                                    <circle cx="34" cy="24" r="3" fill="#333" stroke="white" strokeWidth="1" />
                                  </svg>
                                );
                              } else if (alert.vehicle_type === 'suv') {
                                return (
                                  <svg viewBox="0 0 48 30" className="w-8 h-5" fill="none">
                                    <path d="M8 18 L10 10 L16 8 L32 8 L38 10 L42 16 L42 24 L8 24 Z" fill={color} stroke="white" strokeWidth="1.5" />
                                    <circle cx="14" cy="24" r="4" fill="#333" stroke="white" strokeWidth="1" />
                                    <circle cx="36" cy="24" r="4" fill="#333" stroke="white" strokeWidth="1" />
                                  </svg>
                                );
                              } else {
                                return (
                                  <svg viewBox="0 0 48 24" className="w-8 h-5" fill="none">
                                    <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill={color} stroke="white" strokeWidth="1.5" />
                                    <circle cx="14" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
                                    <circle cx="36" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
                                  </svg>
                                );
                              }
                            })()}
                          </div>
                        )}
                        
                        {/* Matrícula */}
                        {alert && (
                          <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
                            <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
                              <span className="text-[8px] font-bold text-white">E</span>
                            </div>
                            <span className="flex-1 text-center font-mono font-bold text-sm tracking-wider text-black">
                              {(() => {
                                const plate = alert.car_plate?.replace(/\s/g, '').toUpperCase() || '';
                                return plate.length >= 4 ? `${plate.slice(0, 4)} ${plate.slice(4)}` : plate;
                              })()}
                            </span>
                          </div>
                        )}

                        {/* Último mensaje */}
                        <p className={`text-xs truncate ${hasUnread ? 'text-gray-300' : 'text-gray-500'}`}>
                          {conv.last_message_text || 'Sin mensajes'}
                        </p>

                        {/* Botones de acción */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <Button
                            className="bg-green-600 hover:bg-green-700 text-white h-7 w-11 rounded-lg flex items-center justify-center p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (otherUser.allowCalls && otherUser.phone) {
                                window.location.href = `tel:${otherUser.phone}`;
                              }
                            }}
                            disabled={!otherUser.allowCalls || !otherUser.phone}
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button
                            className="bg-white hover:bg-gray-100 text-green-600 h-7 w-11 rounded-lg flex items-center justify-center p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = createPageUrl(`Chat?conversationId=${conv.id}`);
                            }}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          
                          {/* Contador de cuenta atrás */}
                          {alert && (
                            <div className="flex-1">
                              <CountdownTimer
                                availableInMinutes={alert.available_in_minutes}
                                createdDate={alert.created_date}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Dirección y tiempo debajo */}
                    {alert && (
                      <div className="mt-3 px-2 space-y-1">
                        <div className={`flex items-center gap-2 text-xs ${hasUnread ? 'text-gray-300' : 'text-gray-500'}`}>
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{alert.address || 'Ubicación marcada'}</span>
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${hasUnread ? 'text-gray-300' : 'text-gray-500'}`}>
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span>Se va en {alert.available_in_minutes} min • Te espera hasta las {format(new Date(new Date(alert.created_date).getTime() + alert.available_in_minutes * 60000), 'HH:mm')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>);

          })}
          </div>
        }
      </main>

      <BottomNav />
    </div>);

}