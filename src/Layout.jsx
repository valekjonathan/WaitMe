import React, { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { demoFlow } from '@/lib/demoFlow';

// NO metas AuthProvider aquí.
// El provider debe vivir una sola vez (normalmente en src/App.jsx).
export default function Layout({ children }) {
  useEffect(() => {
    // Iniciar notificaciones automáticas cada 20 segundos
    demoFlow.startAutoNotifications(20000);

    const onDemoToast = (e) => {
      const title = e?.detail?.title;
      const description = e?.detail?.description;
      const notificationData = e?.detail?.notificationData;
      
      if (!title && !description) return;
      
      toast({
        title: title || 'Notificación',
        description: description || '',
        createNotificationOnClose: true,
        notificationData: notificationData || {
          type: 'reservation_request',
          sender_name: title?.split(' ')[0] || 'Usuario',
          amount: 5
        }
      });
    };

    const onToastClosed = (e) => {
      // Cuando se cierra un toast, crear notificación en el sistema
      const data = e?.detail || {};
      demoFlow.createNotification(data);
    };

    window.addEventListener('waitme:demoToast', onDemoToast);
    window.addEventListener('waitme:toastClosed', onToastClosed);
    
    return () => {
      window.removeEventListener('waitme:demoToast', onDemoToast);
      window.removeEventListener('waitme:toastClosed', onToastClosed);
      demoFlow.stopAutoNotifications();
    };
  }, []);

  return <>{children}</>;
}