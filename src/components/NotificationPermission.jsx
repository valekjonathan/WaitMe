import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationPermission({ user }) {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    if (!user) return;

    // Check if browser supports notifications
    if (!('Notification' in window)) {
      return;
    }

    const currentPermission = Notification.permission;
    setPermission(currentPermission);

    // Show banner if permission is default and user hasn't dismissed it
    const dismissed = localStorage.getItem('push-notification-dismissed');
    if (currentPermission === 'default' && !dismissed) {
      setTimeout(() => setShow(true), 3000);
    }
  }, [user]);

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        setShow(false);
        // Here you would subscribe to push notifications
        new Notification('¡Notificaciones activadas!', {
          body: 'Recibirás alertas sobre tus reservas de parking',
          icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png'
        });
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('push-notification-dismissed', 'true');
  };

  if (!show || permission !== 'default') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-20 left-4 right-4 z-50 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-4 border border-purple-500"
      >
        <button
          onClick={dismiss}
          className="absolute top-2 right-2 text-white/80 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="bg-white/20 rounded-full p-2">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-sm mb-1">
              Activa las notificaciones
            </h3>
            <p className="text-white/90 text-xs mb-3">
              Recibe alertas sobre nuevas reservas y cambios en tus alertas
            </p>
            <Button
              onClick={requestPermission}
              size="sm"
              className="bg-white text-purple-600 hover:bg-white/90 h-8 text-xs font-semibold"
            >
              Activar notificaciones
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}