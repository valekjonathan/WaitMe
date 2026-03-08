import { useEffect, useRef } from 'react';
import { upsertWaitMeRequest } from '@/lib/waitmeRequests';
import { MOCK_USERS } from '@/lib/mockNearby';
import { addDemoAlert, addIncomingWaitMeConversation } from '@/components/DemoFlowManager';
import * as alerts from '@/data/alerts';

// Dispara la petición demo SOLO 30 segundos después de que el usuario publique una alerta.
export default function WaitMeRequestScheduler() {
  const timerRef = useRef(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const handleAlertPublished = (e) => {
      // Solo disparar una vez por sesión
      if (firedRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);

      const publishedAlertId = e?.detail?.alertId || null;

      timerRef.current = setTimeout(async () => {
        if (firedRef.current) return;

        // Guard: only fire if the published alert is still active
        if (publishedAlertId) {
          try {
            const { data: a } = await alerts.getAlert(publishedAlertId);
            const st = String(a?.status || '').toLowerCase();
            if (st !== 'active' && st !== 'reserved') return; // alert was cancelled/expired
          } catch (error) {
            console.error('[WaitMe Error]', error);
          }
        }

        firedRef.current = true;

        try {
          const buyer = MOCK_USERS[0];

          // Intentar usar la alerta real recién publicada
          let alertData = null;
          if (publishedAlertId) {
            try {
              alertData = (await alerts.getAlert(publishedAlertId)).data;
            } catch (error) {
              console.error('[WaitMe Error]', error);
            }
          }

          if (!alertData) {
            alertData = {
              id: publishedAlertId || 'demo_1',
              address: 'Calle Uría, Oviedo',
              available_in_minutes: 6,
              price: 3,
              latitude: 43.3629,
              longitude: -5.8488,
              created_date: new Date().toISOString(),
            };
          }

          addDemoAlert(alertData);

          const req = {
            id: `req_${Date.now()}`,
            type: 'incoming_waitme_request',
            title: 'Usuario quiere tu WaitMe!',
            createdAt: Date.now(),
            status: 'pending',
            alertId: alertData.id,
            buyer: {
              id: buyer.id,
              name: buyer.name,
              photo: buyer.photo,
              vehicle_type: buyer.vehicle_type,
              model: buyer.model,
              color: buyer.color,
              plate: buyer.plate,
              phone: buyer.phone,
            },
          };

          upsertWaitMeRequest(req);
          addIncomingWaitMeConversation(alertData.id, req.buyer);

          window.dispatchEvent(
            new CustomEvent('waitme:showIncomingRequestModal', {
              detail: { request: req, alert: alertData },
            })
          );
          window.dispatchEvent(new Event('waitme:showIncomingBanner'));
        } catch (error) {
          console.error('[WaitMe Error]', error);
        }
      }, 30_000);
    };

    window.addEventListener('waitme:alertPublished', handleAlertPublished);

    return () => {
      window.removeEventListener('waitme:alertPublished', handleAlertPublished);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return null;
}
