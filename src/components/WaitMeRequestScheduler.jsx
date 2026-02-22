import { useEffect, useRef } from 'react';
import { upsertWaitMeRequest } from '@/lib/waitmeRequests';
import { MOCK_USERS } from '@/lib/mockNearby';
import { addDemoAlert, addIncomingWaitMeConversation } from '@/components/DemoFlowManager';
import { base44 } from '@/api/base44Client';

// Dispara 30s DESPUÉS de que el usuario publica su alerta (evento 'waitme:alertPublished').
// Solo UNA vez por sesión. Crea entrada en Notifications, tarjeta en Chats y abre el modal.
export default function WaitMeRequestScheduler() {
  const timerRef = useRef(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const KEY = 'waitme_incoming_fired_v2';
    try {
      if (window?.sessionStorage?.getItem(KEY) === '1') {
        firedRef.current = true;
      }
    } catch {}

    const onAlertPublished = (e) => {
      if (firedRef.current) return;
      const alertId = e?.detail?.alertId || null;

      timerRef.current = setTimeout(async () => {
        try {
          firedRef.current = true;
          try { window?.sessionStorage?.setItem(KEY, '1'); } catch {}

          const buyer = MOCK_USERS[0];

          const req = {
            id: `req_${Date.now()}`,
            type: 'incoming_waitme_request',
            title: 'Usuario quiere tu WaitMe!',
            createdAt: Date.now(),
            status: 'pending',
            alertId,
            buyer: {
              id: buyer.id,
              name: buyer.name,
              photo: buyer.photo,
              vehicle_type: buyer.vehicle_type,
              car_model: buyer.car_model,
              car_color: buyer.car_color,
              plate: buyer.plate,
              phone: buyer.phone
            }
          };

          upsertWaitMeRequest(req);

          try {
            const alert = await base44.entities.ParkingAlert.get(alertId);
            if (alert) addDemoAlert(alert);
          } catch {}

          addIncomingWaitMeConversation(alertId, req.buyer);

          try {
            window.dispatchEvent(new CustomEvent('waitme:showIncomingRequestModal', { detail: { request: req } }));
          } catch {}
          try {
            window.dispatchEvent(new Event('waitme:showIncomingBanner'));
          } catch {}
        } catch {}
      }, 30_000);
    };

    window.addEventListener('waitme:alertPublished', onAlertPublished);

    return () => {
      window.removeEventListener('waitme:alertPublished', onAlertPublished);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return null;
}