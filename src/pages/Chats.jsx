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
import { formatDistanceToNow, format } from 'date-fns';
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
    <div className="h-7 rounded-lg border-2 border-gray-700 bg-gray-800 flex items-center justify-center px-2 w-full">
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

  // Filtrar conversaciones por búsqueda y ordenar por no leídos primero
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

    // Ordenar: no leídos primero
    return filtered.sort((a, b) => {
      const isP1_a = a.participant1_id === user?.id;
      const unreadA = isP1_a ? a.unread_count_p1 : a.unread_count_p2;
      const isP1_b = b.participant1_id === user?.id;
      const unreadB = isP1_b ? b.unread_count_p1 : b.unread_count_p2;
      
      if (unreadB > 0 && unreadA === 0) return 1;
      if (unreadA > 0 && unreadB === 0) return -1;
      return 0;
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
                      bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden transition-all
                      ${hasUnread ?
                  'border-2 border-purple-500 shadow-lg shadow-purple-500/20' :
                  'border-2 border-gray-800'}
                    `
                  }>
                    {/* Encabezado con "Información del usuario:" */}
                    <div className="bg-purple-600/20 border-b border-purple-500/30 px-4 py-2">
                      <p className="text-purple-400 text-xs font-medium flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        {distanceText && <span>{distanceText}</span>}
                        {alert && <span className="text-purple-300">• {alert.price}€</span>}
                      </p>
                    </div>

                    {/* Contenido principal */}
                    <div className="p-4">
                      <div className="flex gap-3">
                        {/* Columna izquierda: Foto */}
                        <div className="flex-shrink-0" style={{ width: '92px' }}>
                          <Link to={createPageUrl(`Chat?conversationId=${conv.id}`)}>
                            <div className="w-[92px] h-20 rounded-lg overflow-hidden bg-gray-800 border-2 border-purple-500">
                              {otherUser.photo ? (
                                <img src={otherUser.photo} className="w-full h-full object-cover" alt={otherUser.name} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-3xl font-bold text-purple-400">{otherUser.initial}</span>
                                </div>
                              )}
                            </div>
                          </Link>

                          {/* Botones debajo de la foto - mismo ancho que foto */}
                          <div className="flex gap-1 mt-2 w-[92px]">
                            <Button
                              className="bg-green-600 hover:bg-green-700 text-white h-9 flex-1 rounded-lg flex items-center justify-center p-0"
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
                              className="bg-white hover:bg-gray-100 text-green-600 h-9 flex-1 rounded-lg flex items-center justify-center p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = createPageUrl(`Chat?conversationId=${conv.id}`);
                              }}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Columna derecha: Info */}
                        <div className="flex-1 flex flex-col gap-2">
                          {/* Nombre */}
                          <h3 className={`font-bold text-base ${hasUnread ? 'text-white' : 'text-gray-300'}`}>
                            {otherUserName}
                          </h3>
                          
                          {/* Marca y Modelo */}
                          {alert && (
                            <p className={`text-sm ${hasUnread ? 'text-white' : 'text-gray-400'}`}>
                              {alert.car_brand} {alert.car_model}
                            </p>
                          )}
                          
                          {/* Matrícula */}
                          {alert && (
                            <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-8">
                              <div className="bg-blue-600 h-full w-6 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white">E</span>
                              </div>
                              <span className="flex-1 text-center font-mono font-bold text-sm tracking-wider text-black">
                                {(() => {
                                  const plate = alert.car_plate?.replace(/\s/g, '').toUpperCase() || '';
                                  return plate.length >= 4 ? `${plate.slice(0, 4)} ${plate.slice(4)}` : plate;
                                })()}
                              </span>
                            </div>
                          )}

                          {/* Contador de cuenta atrás - mismo ancho que info */}
                          {alert && (
                            <CountdownTimer
                              availableInMinutes={alert.available_in_minutes}
                              createdDate={alert.created_date}
                            />
                          )}
                        </div>
                      </div>

                      {/* Separador */}
                      <div className="my-3 border-t border-gray-700"></div>

                      {/* Información adicional */}
                      {alert && (
                        <div className="space-y-2">
                          <div className={`flex items-center gap-2 text-xs ${hasUnread ? 'text-gray-300' : 'text-gray-500'}`}>
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{alert.address || 'Ubicación marcada'}</span>
                          </div>
                          <div className={`flex items-center gap-2 text-xs ${hasUnread ? 'text-gray-300' : 'text-gray-500'}`}>
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span>Se va en {alert.available_in_minutes} min • Te espera hasta las {format(new Date(new Date(alert.created_date).getTime() + alert.available_in_minutes * 60000), 'HH:mm')}</span>
                          </div>
                          
                          {/* Último mensaje */}
                          {conv.last_message_text && (
                            <div className={`text-xs mt-2 p-2 rounded-lg ${hasUnread ? 'bg-purple-500/20 text-white' : 'bg-gray-800 text-gray-400'}`}>
                              <p className="truncate">{conv.last_message_text}</p>
                            </div>
                          )}
                        </div>
                      )}
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