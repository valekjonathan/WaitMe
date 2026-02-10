import React, { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import DemoFlowManager, { demoFlow } from '@/components/DemoFlowManager';

// NO metas AuthProvider aquí.
// El provider debe vivir una sola vez (normalmente en src/App.jsx).
export default function Layout({ children }) {
  useEffect(() => {
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

    window.addEventListener('waitme:demoToast', onDemoToast);
    
    return () => {
      window.removeEventListener('waitme:demoToast', onDemoToast);
    };
  }, []);

  return (
    <>
      <DemoFlowManager />
      {children}
    </>
  );
}