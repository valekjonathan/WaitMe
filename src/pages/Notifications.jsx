import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Bell, Check, X, Clock, MessageCircle, Navigation } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STORAGE_KEY = 'waitme_demo_notifications_v1';

function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch { return fallback; }
}

function nowISO() {
  return new Date().toISOString();
}

function seedDemoNotifications() {
  return [
    {
      id: 'n1',
      type: 'reservation_request',
      title: 'Marco quiere reservar',
      body: 'Solicitud para tu alerta (te reservó).',
      user: { id: 'buyer_marco', name: 'Marco', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop' },
      alertId: 'demo_alert_seller',
      conversationId: 'mock_seller_conv',
      createdAt: nowISO(),
      read: false,
      decision: null
    },
    {
      id: 'n2',
      type: 'payment_completed',
      title: 'Pago completado de Sofía',
      body: 'Tu reserva está confirmada.',
      user: { id: 'seller_sofia', name: 'Sofía', photo: 'https://randomuser.me/api/portraits/women/68.jpg' },
      alertId: 'demo_alert_buyer',
      conversationId: 'mock_buyer_conv',
      createdAt: nowISO(),
      read: false
    }
  ];
}

function loadDemoNotifications() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const list = safeParse(raw, null);
  if (Array.isArray(list) && list.length) return list;
  const seeded = seedDemoNotifications();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveDemoNotifications(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function setDemoAlertStatus(alertId, status) {
  if (!alertId) return;
  localStorage.setItem(`waitme_demo_alert_status_${alertId}`, String(status || ''));
}

export default function Notifications() {
  const navigate = useNavigate();
  const location = useLocation();
  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const demoMode = urlParams.get('demo') === 'true';

  const [items, setItems] = useState(() => (demoMode ? loadDemoNotifications() : []));

  useEffect(() => {
    if (demoMode) setItems(loadDemoNotifications());
  }, [demoMode]);

  const markRead = (id) => {
    setItems((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveDemoNotifications(next);
      return next;
    });
  };

  const pushLog = (log) => {
    setItems((prev) => {
      const next = [{ ...log, id: `log_${Date.now()}`, createdAt: nowISO(), read: false }, ...prev];
      saveDemoNotifications(next);
      return next;
    });
  };

  const decide = (n, decision) => {
    // decision: 'accept' | 'reject' | 'think'
    const statusByDecision = { accept: 'accepted', reject: 'rejected', think: 'me_lo_pienso' };
    setDemoAlertStatus(n.alertId, statusByDecision[decision]);

    setItems((prev) => {
      const next = prev.map((x) => (x.id === n.id ? { ...x, read: true, decision } : x));
      saveDemoNotifications(next);
      return next;
    });

    const actionText =
      decision === 'accept' ? 'Aceptaste' : decision === 'reject' ? 'Rechazaste' : 'Me lo pienso';
    pushLog({
      type: 'log',
      title: `${actionText}: ${n.user?.name || 'Usuario'}`,
      body: `Acción aplicada a la alerta ${n.alertId}.`,
      user: n.user,
      alertId: n.alertId,
      conversationId: n.conversationId
    });

    // Si aceptas o "me lo pienso", te llevo al chat de ese usuario (para que veas el nombre/foto)
    if (decision === 'accept' || decision === 'think') {
      const demo = demoMode ? 'demo=true&' : '';
      const otherName = encodeURIComponent(n.user?.name || '');
      const otherPhoto = encodeURIComponent(n.user?.photo || '');
      navigate(createPageUrl(`Chat?${demo}conversationId=${encodeURIComponent(n.conversationId)}&otherName=${otherName}&otherPhoto=${otherPhoto}`));
    }
  };

  const openChat = (n) => {
    const demo = demoMode ? 'demo=true&' : '';
    const otherName = encodeURIComponent(n.user?.name || '');
    const otherPhoto = encodeURIComponent(n.user?.photo || '');
    navigate(createPageUrl(`Chat?${demo}conversationId=${encodeURIComponent(n.conversationId)}&otherName=${otherName}&otherPhoto=${otherPhoto}`));
  };

  const visible = demoMode ? items : [];

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Notificaciones" showBackButton={false} />
      <div className="px-4 pt-4 pb-24">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/60">
            <Bell className="w-10 h-10 mb-4 text-white/20" />
            <div className="text-lg font-semibold">Sin notificaciones</div>
            <div className="text-sm">Aquí verás las solicitudes de reserva</div>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((n) => (
              <div
                key={n.id}
                className={`rounded-xl border border-white/10 bg-white/5 p-3 ${n.read ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold truncate">{n.title}</div>
                      {!n.read && <Badge className="bg-purple-600">Nuevo</Badge>}
                      {n.type === 'log' && <Badge variant="outline">Historial</Badge>}
                    </div>
                    <div className="mt-1 text-sm text-white/70">{n.body}</div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-white/50">
                      <Clock className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <button
                    className="shrink-0 rounded-md border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10"
                    onClick={() => markRead(n.id)}
                    aria-label="Marcar como leído"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {n.type === 'reservation_request' && !n.decision && (
                    <>
                      <Button className="bg-green-600 hover:bg-green-700" onClick={() => decide(n, 'accept')}>
                        <Check className="w-4 h-4 mr-2" /> Aceptar
                      </Button>
                      <Button className="bg-red-600 hover:bg-red-700" onClick={() => decide(n, 'reject')}>
                        <X className="w-4 h-4 mr-2" /> Rechazar
                      </Button>
                      <Button className="bg-white/10 hover:bg-white/20" onClick={() => decide(n, 'think')}>
                        Me lo pienso
                      </Button>
                    </>
                  )}

                  {(n.type === 'payment_completed' || n.type === 'log' || (n.type === 'reservation_request' && n.decision)) && (
                    <>
                      <Button className="bg-white/10 hover:bg-white/20" onClick={() => openChat(n)}>
                        <MessageCircle className="w-4 h-4 mr-2" /> Abrir chat
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
