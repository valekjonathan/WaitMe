import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    </div>
  );
}

export default function Chats() {
  const navigate = useNavigate();

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

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.log('Error obteniendo ubicación:', error)
      );
    }
  }, []);

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const allConversations = await base44.entities.Conversation.list('-last_message_at', 50);

      const mockConversations = [
        {
          id: 'mock1',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant2_id: 'user2',
          participant2_name: 'Laura',
          alert_id: 'alert1',
          last_message_text: 'Genial, aguanto.',
          last_message_at: new Date(Date.now() - 2 * 60000).toISOString(),
          unread_count_p1: 0,
          unread_count_p2: 0
        }
      ];

      const combined = [...mockConversations, ...allConversations];
      return combined.sort(
        (a, b) =>
          new Date(b.last_message_at || b.updated_date || b.created_date) -
          new Date(a.last_message_at || a.updated_date || a.created_date)
      );
    },
    staleTime: 10000,
    refetchInterval: false
  });

  const { data: users = [] } = useQuery({
    queryKey: ['usersForChats'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user?.id,
    staleTime: 60000
  });

  const usersMap = React.useMemo(() => {
    const map = new Map();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const { data: alerts = [] } = useQuery({
    queryKey: ['alertsForChats'],
    queryFn: async () => {
      const realAlerts = await base44.entities.ParkingAlert.list('-created_date', 100);
      return realAlerts;
    },
    enabled: !!user?.id,
    staleTime: 30000
  });

  const alertsMap = React.useMemo(() => {
    const map = new Map();
    alerts.forEach((alert) => map.set(alert.id, alert));
    return map;
  }, [alerts]);

  const filteredConversations = conversations.filter(conv => alertsMap.has(conv.alert_id));

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Chats" showBackButton={true} backTo="Home" />

      <main className="pt-[60px] pb-24">
        <div className="px-4 space-y-3 pt-2.5">
          {filteredConversations.map((conv, index) => {
            const alert = alertsMap.get(conv.alert_id);

            return (
              <motion.div key={conv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <MarcoCard
                  photoUrl={alert?.user_photo}
                  name={alert?.user_name}
                  carLabel={`${alert?.car_brand || ''} ${alert?.car_model || ''}`}
                  plate={alert?.car_plate}
                  carColor={alert?.car_color || 'gris'}
                  address={alert?.address}
                  timeLine={`Se va en ${alert?.available_in_minutes} min`}
                  onChat={() => navigate(createPageUrl(`Chat?conversationId=${conv.id}`))}
                  phoneEnabled={alert?.allow_phone_calls}
                  onCall={() => alert?.allow_phone_calls && alert?.phone && (window.location.href = `tel:${alert.phone}`)}
                />
              </motion.div>
            );
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}