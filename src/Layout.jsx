import React, { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

// NO metas AuthProvider aquí.
// El provider debe vivir una sola vez (normalmente en src/App.jsx).
export default function Layout({ children }) {
  useEffect(() => {
    const onDemoToast = (e) => {
      const title = e?.detail?.title;
      const description = e?.detail?.description;
      if (!title && !description) return;
      toast({
        title: title || 'Notificación',
        description: description || '',
      });
    };

    window.addEventListener('waitme:demoToast', onDemoToast);
    return () => window.removeEventListener('waitme:demoToast', onDemoToast);
  }, []);

  return <>{children}</>;
}