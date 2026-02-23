import { useEffect, useRef } from 'react';
import { upsertWaitMeRequest } from '@/lib/waitmeRequests';
import { MOCK_USERS } from '@/lib/mockNearby';
import { addDemoAlert, addIncomingWaitMeConversation } from '@/components/DemoFlowManager';
import { base44 } from '@/api/base44Client';

// Dispara la alerta demo a los 30s exactos de montar la app (usuario en Home).
// Sin sessionStorage: timer único al entrar.
export default function WaitMeRequestScheduler() {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(async () => {
      try {
        const alertId = 'demo_1';
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

        let alert = null;
        try {
          alert = await base44.entities.ParkingAlert.get(alertId);
          if (alert) addDemoAlert(alert);
        } catch {}
        if (!alert) {
          alert = {
            id: alertId,
            address: 'Calle Uría, Oviedo',
            available_in_minutes: 6,
            price: 3,
            latitude: 43.3629,
            longitude: -5.8488,
            created_date: new Date().toISOString()
          };
          addDemoAlert(alert);
        }

        addIncomingWaitMeConversation(alertId, req.buyer);

        try {
          window.dispatchEvent(new CustomEvent('waitme:showIncomingRequestModal', { detail: { request: req, alert } }));
        } catch {}
        try {
          window.dispatchEvent(new Event('waitme:showIncomingBanner'));
        } catch {}
      } catch {}
    }, 30_000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return null;
}
