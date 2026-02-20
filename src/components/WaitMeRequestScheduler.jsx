// ================================
// FILE: src/components/WaitMeRequestScheduler.jsx
// ================================
import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { upsertWaitMeRequest } from '@/lib/waitmeRequests';
import { MOCK_USERS } from '@/lib/mockNearby';

// A los 30s de abrir la app: crea 1 petición "Usuario quiere tu WaitMe!"
export default function WaitMeRequestScheduler() {
  const { user } = useAuth();

  useEffect(() => {
    // Solo 1 vez por apertura de app (session)
    const KEY = 'waitme_incoming_fired_v1';
    try {
      if (window?.sessionStorage?.getItem(KEY) === '1') return;
      window?.sessionStorage?.setItem(KEY, '1');
    } catch {}

    const t = setTimeout(async () => {
      try {
        // busca tu alerta activa para “rellenar” al aceptar
        let activeAlertId = null;
        const uid = user?.id;
        const email = user?.email;

        if (uid || email) {
          const mine = uid
            ? await base44.entities.ParkingAlert.filter({ user_id: uid })
            : await base44.entities.ParkingAlert.filter({ user_email: email });

          const active = (mine || []).find((a) => {
            const st = String(a?.status || '').toLowerCase();
            return st === 'active';
          });

          activeAlertId = active?.id || null;
        }

        // eligimos un usuario mock fijo (el primero)
        const buyer = MOCK_USERS[0];

        const req = {
          id: `req_${Date.now()}`,
          type: 'incoming_waitme_request',
          title: 'Usuario quiere tu WaitMe!',
          createdAt: Date.now(),
          status: 'pending',
          alertId: activeAlertId,
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

        try { window.dispatchEvent(new Event('waitme:showIncomingBanner')); } catch {}
      } catch {
        // si falla, no rompe la app
      }
    }, 30_000);

    return () => clearTimeout(t);
  }, [user?.id, user?.email]);

  return null;
}
