import React, { useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Euro } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

/**
 * Manager GLOBAL de expiración:
 * - Detecta cuándo tu alerta activa llega a 0 y muestra la pantalla "Tu alerta ha expirado" estés donde estés.
 * - Al aceptar: marca la alerta como 'expired', refresca datos y quita la bolita del menú a la vez.
 */
export default function AlertExpiryManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Marca global para evitar dobles manejos (History también tiene lógica legacy)
  useEffect(() => {
    if (typeof window !== 'undefined') window.__WAITME_EXPIRY_MANAGER__ = true;
  }, []);

  const { data: myAlerts = [], isFetched } = useQuery({
    queryKey: ['myAlerts'],
    enabled: true,
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const uid = user?.id;
      const email = user?.email;
      if (!uid && !email) return [];

      let mine = [];
      if (uid) mine = await base44.entities.ParkingAlert.filter({ user_id: uid });
      else mine = await base44.entities.ParkingAlert.filter({ user_email: email });

      return (mine || []).slice();
    }
  });

  const [nowTs, setNowTs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const toMs = (d) => {
    const n = d ? new Date(d).getTime() : 0;
    return Number.isFinite(n) ? n : 0;
  };

  const getCreatedTs = (a) =>
    toMs(a?.created_date) || toMs(a?.createdAt) || toMs(a?.created_ts) || 0;

  const getWaitUntilTs = (a) => {
    const created = getCreatedTs(a);
    const mins = Number(a?.available_in_minutes ?? a?.availableMinutes ?? 0);
    if (!created || !mins) return 0;
    return created + mins * 60 * 1000;
  };

  const activeAlerts = useMemo(() => {
    return (myAlerts || []).filter((a) => {
      const st = String(a?.status || '').toLowerCase();
      return st === 'active' || st === 'reserved';
    });
  }, [myAlerts]);

  const alreadyPromptedRef = useRef(new Set());

  const [expirePromptOpen, setExpirePromptOpen] = useState(false);
  const [expirePromptAlert, setExpirePromptAlert] = useState(null);

  const expireAlertMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.ParkingAlert.update(id, { status: 'expired' });
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
      window.dispatchEvent(new Event('waitme:badgeRefresh'));
    }
  });

  useEffect(() => {
    if (!isFetched) return;
    if (!activeAlerts?.length) return;

    const toExpire = activeAlerts.filter((a) => {
      if (!a?.id) return false;
      if (alreadyPromptedRef.current.has(a.id)) return false;

      const waitUntil = getWaitUntilTs(a);
      if (!waitUntil) return false;

      const remainingMs = Math.max(0, waitUntil - nowTs);
      return remainingMs === 0;
    });

    if (!toExpire.length) return;

    // La app permite 1 alerta activa; si hay varias por datos, priorizamos la más reciente
    const sorted = toExpire
      .slice()
      .sort((a, b) => (getCreatedTs(b) || 0) - (getCreatedTs(a) || 0));

    const mine = sorted[0];
    alreadyPromptedRef.current.add(mine.id);

    setExpirePromptAlert(mine);
    setExpirePromptOpen(true);

    // Toast tipo WhatsApp
    window.dispatchEvent(
      new CustomEvent('waitme:toast', {
        detail: {
          title: 'WaitMe!',
          text: 'Tu alerta ha expirado'
        }
      })
    );
  }, [activeAlerts, isFetched, nowTs]);

  const formatHHMM = (ts) => {
    if (!ts) return '--:--';
    return new Date(ts).toLocaleTimeString('es-ES', {
      timeZone: 'Europe/Madrid',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const priceText = (a) => {
    const p = Number(a?.price ?? 0);
    if (!Number.isFinite(p)) return '';
    return String(Math.round(p));
  };

  const addressText = (a) => (a?.address ? String(a.address) : 'Ubicación marcada');

  const minsText = (a) => {
    const m = Number(a?.available_in_minutes ?? 0);
    return Number.isFinite(m) && m > 0 ? String(m) : '';
  };

  const waitUntilLabel = useMemo(() => formatHHMM(getWaitUntilTs(expirePromptAlert)), [expirePromptAlert]);

  return (
    <Dialog open={expirePromptOpen} onOpenChange={() => {}}>
      <DialogContent
        hideClose
        className="bg-gray-900 border border-gray-800 text-white max-w-sm border-t-2 border-b-2 border-purple-500 max-h-[85vh] overflow-y-auto data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0"
      >
        <div className="flex justify-center mb-3">
          <div className="px-4 py-2 rounded-lg bg-purple-700/60 border border-purple-500/60">
            <span className="text-white font-semibold text-sm">Tu alerta ha expirado</span>
          </div>
        </div>

        {expirePromptAlert ? (
          <div className="bg-gray-900 rounded-xl p-3 border-2 border-purple-500/50">
            <div className="flex items-center justify-between">
              <div className="px-3 py-1 rounded-lg bg-purple-700/60 border border-purple-500/60">
                <span className="text-white text-xs font-semibold">Expirada</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Euro className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-semibold">{priceText(expirePromptAlert)}€</span>
              </div>
            </div>

            <div className="border-t border-gray-700/80 my-2" />

            <div className="flex items-start gap-1.5 text-xs mb-2">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
              <span className="text-white leading-5">{addressText(expirePromptAlert)}</span>
            </div>

            <div className="flex items-start gap-1.5 text-xs">
              <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
              <span className="text-white leading-5">
                Te vas en {minsText(expirePromptAlert)} min ·
              </span>
              <span className="text-purple-400 leading-5"> Debes esperar hasta las </span>
              <span className="text-white font-extrabold text-[15px] leading-5">{waitUntilLabel}</span>
            </div>

            <div className="mt-3 flex justify-center">
              <div className="px-4 py-2 rounded-lg bg-purple-700/60 border border-purple-500/60">
                <span className="text-white font-semibold text-sm">EXPIRADA</span>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter className="flex flex-row items-center justify-center gap-3 mt-4">
          <Button
            onClick={() => {
              if (!expirePromptAlert?.id) return;
              expireAlertMutation.mutate(expirePromptAlert.id);
              setExpirePromptOpen(false);
              setExpirePromptAlert(null);
            }}
            className="w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700"
          >
            Aceptar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
