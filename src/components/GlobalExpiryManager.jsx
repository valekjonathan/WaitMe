import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

// Global: detecta expiración de TU alerta activa y muestra el popup estés donde estés.
// - No toca layouts ni márgenes de pantallas.
// - Sincroniza: Activas -> Finalizadas + badge del menú (evento waitme:badgeRefresh)
// - Lanza toast tipo WhatsApp (evento waitme:toast)
export default function GlobalExpiryManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [nowTs, setNowTs] = useState(() => Date.now());
  const [open, setOpen] = useState(false);
  const [alert, setAlert] = useState(null);

  const promptedRef = useRef(new Set());

  useEffect(() => {
    const t = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const { data: myAlerts = [] } = useQuery({
    queryKey: ['myAlerts'],
    enabled: true,
    staleTime: 15000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
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

  const activeAlert = useMemo(() => {
    const list = (myAlerts || []).filter((a) => {
      const st = String(a?.status || '').toLowerCase();
      return st === 'active'; // reservada no expira por este flujo
    });
    if (list.length === 0) return null;
    const sorted = [...list].sort((a, b) => {
      const ta = toMs(a?.created_date) || toMs(a?.created_at) || 0;
      const tb = toMs(b?.created_date) || toMs(b?.created_at) || 0;
      return tb - ta;
    });
    return sorted[0] || null;
  }, [myAlerts]);

  useEffect(() => {
    if (!activeAlert) return;

    const id = String(activeAlert.id || '');
    if (!id) return;
    if (promptedRef.current.has(id)) return;

    const createdTs = getCreatedTs(activeAlert);
    const waitUntilTs = getWaitUntilTs(activeAlert);

    if (!createdTs || !waitUntilTs) return;

    if (nowTs >= waitUntilTs) {
      promptedRef.current.add(id);
      setAlert(activeAlert);
      setOpen(true);

      // Toast tipo WhatsApp
      try {
        window.dispatchEvent(
          new CustomEvent('waitme:toast', {
            detail: {
              id: `expire-${id}`,
              fromName: 'WaitMe!',
              text: 'Tu alerta ha expirado'
            }
          })
        );
      } catch {}
    }
  }, [activeAlert, nowTs]);

  const acceptExpire = async () => {
    const a = alert;
    if (!a?.id) return;

    try {
      await base44.entities.ParkingAlert.update(a.id, { status: 'expired' });
    } catch {}

    setOpen(false);
    setAlert(null);

    // refrescar UI + badge simultáneo
    queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
    queryClient.invalidateQueries();
    try {
      window.dispatchEvent(new Event('waitme:badgeRefresh'));
    } catch {}
  };

  if (!alert) return null;

  const createdTs = getCreatedTs(alert) || Date.now();
  const waitUntilTs = getWaitUntilTs(alert);
  const waitUntilLabel = waitUntilTs
    ? new Date(waitUntilTs).toLocaleTimeString('es-ES', {
        timeZone: 'Europe/Madrid',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    : '--:--';

  const createdLabel = new Date(createdTs).toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setAlert(null);
      }}
    >
      <DialogContent
        hideClose
        className="bg-gray-900 border border-gray-800 text-white max-w-sm border-t-2 border-b-2 border-purple-500 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex justify-center mb-3">
          <div className="px-4 py-2 rounded-lg bg-purple-700/60 border border-purple-500/60">
            <span className="text-white font-semibold text-sm">Tu alerta ha expirado</span>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-3 border-2 border-purple-500/50">
          <div className="flex items-center justify-between mb-2">
            <div className="px-3 py-1 rounded-full bg-purple-700/60 border border-purple-500/60 text-xs font-bold text-white">
              Expirada
            </div>
            <span className="text-white text-xs">{createdLabel}</span>
          </div>

          <div className="border-t border-gray-700/80 mb-2" />

          <div className="flex items-start gap-1.5 text-xs mb-2">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
            <span className="text-white leading-5">{String(alert?.address || 'Ubicación marcada')}</span>
          </div>

          <div className="flex items-start gap-1.5 text-xs">
            <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
            <span className="text-white leading-5">Te vas en {alert?.available_in_minutes} min · </span>
            <span className="text-purple-400 leading-5">Debes esperar hasta las: </span>
            <span className="text-white font-extrabold text-[17px] leading-5">{waitUntilLabel}</span>
          </div>

          <div className="mt-3 flex justify-center">
            <div className="px-5 py-2 rounded-full bg-purple-700/60 border border-purple-500/60 text-white text-xs font-extrabold">
              EXPIRADA
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-center gap-3 mt-4">
          <Button
            onClick={acceptExpire}
            className="w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700"
          >
            Aceptar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toMs(v) {
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : null;
}

function getCreatedTs(a) {
  return (
    toMs(a?.created_date) ||
    toMs(a?.created_at) ||
    toMs(a?.createdAt) ||
    toMs(a?.created) ||
    null
  );
}

function getWaitUntilTs(a) {
  const createdTs = getCreatedTs(a);
  const mins = Number(a?.available_in_minutes ?? a?.minutes ?? 0);
  if (!createdTs || !mins) return null;
  return createdTs + mins * 60 * 1000;
}
