import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, User, Settings, Search, X, Phone, PhoneOff, Navigation, MapPin, Clock, Car, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import MarcoCard from '@/components/cards/MarcoCard';

// Componente contador de cuenta atrás EN TIEMPO REAL
function CountdownTimer({ endTime, onExpire, alertId }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

      if (remaining === 0 && !expired) {
        setExpired(true);
        onExpire();
      }

      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTime, expired, onExpire]);

  return (
    <div className="w-full h-8 rounded-lg border-2 border-gray-700 bg-gray-800 flex items-center justify-center px-3">
      <span className="text-purple-400 text-sm font-mono font-bold">{timeLeft}</span>
    </div>
  );
}

export default function Chats() {
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProrrogaDialog, setShowProrrogaDialog] = useState(false);
  const [prorrogaData, setProrrogaData] = useState(null);
  const [expiredAlert, setExpiredAlert] = useState(null);

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
      const allConversations = await base44.entities.Conversation.list('-last_message_at', 50);
      
      // 4 TARJETAS DE EJEMPLO: 2 sin leer (encendidas) + 2 leídas (apagadas)
      const mockConversations = [
        // TARJETA 1: RESERVASTE A - CON MENSAJES SIN LEER
        {
          id: 'mock_reservaste_unread',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'seller_laura',
          participant2_name: 'Laura',
          participant2_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
          alert_id: 'alert_reservaste_1',
          last_message_text: 'Perfecto, te espero aquí',
          last_message_at: new Date(Date.now() - 2 * 60000).toISOString(),
          unread_count_p1: 3,
          unread_count_p2: 0,
          status: 'reserved',
          reserved_by_me: true,
          expires_at: new Date(Date.now() + 8 * 60000).toISOString() // 8 minutos para llegar
        },
        // TARJETA 2: TE RESERVÓ - CON MENSAJES SIN LEER
        {
          id: 'mock_tereservo_unread',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'buyer_carlos',
          participant2_name: 'Carlos',
          participant2_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
          alert_id: 'alert_tereservo_1',
          last_message_text: 'Voy en camino, 5 minutos!',
          last_message_at: new Date(Date.now() - 1 * 60000).toISOString(),
          unread_count_p1: 2,
          unread_count_p2: 0,
          status: 'reserved',
          reserved_by_me: false,
          expires_at: new Date(Date.now() + 12 * 60000).toISOString() // 12 minutos debe esperar
        },
        // TARJETA 3: RESERVASTE A - MENSAJES LEÍDOS (APAGADA)
        {
          id: 'mock_reservaste_read',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'seller_sofia',
          participant2_name: 'Sofía',
          participant2_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
          alert_id: 'alert_reservaste_2',
          last_message_text: 'Genial, nos vemos',
          last_message_at: new Date(Date.now() - 10 * 60000).toISOString(),
          unread_count_p1: 0,
          unread_count_p2: 0,
          status: 'reserved',
          reserved_by_me: true,
          expires_at: new Date(Date.now() + 15 * 60000).toISOString()
        },
        // TARJETA 4: TE RESERVÓ - MENSAJES LEÍDOS (APAGADA)
        {
          id: 'mock_tereservo_read',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'buyer_marco',
          participant2_name: 'Marco',
          participant2_photo: 'https://randomuser.me/api/portraits/men/32.jpg',
          alert_id: 'alert_tereservo_2',
          last_message_text: 'Ok, aguanto hasta entonces',
          last_message_at: new Date(Date.now() - 8 * 60000).toISOString(),
          unread_count_p1: 0,
          unread_count_p2: 0,
          status: 'reserved',
          reserved_by_me: false,
          expires_at: new Date(Date.now() + 20 * 60000).toISOString()
        }
      ];

      const combined = [...mockConversations, ...allConversations];
      return combined.sort((a, b) => {
        const aUnread = (a.participant1_id === user?.id ? a.unread_count_p1 : a.unread_count_p2) || 0;
        const bUnread = (b.participant1_id === user?.id ? b.unread_count_p1 : b.unread_count_p2) || 0;
        if (bUnread !== aUnread) return bUnread - aUnread;
        return new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0);
      });
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
      
      // Datos mock de alertas correspondientes a las 4 conversaciones
      const mockAlerts = [
        {
          id: 'alert_reservaste_1',
          user_id: 'seller_laura',
          user_name: 'Laura',
          user_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
          car_brand: 'Opel',
          car_model: 'Corsa',
          car_plate: '9812GHJ',
          car_color: 'azul',
          price: 4,
          available_in_minutes: 8,
          address: 'Calle Uría, 33, Oviedo',
          latitude: 43.362776,
          longitude: -5.845890,
          allow_phone_calls: true,
          phone: '+34612345678',
          reserved_by_id: user?.id,
          status: 'reserved'
        },
        {
          id: 'alert_tereservo_1',
          user_id: user?.id,
          user_name: 'Tu',
          user_photo: user?.photo_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
          car_brand: 'Seat',
          car_model: 'Ibiza',
          car_plate: '1234ABC',
          car_color: 'rojo',
          price: 3.5,
          available_in_minutes: 12,
          address: 'Calle Campoamor, 15, Oviedo',
          latitude: 43.357815,
          longitude: -5.849790,
          allow_phone_calls: true,
          phone: '+34677889900',
          reserved_by_id: 'buyer_carlos',
          reserved_by_name: 'Carlos',
          status: 'reserved'
        },
        {
          id: 'alert_reservaste_2',
          user_id: 'seller_sofia',
          user_name: 'Sofía',
          user_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
          car_brand: 'Renault',
          car_model: 'Clio',
          car_plate: '7733MNP',
          car_color: 'blanco',
          price: 5,
          available_in_minutes: 15,
          address: 'Plaza de la Escandalera, Oviedo',
          latitude: 43.3609,
          longitude: -5.8501,
          allow_phone_calls: false,
          phone: null,
          reserved_by_id: user?.id,
          status: 'reserved'
        },
        {
          id: 'alert_tereservo_2',
          user_id: user?.id,
          user_name: 'Tu',
          user_photo: user?.photo_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
          car_brand: 'BMW',
          car_model: 'Serie 3',
          car_plate: '5521LKP',
          car_color: 'negro',
          price: 6,
          available_in_minutes: 20,
          address: 'Calle Fruela, 7, Oviedo',
          latitude: 43.3615,
          longitude: -5.8505,
          allow_phone_calls: true,
          phone: '+34666554433',
          reserved_by_id: 'buyer_marco',
          reserved_by_name: 'Marco',
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

    // Ordenar sin leer primero, después por timestamp más reciente
    return filtered.sort((a, b) => {
      const aUnread = (a.participant1_id === user?.id ? a.unread_count_p1 : a.unread_count_p2) || 0;
      const bUnread = (b.participant1_id === user?.id ? b.unread_count_p1 : b.unread_count_p2) || 0;
      if (bUnread !== aUnread) return bUnread - aUnread;
      return new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0);
    });
  }, [conversations, searchQuery, user?.id]);

  // Handlers para cuando expira el tiempo
  const handleExpiredReservaste = (alert, conv) => {
    setProrrogaData({
      type: 'reservaste',
      alert,
      conv,
      message: 'No te has presentado, se te devolverá tu importe menos la comisión de WaitMe!'
    });
    setExpiredAlert(alert.id);
    setShowProrrogaDialog(true);
  };

  const handleExpiredTeReservo = (alert, conv) => {
    setProrrogaData({
      type: 'te_reservo',
      alert,
      conv,
      message: 'Usuario no se ha presentado, se te ingresará el 33% del importe de la operación como compensación por tu espera'
    });
    setExpiredAlert(alert.id);
    setShowProrrogaDialog(true);
  };

  const handleProrroga = (minutes, price) => {
    console.log(`Prórroga solicitada: ${minutes} minutos por ${price}€`);
    setShowProrrogaDialog(false);
    setProrrogaData(null);
    setExpiredAlert(null);
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

            const hasUnread = unreadCount > 0;

            // Formatear fecha: "06 Feb - 12:42" con F mayúscula
            const formatCardDate = (ts) => {
              if (!ts) return '--';
              const date = new Date(ts);
              const day = date.toLocaleString('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit' });
              let month = date.toLocaleString('es-ES', { timeZone: 'Europe/Madrid', month: 'short' }).replace('.', '');
              month = month.charAt(0).toUpperCase() + month.slice(1);
              const time = date.toLocaleString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false });
              return `${day} ${month} - ${time}`;
            };

            const cardDate = formatCardDate(conv.last_message_at || conv.created_date);

            // Determinar tipo de tarjeta
            const isReservadoPorMi = alert?.reserved_by_id === user?.id;
            const meReservaron = alert?.user_id === user?.id && alert?.reserved_by_id;

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
              if (!alert?.latitude || !alert?.longitude) return null;
              if (!userLocation) {
                // Demo: distancias variadas
                const demoDistances = ['150m', '320m', '480m', '650m', '800m'];
                return demoDistances[(alert.id || '').charCodeAt(0) % demoDistances.length];
              }
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
                        <div className="flex-shrink-0 w-[95px]">
                          <Badge className={`${hasUnread ? 'bg-purple-500/20 text-purple-300 border-purple-400/50' : 'bg-red-500/20 text-red-400 border-red-500/30'} border font-bold text-xs h-7 w-full flex items-center justify-center cursor-default select-none pointer-events-none truncate`}>
                            {alert?.reserved_by_id === user?.id ? 'Reservaste a:' : alert?.reserved_by_id ? 'Te reservó:' : 'Info usuario'}
                          </Badge>
                        </div>
                        <div className={`flex-1 text-center text-xs ${hasUnread ? 'text-gray-300' : 'text-gray-400'} truncate`}>
                          {cardDate}
                        </div>
                        <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
                          <Navigation className="w-3 h-3 text-purple-400" />
                          <span className="text-white font-bold text-xs">{distanceText}</span>
                        </div>
                        <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg px-3 py-0.5 flex items-center gap-1 h-7">
                          <span className="text-purple-300 font-bold text-xs">{Math.floor(alert?.price)}€</span>
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
                        timeLine={
                          isReservadoPorMi ? (
                            <><span className={hasUnread ? "text-white" : "text-gray-400"}>Se va en {alert.available_in_minutes} min ·</span> Te espera hasta las {new Date(Date.now() + alert.available_in_minutes * 60000).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false })}</>
                          ) : (
                            <><span className={hasUnread ? "text-white" : "text-gray-400"}>Te vas en {alert.available_in_minutes} min ·</span> Debes esperar hasta las {new Date(Date.now() + alert.available_in_minutes * 60000).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false })}</>
                          )
                        }
                        onChat={() => window.location.href = createPageUrl(`Chat?conversationId=${conv.id}`)}
                        statusText={new Date(Date.now() + alert.available_in_minutes * 60000).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false })}
                        phoneEnabled={alert.allow_phone_calls}
                        onCall={() => alert.allow_phone_calls && alert?.phone && (window.location.href = `tel:${alert.phone}`)}
                        dimmed={!hasUnread}
                      />
                      </div>

                      {/* Cuenta atrás EN TIEMPO REAL */}
                      {conv.expires_at && expiredAlert !== alert.id && (
                       <div className="border-t border-gray-700/80 pt-2 mb-1.5">
                         <CountdownTimer 
                           endTime={new Date(conv.expires_at).getTime()}
                           alertId={alert.id}
                           onExpire={() => {
                             if (isReservadoPorMi) {
                               handleExpiredReservaste(alert, conv);
                             } else {
                               handleExpiredTeReservo(alert, conv);
                             }
                           }}
                         />
                       </div>
                      )}

                      {/* Ultimos mensajes */}
                      <div className="border-t border-gray-700/80 mt-2 pt-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.location.href = createPageUrl(`Chat?conversationId=${conv.id}`)}>
                        <div className="flex justify-between items-center">
                          <p className={`text-xs font-bold ${hasUnread ? 'text-purple-400' : 'text-gray-500'}`}>Ultimos mensajes:</p>
                          {unreadCount > 0 && (
                            <div className="w-6 h-6 bg-red-500/20 border-2 border-red-500/30 rounded-full flex items-center justify-center relative top-[10px]">
                              <span className="text-red-400 text-xs font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                            </div>
                          )}
                        </div>
                        <p className={`text-xs ${hasUnread ? 'text-gray-300' : 'text-gray-500'} mt-1`}>{conv.last_message_text || 'Sin mensajes'}</p>
                      </div>
                    </div>
                </div>
              </motion.div>
              );
              })}
              </div>
              </main>

              <BottomNav />

              {/* Dialog de PRÓRROGA */}
              <Dialog open={showProrrogaDialog} onOpenChange={setShowProrrogaDialog}>
              <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-sm">
              <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-500" />
              Tiempo agotado
              </DialogTitle>
              <DialogDescription className="text-gray-400 mt-2">
              {prorrogaData?.message}
              </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-4">
              <p className="text-sm text-gray-300 font-semibold">Opciones de prórroga:</p>

              <Button
              onClick={() => handleProrroga(5, 1)}
              className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-base justify-between"
              >
              <span>5 minutos más</span>
              <span className="font-bold">1€</span>
              </Button>

              <Button
              onClick={() => handleProrroga(10, 3)}
              className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-base justify-between"
              >
              <span>10 minutos más</span>
              <span className="font-bold">3€</span>
              </Button>

              <Button
              onClick={() => handleProrroga(15, 5)}
              className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-base justify-between"
              >
              <span>15 minutos más</span>
              <span className="font-bold">5€</span>
              </Button>
              </div>

              <DialogFooter className="mt-4">
              <Button
              variant="outline"
              onClick={() => {
               setShowProrrogaDialog(false);
               setProrrogaData(null);
               setExpiredAlert(null);
              }}
              className="w-full border-gray-700"
              >
              Cancelar
              </Button>
              </DialogFooter>
              </DialogContent>
              </Dialog>
              </div>);

              }