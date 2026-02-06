import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, User, Settings, Search, X, Phone, PhoneOff, Navigation, MapPin, Clock, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import MarcoCard from '@/components/cards/MarcoCard';

// Componente contador de cuenta atrás EN TIEMPO REAL
function CountdownTimer({ targetTime, onExpired }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, targetTime - now);
      
      if (remaining === 0 && !expired) {
        setExpired(true);
        onExpired?.();
      }

      const totalSeconds = Math.floor(remaining / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetTime, onExpired, expired]);

  return (
    <div className={`w-full h-8 rounded-lg border-2 ${expired ? 'border-red-500 bg-red-900/20' : 'border-gray-700 bg-gray-800'} flex items-center justify-center px-3`}>
      <span className={`${expired ? 'text-red-400' : 'text-purple-400'} text-sm font-mono font-bold`}>{timeLeft}</span>
    </div>
  );
}

const isFinalStatus = (status) => {
  const s = String(status || '').toLowerCase();
  return [
    'completed',
    'completada',
    'rejected',
    'rechazada',
    'cancelled',
    'cancelada',
    'expired',
    'agotada',
    'left',
    'se_fue',
    'extended',
    'prorrogada'
  ].includes(s);
};

const statusLabel = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'completed' || s === 'completada') return 'COMPLETADA';
  if (s === 'rejected' || s === 'rechazada') return 'RECHAZADA';
  if (s === 'cancelled' || s === 'cancelada') return 'CANCELADA';
  if (s === 'expired' || s === 'agotada') return 'AGOTADA';
  if (s === 'left' || s === 'se_fue') return 'SE FUE';
  if (s === 'extended' || s === 'prorrogada') return 'PRÓRROGA';
  if (s === 'thinking' || s === 'me_lo_pienso') return 'PENSANDO';
  return '';
};

export default function Chats() {
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProrrogaDialog, setShowProrrogaDialog] = useState(false);
  const [selectedProrroga, setSelectedProrroga] = useState(null);
  const [currentExpiredAlert, setCurrentExpiredAlert] = useState(null);

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
      
      // 4 tarjetas demo: 2 con mensajes sin leer (encendidas), 2 con mensajes leídos (apagadas)
      const mockConversations = [
        // TARJETA 1: RESERVASTE A (con mensajes sin leer - ENCENDIDA)
        {
          id: 'mock_reservaste_1',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'seller_sofia',
          participant2_name: 'Sofía',
          participant2_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
          alert_id: 'alert_reservaste_1',
          last_message_text: 'Perfecto, voy llegando',
          last_message_at: new Date(Date.now() - 1 * 60000).toISOString(),
          unread_count_p1: 2,
          unread_count_p2: 0,
          reservation_type: 'buyer' // Tú reservaste
        },
        // TARJETA 2: TE RESERVÓ (con mensajes sin leer - ENCENDIDA)
        {
          id: 'mock_te_reservo_1',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'buyer_marco',
          participant2_name: 'Marco',
          participant2_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
          alert_id: 'alert_te_reservo_1',
          last_message_text: '¿Sigues ahí?',
          last_message_at: new Date(Date.now() - 2 * 60000).toISOString(),
          unread_count_p1: 3,
          unread_count_p2: 0,
          reservation_type: 'seller' // Te reservaron
        },
        // TARJETA 3: RESERVASTE A (todos los mensajes leídos - APAGADA)
        {
          id: 'mock_reservaste_2',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'seller_laura',
          participant2_name: 'Laura',
          participant2_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
          alert_id: 'alert_reservaste_2',
          last_message_text: 'Genial, aguanto',
          last_message_at: new Date(Date.now() - 10 * 60000).toISOString(),
          unread_count_p1: 0,
          unread_count_p2: 0,
          reservation_type: 'buyer'
        },
        // TARJETA 4: TE RESERVÓ (todos los mensajes leídos - APAGADA)
        {
          id: 'mock_te_reservo_2',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'buyer_carlos',
          participant2_name: 'Carlos',
          participant2_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
          alert_id: 'alert_te_reservo_2',
          last_message_text: 'Estoy cerca',
          last_message_at: new Date(Date.now() - 15 * 60000).toISOString(),
          unread_count_p1: 0,
          unread_count_p2: 0,
          reservation_type: 'seller'
        }
        ,
        // DEMOS extra (para ver TODOS los estados en esta pantalla)
        {
          id: 'mock_completada_1',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'seller_paula',
          participant2_name: 'Paula',
          participant2_photo: 'https://randomuser.me/api/portraits/women/44.jpg',
          alert_id: 'alert_demo_completada_1',
          last_message_text: '¡Listo! Pago completado ✅',
          last_message_at: new Date(Date.now() - 25 * 60000).toISOString(),
          unread_count_p1: 0,
          unread_count_p2: 0,
          reservation_type: 'buyer'
        },
        {
          id: 'mock_me_lo_pienso_1',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'seller_nerea',
          participant2_name: 'Nerea',
          participant2_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
          alert_id: 'alert_demo_pensando_1',
          last_message_text: 'Me lo estoy pensando...',
          last_message_at: new Date(Date.now() - 30 * 60000).toISOString(),
          unread_count_p1: 0,
          unread_count_p2: 0,
          reservation_type: 'buyer'
        },
        {
          id: 'mock_rechazada_1',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'seller_sara',
          participant2_name: 'Sara',
          participant2_photo: 'https://randomuser.me/api/portraits/women/20.jpg',
          alert_id: 'alert_demo_rechazada_1',
          last_message_text: 'Operación rechazada ❌',
          last_message_at: new Date(Date.now() - 35 * 60000).toISOString(),
          unread_count_p1: 0,
          unread_count_p2: 0,
          reservation_type: 'buyer'
        },
        {
          id: 'mock_prorrogada_1',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'buyer_david',
          participant2_name: 'David',
          participant2_photo: 'https://randomuser.me/api/portraits/men/32.jpg',
          alert_id: 'alert_demo_prorrogada_1',
          last_message_text: 'Prórroga aceptada (+10 min)',
          last_message_at: new Date(Date.now() - 40 * 60000).toISOString(),
          unread_count_p1: 0,
          unread_count_p2: 0,
          reservation_type: 'seller'
        },
        {
          id: 'mock_se_fue_1',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'buyer_luis',
          participant2_name: 'Luis',
          participant2_photo: 'https://randomuser.me/api/portraits/men/75.jpg',
          alert_id: 'alert_demo_se_fue_1',
          last_message_text: 'El usuario se fue antes',
          last_message_at: new Date(Date.now() - 45 * 60000).toISOString(),
          unread_count_p1: 0,
          unread_count_p2: 0,
          reservation_type: 'seller'
        },
        {
          id: 'mock_agotada_1',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'seller_marta',
          participant2_name: 'Marta',
          participant2_photo: 'https://randomuser.me/api/portraits/women/12.jpg',
          alert_id: 'alert_demo_agotada_1',
          last_message_text: 'Tiempo agotado ⏱️',
          last_message_at: new Date(Date.now() - 50 * 60000).toISOString(),
          unread_count_p1: 0,
          unread_count_p2: 0,
          reservation_type: 'buyer'
        },
        {
          id: 'mock_cancelada_1',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'seller_elena',
          participant2_name: 'Elena',
          participant2_photo: 'https://randomuser.me/api/portraits/women/88.jpg',
          alert_id: 'alert_demo_cancelada_1',
          last_message_text: 'Operación cancelada',
          last_message_at: new Date(Date.now() - 55 * 60000).toISOString(),
          unread_count_p1: 0,
          unread_count_p2: 0,
          reservation_type: 'buyer'
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
      
      // Datos mock de alertas correspondientes a las 4 tarjetas
      const now = Date.now();
      const mockAlerts = [
        // ALERT 1: RESERVASTE A Sofía (12 minutos para llegar)
        {
          id: 'alert_reservaste_1',
          user_name: 'Sofía',
          user_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
          car_brand: 'Renault',
          car_model: 'Clio',
          car_plate: '7733 MNP',
          car_color: 'rojo',
          price: 6,
          available_in_minutes: 12,
          target_time: now + (12 * 60 * 1000), // 12 minutos desde ahora
          address: 'Calle Uría, 33, Oviedo',
          latitude: 43.362776,
          longitude: -5.845890,
          allow_phone_calls: true,
          phone: '+34677889900',
          reserved_by_id: user?.id,
          reserved_by_name: 'Tu',
          status: 'reserved',
          created_date: new Date(now - 1 * 60000).toISOString()
        },
        // ALERT 2: TE RESERVÓ Marco (8 minutos para que llegue)
        {
          id: 'alert_te_reservo_1',
          user_name: 'Tu',
          user_photo: user?.photo_url,
          car_brand: 'Seat',
          car_model: 'Ibiza',
          car_plate: '1234 ABC',
          car_color: 'azul',
          price: 4,
          available_in_minutes: 8,
          target_time: now + (8 * 60 * 1000), // 8 minutos desde ahora
          address: 'Calle Campoamor, 15, Oviedo',
          latitude: 43.357815,
          longitude: -5.849790,
          allow_phone_calls: true,
          phone: user?.phone,
          user_id: user?.id,
          reserved_by_id: 'buyer_marco',
          reserved_by_name: 'Marco',
          reserved_by_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
          status: 'reserved',
          created_date: new Date(now - 2 * 60000).toISOString()
        },
        // ALERT 3: RESERVASTE A Laura (25 minutos para llegar)
        {
          id: 'alert_reservaste_2',
          user_name: 'Laura',
          user_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
          car_brand: 'Opel',
          car_model: 'Corsa',
          car_plate: '9812 GHJ',
          car_color: 'blanco',
          price: 4,
          available_in_minutes: 25,
          target_time: now + (25 * 60 * 1000),
          address: 'Paseo de la Castellana, 42, Madrid',
          latitude: 40.464667,
          longitude: -3.632623,
          allow_phone_calls: true,
          phone: '+34612345678',
          reserved_by_id: user?.id,
          reserved_by_name: 'Tu',
          status: 'reserved',
          created_date: new Date(now - 10 * 60000).toISOString()
        },
        // ALERT 4: TE RESERVÓ Carlos (18 minutos para que llegue)
        {
          id: 'alert_te_reservo_2',
          user_name: 'Tu',
          user_photo: user?.photo_url,
          car_brand: 'Toyota',
          car_model: 'Yaris',
          car_plate: '5678 DEF',
          car_color: 'gris',
          price: 5,
          available_in_minutes: 18,
          target_time: now + (18 * 60 * 1000),
          address: 'Avenida del Paseo, 25, Madrid',
          latitude: 40.456775,
          longitude: -3.688790,
          allow_phone_calls: true,
          phone: user?.phone,
          user_id: user?.id,
          reserved_by_id: 'buyer_carlos',
          reserved_by_name: 'Carlos',
          reserved_by_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
          status: 'reserved',
          created_date: new Date(now - 15 * 60000).toISOString()
        }
        ,
        // DEMOS extra (estados finales y "me lo pienso")
        {
          id: 'alert_completada_1',
          user_id: 'seller_marta',
          user_name: 'Marta',
          user_photo: 'https://randomuser.me/api/portraits/women/44.jpg',
          car_brand: 'BMW',
          car_model: 'Serie 1',
          car_plate: '4581 LKM',
          car_color: 'negro',
          price: 3,
          address: 'Plaza de la Escandalera, Oviedo',
          latitude: 43.36062,
          longitude: -5.84489,
          allow_phone_calls: true,
          phone: '+34611111111',
          reserved_by_id: user?.id,
          reserved_by_name: 'Tu',
          status: 'completed',
          created_date: new Date(now - 30 * 60000).toISOString()
        },
        {
          id: 'alert_pensando_1',
          user_id: 'seller_sara',
          user_name: 'Sara',
          user_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
          car_brand: 'Fiat',
          car_model: '500',
          car_plate: '9012 KJH',
          car_color: 'blanco',
          price: 4,
          address: 'Calle Rosal, 7, Oviedo',
          latitude: 43.36212,
          longitude: -5.8471,
          allow_phone_calls: false,
          phone: '+34622222222',
          reserved_by_id: user?.id,
          reserved_by_name: 'Tu',
          status: 'thinking',
          created_date: new Date(now - 35 * 60000).toISOString()
        },
        {
          id: 'alert_rechazada_1',
          user_id: 'seller_ines',
          user_name: 'Inés',
          user_photo: 'https://randomuser.me/api/portraits/women/25.jpg',
          car_brand: 'Peugeot',
          car_model: '208',
          car_plate: '1122 JKL',
          car_color: 'gris',
          price: 5,
          address: 'Calle Pelayo, 12, Oviedo',
          latitude: 43.3614,
          longitude: -5.8462,
          allow_phone_calls: true,
          phone: '+34633333333',
          reserved_by_id: user?.id,
          reserved_by_name: 'Tu',
          status: 'rejected',
          created_date: new Date(now - 45 * 60000).toISOString()
        },
        {
          id: 'alert_prorrogada_1',
          user_id: user?.id,
          user_name: 'Tu',
          user_photo: user?.photo_url,
          car_brand: 'Seat',
          car_model: 'Ibiza',
          car_plate: '1234 ABC',
          car_color: 'azul',
          price: 6,
          address: 'Calle Gascona, 19, Oviedo',
          latitude: 43.36514,
          longitude: -5.84688,
          allow_phone_calls: true,
          phone: user?.phone,
          reserved_by_id: 'buyer_nico',
          reserved_by_name: 'Nico',
          reserved_by_photo: 'https://randomuser.me/api/portraits/men/32.jpg',
          status: 'extended',
          created_date: new Date(now - 55 * 60000).toISOString()
        },
        {
          id: 'alert_se_fue_1',
          user_id: user?.id,
          user_name: 'Tu',
          user_photo: user?.photo_url,
          car_brand: 'Seat',
          car_model: 'Ibiza',
          car_plate: '1234 ABC',
          car_color: 'azul',
          price: 4,
          address: 'Calle Independencia, 4, Oviedo',
          latitude: 43.36188,
          longitude: -5.84431,
          allow_phone_calls: true,
          phone: user?.phone,
          reserved_by_id: 'buyer_dani',
          reserved_by_name: 'Dani',
          reserved_by_photo: 'https://randomuser.me/api/portraits/men/75.jpg',
          status: 'left',
          created_date: new Date(now - 70 * 60000).toISOString()
        },
        {
          id: 'alert_agotada_1',
          user_id: 'seller_juan',
          user_name: 'Juan',
          user_photo: 'https://randomuser.me/api/portraits/men/52.jpg',
          car_brand: 'Volkswagen',
          car_model: 'Golf',
          car_plate: '3344 MNO',
          car_color: 'gris',
          price: 3,
          address: 'Calle Cervantes, 2, Oviedo',
          latitude: 43.3602,
          longitude: -5.8454,
          allow_phone_calls: false,
          phone: '+34644444444',
          reserved_by_id: user?.id,
          reserved_by_name: 'Tu',
          status: 'expired',
          created_date: new Date(now - 90 * 60000).toISOString()
        },
        {
          id: 'alert_cancelada_1',
          user_id: 'seller_luis',
          user_name: 'Luis',
          user_photo: 'https://randomuser.me/api/portraits/men/41.jpg',
          car_brand: 'Kia',
          car_model: 'Rio',
          car_plate: '7788 PQR',
          car_color: 'rojo',
          price: 4,
          address: 'Calle Caveda, 18, Oviedo',
          latitude: 43.36302,
          longitude: -5.84395,
          allow_phone_calls: true,
          phone: '+34655555555',
          reserved_by_id: user?.id,
          reserved_by_name: 'Tu',
          status: 'cancelled',
          created_date: new Date(now - 110 * 60000).toISOString()
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

  // Función para calcular minutos desde el último mensaje
  const getMinutesSince = (timestamp) => {
    if (!timestamp) return 1;
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    return Math.max(1, minutes);
  };

  // Manejar cuando expira el contador
  const handleCountdownExpired = (alert, isBuyer) => {
    setCurrentExpiredAlert({ alert, isBuyer });
    setShowProrrogaDialog(true);
  };

  // Manejar prórroga
  const handleProrroga = async () => {
    if (!selectedProrroga || !currentExpiredAlert) return;
    
    const { minutes, price } = selectedProrroga;
    const { alert, isBuyer } = currentExpiredAlert;
    
    // Aquí iría la lógica de crear notificación de prórroga
    console.log(`Prórroga solicitada: ${minutes} min por ${price}€`);
    
    // Crear notificación para el otro usuario
    try {
      await base44.entities.Notification.create({
        type: 'extension_request',
        recipient_id: isBuyer ? alert.user_id : alert.reserved_by_id,
        sender_id: user?.id,
        sender_name: user?.display_name || user?.full_name?.split(' ')[0],
        alert_id: alert.id,
        amount: price,
        extension_minutes: minutes,
        status: 'pending'
      });
    } catch (err) {
      console.error('Error creando notificación de prórroga:', err);
    }
    
    setShowProrrogaDialog(false);
    setSelectedProrroga(null);
    setCurrentExpiredAlert(null);
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

            // Formatear fecha en formato "06 Feb - 12:42"
            const formatCardDate = (ts) => {
              if (!ts) return '--';
              const date = new Date(ts);
              const day = date.toLocaleString('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit' });
              let month = date.toLocaleString('es-ES', { timeZone: 'Europe/Madrid', month: 'short' }).replace('.', '');
              // Capitalizar primera letra
              month = month.charAt(0).toUpperCase() + month.slice(1);
              const time = date.toLocaleString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false });
              return `${day} ${month} - ${time}`;
            };

            const cardDate = formatCardDate(conv.last_message_at || conv.created_date);

            // Determinar si es comprador o vendedor
            const isBuyer = alert?.reserved_by_id === user?.id;
            const isSeller = alert?.user_id === user?.id || conv.reservation_type === 'seller';

            const alertStatus = alert?.status;
            const finalStatus = isFinalStatus(alertStatus);
            const statusTextNode = finalStatus ? statusLabel(alertStatus) : (
              <CountdownTimer
                targetTime={alert.target_time}
                onExpired={() => handleCountdownExpired(alert, isBuyer, isSeller)}
              />
            );

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
                        photoUrl={isBuyer ? alert.user_photo : (alert.reserved_by_photo || otherUser.photo)}
                        name={isBuyer ? alert.user_name : (alert.reserved_by_name || otherUserName)}
                        carLabel={`${alert.car_brand || ''} ${alert.car_model || ''}`.trim()}
                        plate={alert.car_plate}
                        carColor={alert.car_color || 'gris'}
                        address={alert.address}
                        timeLine={
                          isSeller ? (
                            <>
                              <span className={hasUnread ? "text-white" : "text-gray-400"}>
                                Te vas en {alert.available_in_minutes} min ·{' '}
                                <span className="text-purple-400">
                                  Debes esperar hasta las {format(new Date(alert.target_time || Date.now() + alert.available_in_minutes * 60000), 'HH:mm')}
                                </span>
                              </span>
                            </>
                          ) : (
                            <>
                              <span className={hasUnread ? "text-white" : "text-gray-400"}>
                                Tiempo para llegar:
                              </span>
                            </>
                          )
                        }
                        onChat={() => window.location.href = createPageUrl(`Chat?conversationId=${conv.id}`)}
                        statusText={
                          finalStatus ? (
                            statusTextNode
                          ) : (
                            <CountdownTimer
                              targetTime={alert.target_time || Date.now() + alert.available_in_minutes * 60000}
                              onExpired={() => handleCountdownExpired(alert, isBuyer)}
                            />
                          )
                        }
                        showNavigate={isBuyer}
                        navigateEnabled={isBuyer && !finalStatus && !(!hasUnread)}
                        onNavigate={() => {
                          const qs = new URLSearchParams({
                            alertId: String(alert?.id || ''),
                            lat: String(alert?.latitude || ''),
                            lon: String(alert?.longitude || ''),
                            name: String(alert?.user_name || ''),
                            photo: String(alert?.user_photo || ''),
                            address: String(alert?.address || ''),
                          }).toString();
                          window.location.href = createPageUrl(`Navigate?${qs}`);
                        }}
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

      {/* Dialog de prórroga */}
      <Dialog open={showProrrogaDialog} onOpenChange={setShowProrrogaDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {currentExpiredAlert?.isBuyer 
                ? '⏱️ No te has presentado' 
                : '⏱️ Usuario no se ha presentado'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {currentExpiredAlert?.isBuyer 
                ? 'Se te devolverá tu importe menos la comisión de WaitMe! (33%)' 
                : 'Se te ingresará el 33% del importe de la operación como compensación por tu espera'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-300 font-semibold">¿Deseas prorrogar el tiempo?</p>
            
            <div className="space-y-2">
              <button
                onClick={() => setSelectedProrroga({ minutes: 5, price: 1 })}
                className={`w-full p-3 rounded-lg border-2 transition-all ${
                  selectedProrroga?.minutes === 5
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500/50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">5 minutos más</span>
                  <span className="text-purple-400 font-bold">1€</span>
                </div>
              </button>

              <button
                onClick={() => setSelectedProrroga({ minutes: 10, price: 3 })}
                className={`w-full p-3 rounded-lg border-2 transition-all ${
                  selectedProrroga?.minutes === 10
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500/50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">10 minutos más</span>
                  <span className="text-purple-400 font-bold">3€</span>
                </div>
              </button>

              <button
                onClick={() => setSelectedProrroga({ minutes: 15, price: 5 })}
                className={`w-full p-3 rounded-lg border-2 transition-all ${
                  selectedProrroga?.minutes === 15
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500/50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">15 minutos más</span>
                  <span className="text-purple-400 font-bold">5€</span>
                </div>
              </button>
            </div>
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowProrrogaDialog(false)}
              className="flex-1 border-gray-700"
            >
              {currentExpiredAlert?.isBuyer ? 'Aceptar devolución' : 'Aceptar compensación'}
            </Button>
            <Button
              onClick={handleProrroga}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={!selectedProrroga}
            >
              Solicitar prórroga
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}