import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

// Motor de simulación: genera actividad constante en la app
export default function SimulationEngine({ user, enabled = true }) {
  const queryClient = useQueryClient();
  const cycleRef = useRef(0);
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (!enabled || !user?.id || isRunningRef.current) return;
    
    isRunningRef.current = true;
    
    const simulationCycle = async () => {
      cycleRef.current += 1;
      const cycle = cycleRef.current;
      
      try {
        // CICLO 1: Completar alerta de Laura y crear notificación de pago
        if (cycle === 1) {
          const alerts = await base44.entities.ParkingAlert.list();
          const lauraAlert = alerts?.find(a => 
            a.reserved_by_name?.toLowerCase().includes('laura') && 
            a.status === 'reserved'
          );
          
          if (lauraAlert) {
            await base44.entities.ParkingAlert.update(lauraAlert.id, {
              status: 'completed'
            });
            
            await base44.entities.Notification.create({
              type: 'payment_completed',
              recipient_id: lauraAlert.user_id,
              recipient_email: lauraAlert.user_email,
              sender_id: lauraAlert.reserved_by_id,
              sender_name: lauraAlert.reserved_by_name || 'Laura',
              sender_photo: 'https://randomuser.me/api/portraits/women/44.jpg',
              alert_id: lauraAlert.id,
              amount: lauraAlert.price,
              read: false,
              status: 'completed'
            });
            
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        }
        
        // CICLO 2: Nueva solicitud de reserva de CARLOS
        if (cycle === 2) {
          const activeAlerts = await base44.entities.ParkingAlert.filter({
            user_id: user.id,
            status: 'active'
          });
          
          if (activeAlerts?.[0]) {
            const alert = activeAlerts[0];
            
            await base44.entities.Notification.create({
              type: 'reservation_request',
              recipient_id: user.id,
              recipient_email: user.email,
              sender_id: 'sim_carlos',
              sender_name: 'CARLOS',
              sender_photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
              alert_id: alert.id,
              amount: alert.price,
              read: false,
              status: 'pending'
            });
            
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        }
        
        // CICLO 3: Nueva solicitud de SOFIA
        if (cycle === 3) {
          const activeAlerts = await base44.entities.ParkingAlert.filter({
            user_id: user.id,
            status: 'active'
          });
          
          if (activeAlerts?.[0]) {
            const alert = activeAlerts[0];
            
            await base44.entities.Notification.create({
              type: 'reservation_request',
              recipient_id: user.id,
              recipient_email: user.email,
              sender_id: 'sim_sofia',
              sender_name: 'SOFIA',
              sender_photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
              alert_id: alert.id,
              amount: alert.price,
              read: false,
              status: 'pending'
            });
            
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        }
        
        // CICLO 4: Mensaje nuevo en chat de Marta
        if (cycle === 4) {
          const conversations = await base44.entities.Conversation.list();
          const demoConv = conversations?.find(c => 
            c.participant2_name === 'Marta' || c.participant1_name === 'Marta'
          );
          
          if (demoConv) {
            await base44.entities.ChatMessage.create({
              conversation_id: demoConv.id,
              sender_id: demoConv.participant2_id || 'marta',
              sender_name: 'Marta',
              sender_photo: 'https://randomuser.me/api/portraits/women/65.jpg',
              receiver_id: user.id,
              message: '¡Ya estoy aquí! ¿Dónde estás tú?',
              read: false,
              message_type: 'user'
            });
            
            await base44.entities.Conversation.update(demoConv.id, {
              last_message_text: '¡Ya estoy aquí! ¿Dónde estás tú?',
              last_message_at: new Date().toISOString()
            });
            
            queryClient.invalidateQueries({ queryKey: ['unreadMessages'] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
          }
        }
        
        // CICLO 5: Comprador cerca (buyer_nearby)
        if (cycle === 5) {
          const reservedByMe = await base44.entities.ParkingAlert.filter({
            reserved_by_id: user.id,
            status: 'reserved'
          });
          
          if (reservedByMe?.[0]) {
            const alert = reservedByMe[0];
            
            await base44.entities.Notification.create({
              type: 'buyer_nearby',
              recipient_id: alert.user_id,
              recipient_email: alert.user_email,
              sender_id: user.id,
              sender_name: user.display_name || user.full_name?.split(' ')[0] || 'Usuario',
              sender_photo: user.photo_url,
              alert_id: alert.id,
              read: false,
              status: 'pending'
            });
            
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        }
        
        // CICLO 6: Reserva aceptada
        if (cycle === 6) {
          const myNotifications = await base44.entities.Notification.filter({
            recipient_id: user.id,
            type: 'reservation_request',
            status: 'pending'
          });
          
          if (myNotifications?.[0]) {
            const notif = myNotifications[0];
            
            await base44.entities.Notification.update(notif.id, {
              status: 'accepted'
            });
            
            // Crear notificación de aceptación para el solicitante
            await base44.entities.Notification.create({
              type: 'reservation_accepted',
              recipient_id: notif.sender_id,
              sender_id: user.id,
              sender_name: user.display_name || user.full_name?.split(' ')[0] || 'Usuario',
              sender_photo: user.photo_url,
              alert_id: notif.alert_id,
              amount: notif.amount,
              read: false,
              status: 'completed'
            });
            
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        }
        
        // CICLO 7: Nueva alerta demo disponible
        if (cycle === 7) {
          // Solo crear demo alert si no tiene alertas activas
          const activeAlerts = await base44.entities.ParkingAlert.filter({
            user_id: user.id,
            status: 'active'
          });
          
          if (!activeAlerts?.length) {
            console.log('📢 Sugerencia: Puedes crear una nueva alerta desde "Estoy aparcado aquí"');
          }
        }
        
        // CICLO 8: Mensaje de otro usuario
        if (cycle === 8) {
          const conversations = await base44.entities.Conversation.list();
          const anyConv = conversations?.[0];
          
          if (anyConv) {
            const otherUserId = anyConv.participant1_id === user.id 
              ? anyConv.participant2_id 
              : anyConv.participant1_id;
            const otherUserName = anyConv.participant1_id === user.id 
              ? anyConv.participant2_name 
              : anyConv.participant1_name;
            const otherUserPhoto = anyConv.participant1_id === user.id 
              ? anyConv.participant2_photo 
              : anyConv.participant1_photo;
            
            await base44.entities.ChatMessage.create({
              conversation_id: anyConv.id,
              sender_id: otherUserId,
              sender_name: otherUserName,
              sender_photo: otherUserPhoto,
              receiver_id: user.id,
              message: '¿Sigues disponible? 🚗',
              read: false,
              message_type: 'user'
            });
            
            queryClient.invalidateQueries({ queryKey: ['unreadMessages'] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
          }
        }
        
        // CICLO 9: Reserva rechazada (para mostrar esa pantalla también)
        if (cycle === 9) {
          const myNotifications = await base44.entities.Notification.filter({
            recipient_id: user.id,
            type: 'reservation_request',
            status: 'pending'
          });
          
          const pendingNotif = myNotifications?.find(n => n.sender_name !== 'CARLOS');
          
          if (pendingNotif) {
            await base44.entities.Notification.update(pendingNotif.id, {
              status: 'rejected'
            });
            
            await base44.entities.Notification.create({
              type: 'reservation_rejected',
              recipient_id: pendingNotif.sender_id,
              sender_id: user.id,
              sender_name: user.display_name || user.full_name?.split(' ')[0] || 'Usuario',
              sender_photo: user.photo_url,
              alert_id: pendingNotif.alert_id,
              read: false,
              status: 'completed'
            });
            
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        }
        
      } catch (err) {
        console.log('Error en ciclo de simulación:', err);
      }
    };
    
    // Ejecutar primer ciclo inmediatamente
    setTimeout(() => simulationCycle(), 1000);
    
    // Luego cada 10 segundos
    const interval = setInterval(() => {
      simulationCycle();
    }, 10000);
    
    return () => {
      clearInterval(interval);
      isRunningRef.current = false;
    };
  }, [enabled, user?.id, queryClient]);
  
  return null;
}