import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, User, MapPin, Clock, Euro, Phone, MessageCircle, Navigation, Car, Paperclip, X, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ChatMessages from '@/components/chat/ChatMessages';

export default function Chat() {
  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('conversationId');
  
  const [user, setUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const queryClient = useQueryClient();
  const typingTimeoutRef = useRef(null);

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

  // Obtener conversación
  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      try {
        const convs = await base44.entities.Conversation.filter({ id: conversationId });
        if (convs[0]) return convs[0];
      } catch (error) {
        console.log('Error fetching conversation:', error);
      }
      
      // Mock conversación si no existe
      return {
        id: conversationId,
        participant1_id: user?.id || 'user1',
        participant1_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
        participant1_photo: user?.photo_url,
        participant2_id: 'user2',
        participant2_name: 'Laura',
        participant2_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        alert_id: 'alert1',
        last_message_text: 'Ya estoy aquí, veo tu coche. Voy a hacer la reserva 👍',
        last_message_at: new Date().toISOString(),
        unread_count_p1: 0,
        unread_count_p2: 0
      };
    },
    enabled: !!conversationId
  });

  // Obtener alerta relacionada
  const { data: alert } = useQuery({
    queryKey: ['alertInChat', conversation?.alert_id],
    queryFn: async () => {
      if (!conversation?.alert_id) return null;
      try {
        const alerts = await base44.entities.ParkingAlert.filter({ id: conversation.alert_id });
        if (alerts[0]) return alerts[0];
      } catch (error) {
        console.log('Error fetching alert:', error);
      }
      
      // Mock alerta si no existe
      return {
        id: conversation?.alert_id,
        user_name: 'Laura',
        user_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        car_brand: 'Opel',
        car_model: 'Corsa',
        car_color: 'gris',
        car_plate: '9812 GHJ',
        price: 4,
        available_in_minutes: 28,
        address: 'Paseo de la Castellana, 42',
        latitude: 40.464667,
        longitude: -3.632623,
        allow_phone_calls: true,
        phone: '+34612345678'
      };
    },
    enabled: !!conversation?.alert_id
  });

  // Obtener mensajes
  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', conversationId, conversation?.id],
    queryFn: async () => {
      if (!conversationId) return [];
      
      try {
        const msgs = await base44.entities.ChatMessage.filter({ conversation_id: conversationId });
        
        // Si hay mensajes, devolverlos ordenados
        if (msgs.length > 0) {
          return msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        }
      } catch (error) {
        console.log('Error fetching messages:', error);
      }
      
      // Si no hay mensajes, crear conversación simulada
      const mockMessages = [
        {
          id: 'mock1',
          conversation_id: conversationId,
          sender_id: conversation?.participant2_id || 'user2',
          sender_name: conversation?.participant2_name || 'Laura',
          message: `¡Hola! Vi tu anuncio de búsqueda de parking`,
          read: true,
          message_type: 'user',
          created_date: new Date(Date.now() - 5 * 60000).toISOString()
        },
        {
          id: 'mock2',
          conversation_id: conversationId,
          sender_id: user?.id,
          sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
          message: `¡Hola! Sí, necesito un parking por aquí urgentemente`,
          read: true,
          message_type: 'user',
          created_date: new Date(Date.now() - 4 * 60000).toISOString()
        },
        {
          id: 'mock3',
          conversation_id: conversationId,
          sender_id: conversation?.participant2_id || 'user2',
          sender_name: conversation?.participant2_name || 'Laura',
          message: `Perfecto, tengo uno disponible en Paseo de la Castellana. Son 4€ y me voy en 28 minutos`,
          read: true,
          message_type: 'user',
          created_date: new Date(Date.now() - 3.5 * 60000).toISOString()
        },
        {
          id: 'mock4',
          conversation_id: conversationId,
          sender_id: user?.id,
          sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
          message: `Genial, ¿cuál es exactamente la dirección?`,
          read: true,
          message_type: 'user',
          created_date: new Date(Date.now() - 3 * 60000).toISOString()
        },
        {
          id: 'mock5',
          conversation_id: conversationId,
          sender_id: conversation?.participant2_id || 'user2',
          sender_name: conversation?.participant2_name || 'Laura',
          message: `Paseo de la Castellana, 42, zona azul. Mi coche es un Opel Corsa gris, matrícula 9812 GHJ`,
          read: true,
          message_type: 'user',
          created_date: new Date(Date.now() - 2.5 * 60000).toISOString()
        },
        {
          id: 'mock6',
          conversation_id: conversationId,
          sender_id: user?.id,
          sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
          message: `Perfecto, estoy a 250 metros. Llego en 3 minutos`,
          read: true,
          message_type: 'user',
          created_date: new Date(Date.now() - 2 * 60000).toISOString()
        },
        {
          id: 'mock7',
          conversation_id: conversationId,
          sender_id: conversation?.participant2_id || 'user2',
          sender_name: conversation?.participant2_name || 'Laura',
          message: `Vale, aguanto aquí. Avísame cuando llegues`,
          read: true,
          message_type: 'user',
          created_date: new Date(Date.now() - 1.5 * 60000).toISOString()
        },
        {
          id: 'mock8',
          conversation_id: conversationId,
          sender_id: user?.id,
          sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
          message: `Ya estoy aquí, veo tu coche. Voy a hacer la reserva 👍`,
          read: false,
          message_type: 'user',
          created_date: new Date(Date.now() - 30000).toISOString()
        },
        {
          id: 'mock9',
          conversation_id: conversationId,
          sender_id: user?.id,
          sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
          message: `hola`,
          read: false,
          message_type: 'user',
          created_date: new Date(Date.now() - 5000).toISOString()
        }
        ];
      
      return mockMessages;
    },
    enabled: !!conversationId,
    refetchInterval: 3000
  });

  // Marcar mensajes como leídos
  useEffect(() => {
    if (!messages.length || !user?.id) return;
    
    const unreadMessages = messages.filter(m => m.receiver_id === user.id && !m.read);
    if (unreadMessages.length > 0) {
      unreadMessages.forEach(async (msg) => {
        await base44.entities.ChatMessage.update(msg.id, { read: true });
      });
      
      // Actualizar contador en conversación
      if (conversation) {
        const isP1 = conversation.participant1_id === user.id;
        const updateData = isP1 
          ? { unread_count_p1: 0 }
          : { unread_count_p2: 0 };
        base44.entities.Conversation.update(conversation.id, updateData);
      }
      
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  }, [messages, user?.id, conversation, queryClient]);



  // Enviar mensaje
  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      if (!conversation || !user?.id) {
        throw new Error('Conversation o user no disponibles');
      }

      const otherUserId = conversation.participant1_id === user?.id 
        ? conversation.participant2_id 
        : conversation.participant1_id;
      
      const newMsg = {
        conversation_id: conversationId,
        alert_id: conversation.alert_id,
        sender_id: user?.id,
        sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
        sender_photo: user?.photo_url,
        receiver_id: otherUserId,
        message: data.text,
        attachments: data.attachments.length > 0 ? JSON.stringify(data.attachments) : null,
        message_type: 'user',
        read: false
      };

      await base44.entities.ChatMessage.create(newMsg);

      const isP1 = conversation.participant1_id === user?.id;
      await base44.entities.Conversation.update(conversation.id, {
        last_message_text: data.text || `📎 ${data.attachments.length} archivo(s)`,
        last_message_at: new Date().toISOString(),
        [isP1 ? 'unread_count_p2' : 'unread_count_p1']: (isP1 ? conversation.unread_count_p2 : conversation.unread_count_p1) + 1
      });
    },
    onSuccess: () => {
      setNewMessage('');
      setAttachments([]);
      queryClient.invalidateQueries({ queryKey: ['chatMessages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      console.error('Error enviando mensaje:', error);
    }
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!conversation || !user?.id) {
      console.error('Conversation o user no disponibles');
      return;
    }
    sendMessageMutation.mutate({ text: newMessage, attachments });
    setAttachments([]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo es demasiado grande (máx. 10MB)');
        continue;
      }
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setAttachments(prev => [...prev, { name: file.name, type: file.type, url: file_url }]);
      } catch (error) {
        console.error('Error subiendo archivo:', error);
      }
    }
  };



  const handleTyping = () => {
    setIsTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  const isP1 = conversation?.participant1_id === user?.id;
  const otherUserName = isP1 ? conversation?.participant2_name : conversation?.participant1_name;
  const otherUserPhoto = isP1 ? conversation?.participant2_photo : conversation?.participant1_photo;

  // Calcular distancia
  const calculateDistance = () => {
    if (!user?.user_location || !alert?.latitude || !alert?.longitude) return null;
    
    const userLat = user.user_location?.latitude;
    const userLon = user.user_location?.longitude;
    
    if (!userLat || !userLon) return null;

    const R = 6371;
    const dLat = (alert.latitude - userLat) * Math.PI / 180;
    const dLon = (alert.longitude - userLon) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLat * Math.PI / 180) * Math.cos(alert.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;
    
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
  };

  const distance = calculateDistance();

  const formatPlate = (plate) => {
    if (!plate) return 'XXXX XXX';
    const cleaned = plate.replace(/\s/g, '').toUpperCase();
    if (cleaned.length >= 4) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    }
    return cleaned;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header showBackButton={true} backTo="Chats" />
      <ChatMessages messages={messages} user={user} />
      <ChatInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        attachments={attachments}
        setAttachments={setAttachments}
        onSendMessage={handleSendMessage}
        onFileSelect={handleFileSelect}
        isPending={sendMessageMutation.isPending}
        handleTyping={handleTyping}
        handleKeyPress={handleKeyPress}
      />
      <BottomNav />
    </div>
  );
}