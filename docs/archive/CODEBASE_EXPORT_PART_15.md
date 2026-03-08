
================================================================
FILE: src/pages/Notifications.jsx
================================================================
```jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as alerts from '@/data/alerts';
import { useAuth } from '@/lib/AuthContext';
import { getWaitMeRequests, setWaitMeRequestStatus } from '@/lib/waitmeRequests';
import {
  Bell,
  MapPin,
  Navigation,
  Clock,
  MessageCircle,
  Phone,
  PhoneOff
} from 'lucide-react';
import UserAlertCard from '@/components/cards/UserAlertCard';

import {
  getDemoAlertById,
  getDemoNotifications,
  ensureConversationForAlert,
  ensureInitialWaitMeMessage,
  markDemoNotificationRead,
  markAllDemoRead,
  applyDemoAction
} from '@/components/DemoFlowManager';

function normalize(s) {
  return String(s || '').trim().toLowerCase();
}

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [tick, setTick] = useState(0);

  const { data: realNotifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await notifications.listNotifications(user.id);
      return data ?? [];
    },
    staleTime: 10_000,
  });

  // Solicitudes reales (localStorage) tipo “Usuario quiere tu WaitMe!”
  const [requestsTick, setRequestsTick] = useState(0);
  const [requests, setRequests] = useState([]);
  const [alertsById, setAlertsById] = useState({});

  useEffect(() => {
    const load = () => {
      const list = getWaitMeRequests() || [];
      setRequests(Array.isArray(list) ? list : []);
      setRequestsTick((t) => t + 1);
    };

    load();
    const onChange = () => load();
    window.addEventListener('waitme:requestsChanged', onChange);
    return () => window.removeEventListener('waitme:requestsChanged', onChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const ids = (requests || [])
        .map((r) => r?.alertId)
        .filter(Boolean)
        .filter((id) => !alertsById?.[id]);

      if (!ids.length) return;

      try {
        const pairs = await Promise.all(
          ids.map(async (id) => {
            try {
              const { data: a } = await alerts.getAlert(id);
              return [id, a];
            } catch {
              return [id, null];
            }
          })
        );

        if (cancelled) return;
        setAlertsById((prev) => {
          const next = { ...(prev || {}) };
          pairs.forEach(([id, a]) => {
            if (a) next[id] = a;
          });
          return next;
        });
      } catch {
        // noop
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [requestsTick, requests, alertsById]);

  const acceptRequest = async (req) => {
    try {
      const alertId = req?.alertId;
      if (!alertId) return;

      const buyer = req?.buyer || {};

      await alerts.updateAlert(alertId, {
        status: 'reserved',
        reserved_by_id: buyer?.id || 'buyer',
        reserved_by_email: null,
        reserved_by_name: buyer?.name || 'Usuario',
        reserved_by_photo: buyer?.photo || null,
        reserved_by_car: `${buyer?.brand || ''} ${buyer?.model || ''}`.trim(),
        reserved_by_car_color: buyer?.color || 'gris',
        reserved_by_plate: buyer?.plate || '',
        reserved_by_vehicle_type: buyer?.vehicle_type || 'car'
      });

      setWaitMeRequestStatus(req?.id, 'accepted');

      await queryClient.invalidateQueries({ queryKey: ['alerts'] });
      await queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
      try { window.dispatchEvent(new Event('waitme:badgeRefresh')); } catch {}
      navigate(createPageUrl('History'));
    } catch {
      // noop
    }
  };

  const rejectRequest = (req) => {
    try {
      setWaitMeRequestStatus(req?.id, 'rejected');
    } catch {
      // noop
    }
  };

  const notifications = useMemo(() => {
    const demo = getDemoNotifications?.() || [];
    const real = (realNotifications || []).map((n) => ({ ...n, _isReal: true }));
    const merged = [...demo.map((d) => ({ ...d, _isReal: false })), ...real];
    return merged.sort((a, b) => (b?.t ?? b?.createdAt ?? 0) - (a?.t ?? a?.createdAt ?? 0));
  }, [tick, realNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n?.read).length,
    [notifications]
  );

  const markRead = async (n) => {
    if (!n?.id) return;
    if (n._isReal && user?.id) {
      await notifications.markAsRead(n.id, user.id);
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', user?.id] });
    } else {
      markDemoNotificationRead(n.id);
    }
  };

  const handleMarkAllRead = async () => {
    if (user?.id) {
      await notifications.markAllAsRead(user.id);
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', user?.id] });
    }
    markAllDemoRead?.();
  };

  const openChat = (conversationId, alertId) => {
    if (!conversationId) return;
    navigate(
      createPageUrl(
        `Chat?demo=true&conversationId=${encodeURIComponent(
          conversationId
        )}&alertId=${encodeURIComponent(alertId || '')}`
      )
    );
  };

  const openNavigate = (alertId) => {
    if (!alertId) return;
    navigate(createPageUrl(`Navigate?alertId=${encodeURIComponent(alertId)}`));
  };

  const runAction = (n, action) => {
    if (!n) return;

    const alertId = n.alertId || null;
    const conv = ensureConversationForAlert(alertId, { fromName: n.fromName });
    ensureInitialWaitMeMessage(conv?.id);

    applyDemoAction({
      conversationId: conv?.id,
      alertId,
      action
    });

    if (n?.id) markRead(n);

    openChat(conv?.id, alertId);
  };

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col">
      <main className="flex-1 flex flex-col min-h-0 overflow-auto">
        {/* Solicitudes entrantes (reales) */}
        {requests.filter((r) => r?.type === 'incoming_waitme_request').length > 0 && (
          <div className="px-4 pt-4 space-y-4">
            {requests
              .filter((r) => r?.type === 'incoming_waitme_request')
              .map((r) => {
                const buyer = r?.buyer || {};
                const alert = r?.alertId ? alertsById?.[r.alertId] : null;

                const status = String(r?.status || 'pending');
                const statusText =
                  status === 'rejected' ? 'RECHAZADA' : status === 'accepted' ? 'ACEPTADA' : 'PENDIENTE';

                const carLabel = `${buyer?.brand || ''} ${buyer?.model || ''}`.trim() || 'Sin datos';
                const plate = buyer?.plate || '';
                const carColor = buyer?.color || 'gris';

                const address = alert?.address || '';
                const mins = alert?.available_in_minutes;
                const price = alert?.price;

                // Construir un objeto "alert" compatible con UserAlertCard
                const fakeAlert = {
                  user_name: buyer?.name || 'Usuario',
                  user_photo: buyer?.photo || null,
                  brand: '',
                  model: carLabel,
                  color: carColor,
                  plate: plate,
                  address: address,
                  available_in_minutes: typeof mins === 'number' ? mins : null,
                  price: price,
                  phone: buyer?.phone || null,
                  allow_phone_calls: false,
                  latitude: null,
                  longitude: null
                };

                return (
                  <div key={r?.id} className="rounded-xl border-2 border-purple-500/50 bg-gray-900 p-0 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 px-3 pt-3 pb-2">
                      <div className="text-white text-[15px] font-semibold">
                        Usuario quiere tu Wait<span className="text-purple-500">Me!</span>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/50 font-bold text-xs">
                        {statusText}
                      </Badge>
                    </div>

                    {/* Tarjeta completa estilo "Dónde quieres aparcar" */}
                    <div className="px-2 pb-2">
                      <UserAlertCard
                        alert={fakeAlert}
                        isEmpty={false}
                        onBuyAlert={status === 'pending' ? () => acceptRequest(r) : undefined}
                        onChat={() => {}}
                        onCall={() => buyer?.phone && (window.location.href = `tel:${buyer.phone}`)}
                        isLoading={false}
                        userLocation={null}
                        buyLabel="Aceptar"
                        hideBuy={status !== 'pending'}
                      />
                      {status === 'pending' && (
                        <div className="mt-2">
                          <Button variant="destructive" className="w-full" onClick={() => rejectRequest(r)}>
                            Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="min-h-[calc(100dvh-80px-96px)] flex items-center justify-center px-4">
            <div className="text-center">
              <Bell className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">No hay notificaciones.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 pt-3 pb-2 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-400" />
                  <p className="text-sm text-gray-300">{unreadCount} sin leer</p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-purple-400 hover:text-purple-300"
                  onClick={() => handleMarkAllRead()}
                >
                  Marcar todas como leídas
                </Button>
              </div>
            </div>

            <div className="px-4 space-y-5 pt-4">
              {notifications.map((n) => {
                const type = n?.type || 'status_update';
                const isUnread = !n?.read;
                const alert = n?.alertId ? getDemoAlertById(n.alertId) : null;

                const otherName = alert?.user_name || n?.fromName || 'Usuario';
                const otherPhoto = alert?.user_photo || null;

                const carLabel = `${alert?.brand || ''} ${alert?.model || ''}`.trim();
                const plate = alert?.plate || '';
                const carColor = alert?.color || 'gris';
                const address = alert?.address || '';
                const phoneEnabled = !!alert?.allow_phone_calls;
                const phone = alert?.phone || null;

                const statusText = n?.title || 'ACTIVA';
                const hasLatLon =
                  typeof alert?.latitude === 'number' &&
                  typeof alert?.longitude === 'number';

                const t = normalize(type);

                const handleChatClick = (e) => {
                    e?.stopPropagation();
                    const convId = n?.conversationId || ensureConversationForAlert(n?.alertId)?.id;
                    if (n?.id) markRead(n);
                    openChat(convId, n?.alertId);
                  };

                  const carColors = { blanco: '#FFFFFF', negro: '#1a1a1a', rojo: '#ef4444', azul: '#3b82f6', amarillo: '#facc15', gris: '#6b7280' };
                  const carFill = carColors[carColor] || '#6b7280';
                  const formatPlate = (p) => { const c = String(p || '').replace(/\s+/g, '').toUpperCase(); if (!c) return '0000 XXX'; return `${c.slice(0,4)} ${c.slice(4)}`.trim(); };
                  const photoSrc = otherPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherName)}&background=7c3aed&color=fff&size=128`;

                  return (
                  <div
                    key={n.id}
                    onClick={() => {
                      const convId = n?.conversationId || ensureConversationForAlert(n?.alertId)?.id;
                      if (n?.id) markRead(n);
                      if (convId) openChat(convId, n?.alertId);
                    }}
                    className={`rounded-xl border-2 p-2 transition-all cursor-pointer ${
                      isUnread
                        ? 'bg-gray-900 border-purple-500/50 shadow-lg'
                        : 'bg-gray-900 border-gray-700'
                    }`}
                  >
                    {/* Header row: badge + título + sin leer */}
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold text-xs h-7 px-3 flex items-center justify-center cursor-default select-none pointer-events-none">
                        {n?.title || 'NOTIFICACIÓN'}
                      </Badge>
                      <div className="flex-1 text-center text-xs text-white truncate">{n?.text || '—'}</div>
                      {isUnread && <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse flex-shrink-0" />}
                    </div>

                    <div className="border-t border-gray-700/80 mb-1" />

                    {/* Foto + info usuario */}
                    <div className="flex gap-2.5">
                      <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500/40 bg-gray-900 flex-shrink-0">
                        <img src={photoSrc} alt={otherName} className={`w-full h-full object-cover ${!isUnread ? 'opacity-40 grayscale' : ''}`} />
                      </div>

                      <div className="flex-1 h-[85px] flex flex-col">
                        <p className={`font-bold text-xl leading-none min-h-[22px] ${isUnread ? 'text-white' : 'text-gray-400'}`}>
                          {(otherName || '').split(' ')[0] || 'Usuario'}
                        </p>
                        <p className={`text-sm font-medium leading-none flex-1 flex items-center truncate relative top-[6px] ${isUnread ? 'text-gray-200' : 'text-gray-500'}`}>
                          {carLabel || 'Sin datos'}
                        </p>

                        <div className="flex items-end gap-2 mt-1 min-h-[28px]">
                          <div className={`flex-shrink-0 ${!isUnread ? 'opacity-45' : ''}`}>
                            <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
                              <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
                                <span className="text-white text-[8px] font-bold">E</span>
                              </div>
                              <span className="px-2 text-black font-mono font-bold text-sm tracking-wider">{formatPlate(plate)}</span>
                            </div>
                          </div>
                          <div className="flex-1 flex justify-center">
                            <div className={`flex-shrink-0 relative -top-[1px] ${!isUnread ? 'opacity-45' : ''}`}>
                              <svg viewBox="0 0 48 24" className="w-16 h-10" fill="none" style={{ transform: 'translateY(3px)' }}>
                                <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill={carFill} stroke="white" strokeWidth="1.5" />
                                <path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="0.5" />
                                <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
                                <circle cx="14" cy="18" r="2" fill="#666" />
                                <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
                                <circle cx="36" cy="18" r="2" fill="#666" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dirección y tiempo */}
                    <div className="pt-1.5 border-t border-gray-700/80 mt-1">
                      <div className={`space-y-1.5 ${!isUnread ? 'opacity-80' : ''}`}>
                        {address ? (
                          <div className="flex items-start gap-1.5 text-xs">
                            <MapPin className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isUnread ? 'text-purple-400' : 'text-gray-500'}`} />
                            <span className={`leading-5 line-clamp-1 ${isUnread ? 'text-gray-200' : 'text-gray-400'}`}>{address}</span>
                          </div>
                        ) : null}
                        <div className="flex items-start gap-1.5 text-xs">
                          <Clock className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isUnread ? 'text-purple-400' : 'text-gray-500'}`} />
                          <span className={`leading-5 ${isUnread ? 'text-gray-200' : 'text-gray-400'}`}>Operación en curso</span>
                        </div>
                      </div>
                    </div>

                    {/* Botones: mismo layout que UserAlertCard */}
                    <div className="mt-2">
                      <div className="flex gap-2">
                        <Button size="icon" className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-8 w-[42px]" onClick={handleChatClick}>
                          <MessageCircle className="w-4 h-4" />
                        </Button>

                        {phoneEnabled ? (
                          <Button size="icon" className="bg-white hover:bg-gray-200 text-black rounded-lg h-8 w-[42px]"
                            onClick={(e) => { e.stopPropagation(); phone && (window.location.href = `tel:${phone}`); }}>
                            <Phone className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button variant="outline" size="icon" className="border-white/30 bg-white/10 text-white rounded-lg h-8 w-[42px] opacity-70 cursor-not-allowed" disabled>
                            <PhoneOff className="w-4 h-4 text-white" />
                          </Button>
                        )}

                        {hasLatLon && (
                          <Button size="icon" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-8 w-[42px]"
                            onClick={(e) => { e.stopPropagation(); if (n?.id) markRead(n); openNavigate(n?.alertId); }}>
                            <Navigation className="w-4 h-4" />
                          </Button>
                        )}

                        {t === 'incoming_waitme' ? (
                          <div className="flex-1 grid grid-cols-3 gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button className="h-8 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs px-1" onClick={() => runAction(n, 'reserved')}>Aceptar</Button>
                            <Button variant="outline" className="h-8 rounded-lg border-gray-600 text-white text-xs px-1" onClick={() => runAction(n, 'thinking')}>Pienso</Button>
                            <Button variant="destructive" className="h-8 rounded-lg text-xs px-1" onClick={() => runAction(n, 'rejected')}>Rechazar</Button>
                          </div>
                        ) : (
                          <div className="flex-1">
                            <div className="w-full h-8 rounded-lg border-2 border-purple-500/30 bg-purple-600/10 flex items-center justify-center px-3">
                              <span className="text-sm font-mono font-extrabold text-purple-300">{statusText}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
```

================================================================
FILE: src/pages/Profile.jsx
================================================================
```jsx
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useLayoutHeader, useSetProfileFormData } from '@/lib/LayoutContext';
import { Camera, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

function normalizeAvatarPath(p) {
  if (!p) return "";
  const s = String(p).trim();
  if (!s) return "";
  if (s.startsWith("avatars/")) return s.slice("avatars/".length);
  return s;
}

const carColors = [
  { value: 'blanco', label: 'Blanco', fill: '#FFFFFF' },
  { value: 'negro', label: 'Negro', fill: '#1a1a1a' },
  { value: 'rojo', label: 'Rojo', fill: '#ef4444' },
  { value: 'azul', label: 'Azul', fill: '#3b82f6' },
  { value: 'amarillo', label: 'Amarillo', fill: '#facc15' },
  { value: 'gris', label: 'Gris', fill: '#6b7280' },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, setProfile } = useAuth();
  const setHeader = useLayoutHeader();
  const setProfileFormData = useSetProfileFormData();
  const hydratedOnceRef = useRef(false);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    brand: '',
    model: '',
    color: 'gris',
    vehicle_type: 'car',
    plate: '',
    avatar_url: '',
    phone: '',
    allow_phone_calls: false,
    notifications_enabled: true,
    email_notifications: true,
  });

  let raw =
    formData?.avatar_url ||
    profile?.avatar_url ||
    "";

  raw = String(raw || "").trim();

  let avatarSrc = raw;

  if (avatarSrc && !avatarSrc.startsWith("http") && !avatarSrc.startsWith("data:")) {
    const path = normalizeAvatarPath(avatarSrc);
    const sb = getSupabase();
    if (sb) {
      const { data } = sb.storage.from("avatars").getPublicUrl(path);
      avatarSrc = data?.publicUrl || "";
    } else {
      avatarSrc = "";
    }
  }

  const nameForInitial =
    (formData?.full_name ||
     profile?.full_name ||
     "").trim();

  const initial = (nameForInitial ? nameForInitial[0] : "?").toUpperCase();

  useEffect(() => {
    if (!user?.id) return;
    if (hydratedOnceRef.current) return;
    hydratedOnceRef.current = true;

    // Perfil dev: usar datos del contexto (no existe en Supabase)
    if (user.id === 'dev-user' && profile) {
      setFormData({
        full_name: profile.full_name || 'Dev User',
        brand: profile.brand || 'Dev',
        model: profile.model || 'Coche',
        color: profile.color || 'gris',
        vehicle_type: profile.vehicle_type || 'car',
        plate: profile.plate || '0000XXX',
        avatar_url: profile.avatar_url || '',
        phone: profile.phone || '000000000',
        allow_phone_calls: profile.allow_phone_calls || false,
        notifications_enabled: profile.notifications_enabled !== false,
        email_notifications: profile.email_notifications !== false,
      });
      setHydrated(true);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) return;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error) {
        console.error("PROFILE LOAD ERROR:", error);
        return;
      }
      if (data) {
        setFormData({
          full_name: data.full_name || '',
          brand: data.brand || '',
          model: data.model || '',
          color: data.color || 'gris',
          vehicle_type: data.vehicle_type || 'car',
          plate: data.plate || '',
          avatar_url: data.avatar_url || '',
          phone: data.phone || '',
          allow_phone_calls: data.allow_phone_calls || false,
          notifications_enabled: data.notifications_enabled !== false,
          email_notifications: data.email_notifications !== false,
        });
      }
      setHydrated(true);
    })();
  }, [user?.id]);

  const handleSave = useCallback(async () => {
    if (user?.id === 'dev-user') {
      setProfile({ ...profile, ...formData });
      navigate('/');
      return;
    }
    const supabase = getSupabase();
    if (!supabase) return;
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    setSaving(true);
    try {
      const displayName = (formData.full_name || '').split(' ')[0] || formData.full_name || '';
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: authUser.id,
          email: authUser.email,
          full_name: formData.full_name,
          display_name: displayName,
          avatar_url: formData.avatar_url,
          brand: formData.brand,
          model: formData.model,
          color: formData.color,
          vehicle_type: formData.vehicle_type,
          plate: formData.plate,
          phone: formData.phone,
          allow_phone_calls: formData.allow_phone_calls,
          notifications_enabled: formData.notifications_enabled,
          email_notifications: formData.email_notifications,
        }, { onConflict: 'id' })
        .select()
        .single();
      if (error) {
        console.error("PROFILE SAVE ERROR:", error);
        alert('Error al guardar. Intenta de nuevo.');
        return;
      }
      if (data) setProfile(data);
      navigate('/');
    } catch (err) {
      console.error("PROFILE SAVE ERROR:", err);
      alert('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }, [formData, navigate, setProfile, user?.id, profile]);

  useEffect(() => {
    setProfileFormData(formData);
    return () => setProfileFormData(null);
  }, [formData, setProfileFormData]);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    setHeader({ showBackButton: true, onBack: handleBack });
    return () => setHeader({ onBack: null });
  }, [handleBack, setHeader]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      updateField('avatar_url', urlData.publicUrl);
    } catch (error) {
      console.error('Error subiendo foto:', error);
    }
  };

  const selectedColor = carColors.find((c) => c.value === formData.color) || carColors[5];

  const formatPlate = useMemo(() => {
    return (value = '') => {
      const clean = (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const a = clean.slice(0, 4);
      const b = clean.slice(4, 7);
      return b ? `${a} ${b}`.trim() : a;
    };
  }, []);

  const handlePlateChange = (raw) => {
    const clean = (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
    updateField('plate', clean);
  };

  const VehicleIconProfile = ({ type, color, size = 'w-16 h-10' }) => {
    if (type === 'suv') {
      return (
        <svg viewBox="0 0 48 24" className={size} fill="none" aria-label="Todoterreno">
          <path
            d="M6 18 V13 L9.5 10.8 L16 8.8 H28.5 L36.5 10.8 L42 14.2 L43 18 H6 Z"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M16.8 9.6 L19.2 12.6 H28.2 L30.4 9.6 Z"
            fill="rgba(255,255,255,0.22)"
            stroke="white"
            strokeWidth="0.5"
          />
          <path d="M29.1 9.6 V12.6" stroke="white" strokeWidth="0.5" opacity="0.6" />
          <path d="M42.7 15.6 H41.2" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="14.2" cy="18" r="3.8" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="14.2" cy="18" r="2" fill="#666" />
          <circle cx="35.6" cy="18" r="3.8" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="35.6" cy="18" r="2" fill="#666" />
        </svg>
      );
    }

    if (type === 'van') {
      return (
        <svg viewBox="0 0 48 24" className={size} fill="none" aria-label="Furgoneta">
          <path
            d="M4 18 V12.8 L7.5 10.8 L14 8.8 H32.2 L40.2 10.2 L45.6 13.8 L46 18 H4 Z"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M15.5 9.6 L18 12.6 H31.2 L33.2 9.6 Z"
            fill="rgba(255,255,255,0.22)"
            stroke="white"
            strokeWidth="0.5"
          />
          <path d="M24.2 9.6 V12.6" stroke="white" strokeWidth="0.5" opacity="0.6" />
          <path d="M12.4 12.8 V18" stroke="white" strokeWidth="0.6" opacity="0.45" />
          <path d="M33.8 12.6 V18" stroke="white" strokeWidth="0.6" opacity="0.45" />
          <path d="M46 15.6 H44.4" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="13.6" cy="18" r="3.8" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="13.6" cy="18" r="2" fill="#666" />
          <circle cx="37.6" cy="18" r="3.8" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="37.6" cy="18" r="2" fill="#666" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 48 24" className={size} fill="none" aria-label="Coche">
        <path
          d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
        <path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="0.5" />
        <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
        <circle cx="14" cy="18" r="2" fill="#666" />
        <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
        <circle cx="36" cy="18" r="2" fill="#666" />
      </svg>
    );
  };

  const CarIconSmall = ({ color }) => (
    <svg viewBox="0 0 48 24" className="w-8 h-5" fill="none" aria-hidden="true">
      <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill={color} stroke="white" strokeWidth="1.5" />
      <circle cx="14" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
      <circle cx="36" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
    </svg>
  );

  const vehicleLabel = (t) => {
    if (t === 'suv') return 'Voluminoso';
    if (t === 'van') return 'Furgoneta';
    return 'Normal';
  };

  const VehicleIconSmall = ({ type }) => (
    <VehicleIconProfile
      type={type}
      color={selectedColor?.fill}
      size="w-6 h-4"
    />
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 px-4">
      <div className="flex flex-col items-center pt-6 pb-6">
        <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Tarjeta tipo DNI */}
          <div className="mt-1 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 border border-purple-500 shadow-xl">
            <div className="flex gap-4">
              {/* Foto */}
              <div className="relative">
                <div className="w-24 h-28 rounded-xl overflow-hidden border-2 border-purple-500 bg-gray-800">
                  {avatarSrc ? (
                    <img
                      key={avatarSrc}
                      src={avatarSrc}
                      alt="avatar"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <span className="text-2xl font-semibold">{initial}</span>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>

              {/* Info */}
              <div className="pl-3 flex-1 flex flex-col justify-between">
                <p className="text-xl font-bold text-white">
                  {formData.full_name || profile?.full_name}
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium text-sm">
                      {formData.brand || 'Sin'} {formData.model || 'coche'}
                    </p>
                  </div>
                  <VehicleIconProfile type={formData.vehicle_type || 'car'} color={selectedColor?.fill} />
                </div>

                {/* Matrícula estilo placa */}
                <div className="mt-2 flex items-center">
                  <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
                    <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">E</span>
                    </div>
                    <span className="px-2 text-black font-mono font-bold text-sm tracking-wider">
                      {formData.plate ? `${formData.plate.slice(0, 4)} ${formData.plate.slice(4)}`.trim() : '0000 XXX'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="space-y-3">
            {/* Nombre y Teléfono en la misma fila */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Nombre</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => updateField('full_name', e.target.value.slice(0, 15))}
                  placeholder="Tu nombre"
                  className="bg-gray-900 border-gray-700 text-white h-9"
                  maxLength={15}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Teléfono</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+34 600 00 00"
                  className="bg-gray-900 border-gray-700 text-white h-9 text-sm"
                  type="tel"
                />
              </div>
            </div>

            {/* Permitir llamadas - compacto */}
            <div className="bg-gray-900 rounded-lg p-2 border border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-purple-400" />
                <p className="text-sm text-white">Permitir llamadas</p>
              </div>
              <Switch
                checked={formData.allow_phone_calls}
                onCheckedChange={(checked) => updateField('allow_phone_calls', checked)}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-gray-400 text-sm">Marca</Label>
                <Input
                  value={formData.brand}
                  onChange={(e) => updateField('brand', e.target.value)}
                  placeholder="Seat, Renault..."
                  className="bg-gray-900 border-gray-700 text-white h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-400 text-sm">Modelo</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => updateField('model', e.target.value)}
                  placeholder="Ibiza, Megane..."
                  className="bg-gray-900 border-gray-700 text-white h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-gray-400 text-sm">Color</Label>
                <Select value={formData.color} onValueChange={(value) => updateField('color', value)}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top" sideOffset={8} className="bg-gray-900 border-gray-700">
                    {carColors.map((color) => (
                      <SelectItem key={color.value} value={color.value} className="text-white hover:bg-gray-800">
                        <div className="flex items-center gap-2">
                          <CarIconSmall color={color.fill} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-400 text-sm">Vehículo</Label>
                <Select value={formData.vehicle_type || 'car'} onValueChange={(value) => updateField('vehicle_type', value)}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <div className="flex items-center gap-2">
                      <VehicleIconSmall type={formData.vehicle_type || 'car'} />
                      <span className="text-white">{vehicleLabel(formData.vehicle_type || 'car')}</span>
                    </div>
                  </SelectTrigger>

                  <SelectContent side="top" sideOffset={8} className="bg-gray-900 border-gray-700">
                    <SelectItem value="car" className="text-white hover:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <VehicleIconSmall type="car" />
                        Normal
                      </div>
                    </SelectItem>

                    <SelectItem value="suv" className="text-white hover:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <VehicleIconSmall type="suv" />
                        Voluminoso
                      </div>
                    </SelectItem>

                    <SelectItem value="van" className="text-white hover:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <VehicleIconSmall type="van" />
                        Furgoneta
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-400 text-sm">Matrícula</Label>
                <Input
                  value={formatPlate(formData.plate)}
                onChange={(e) => handlePlateChange(e.target.value)}
                placeholder="1234 ABC"
                className="bg-gray-900 border-gray-700 text-white font-mono uppercase text-center h-9"
                maxLength={8}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !user?.id}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl mt-4"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </motion.div>
        </div>
      </div>
    </div>
  );
}

```

================================================================
FILE: src/pages/Settings.jsx
================================================================
```jsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  User,
  Coins,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  CreditCard,
  HelpCircle,
  Star,
  Instagram,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import { useAuth } from '@/lib/AuthContext';

export default function Settings() {
  const { user, isLoadingAuth, logout } = useAuth();

  // Precarga real para que la foto salga instantánea
  useEffect(() => {
    if (!user?.photo_url) return;
    const img = new Image();
    img.src = user.photo_url;
  }, [user?.photo_url]);

  const handleLogout = () => {
    logout?.(true);
  };

  const instagramUrl = user?.instagram_url || user?.instagram || '';
  const webUrl = user?.website_url || user?.web || '';

  const openExternal = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const displayName =
    user?.display_name || user?.full_name?.split(' ')?.[0] || 'Usuario';

  return (
    <div className="min-min-h-[100dvh] bg-black text-white flex flex-col">
      <main className="flex-1 flex flex-col min-h-0 overflow-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Perfil resumen */}
          <Link to={createPageUrl('Profile')}>
            <div className="bg-gray-900 rounded-2xl p-4 flex items-center gap-4 hover:bg-gray-800/50 transition-colors">
              {user?.photo_url ? (
                <img
                  src={user.photo_url}
                  className="w-14 h-14 rounded-xl object-cover border-2 border-purple-500 bg-gray-800"
                  alt=""
                  loading="eager"
                  decoding="sync"
                  fetchPriority="high"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gray-800 border-2 border-purple-500 flex items-center justify-center">
                  <User className="w-7 h-7 text-gray-500" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold">{displayName}</p>
                <p className="text-sm text-gray-400">{user?.email || ''}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </div>
          </Link>

          {/* Créditos */}
          <div className="bg-gradient-to-r from-purple-900/50 to-purple-600/30 rounded-2xl p-5 border-2 border-purple-500">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Coins className="w-6 h-6 text-purple-400" />
                <span className="font-medium">Mis créditos</span>
              </div>
              <span className="text-2xl font-bold text-purple-400">
                {(user?.credits || 0).toFixed(2)}€
              </span>
            </div>
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isLoadingAuth}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Añadir créditos
            </Button>
          </div>

          {/* Opciones */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 divide-y divide-gray-800">
            <Link
              to={createPageUrl('NotificationSettings')}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors"
            >
              <Bell className="w-5 h-5 text-purple-500" />
              <span className="flex-1">Notificaciones</span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </Link>

            <button className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors">
              <Shield className="w-5 h-5 text-purple-500" />
              <span className="flex-1">Privacidad</span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>

            <button className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors">
              <Star className="w-5 h-5 text-purple-500" />
              <span className="flex-1">Valorar la app</span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>

            <button className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors">
              <HelpCircle className="w-5 h-5 text-purple-500" />
              <span className="flex-1">Ayuda</span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Instagram y Web - cajas individuales estilo Créditos */}
          <div className="flex justify-center gap-6">
            
            <div className="bg-gradient-to-r from-purple-900/50 to-purple-600/30 rounded-2xl p-4 border-2 border-purple-500 w-32 flex flex-col items-center">
              <button
                onClick={() => openExternal(instagramUrl)}
                disabled={!instagramUrl}
                className="flex flex-col items-center gap-2 disabled:opacity-40"
              >
                <Instagram className="w-7 h-7 text-purple-300" />
                <span className="text-sm font-medium">Instagram</span>
              </button>
            </div>

            <div className="bg-gradient-to-r from-purple-900/50 to-purple-600/30 rounded-2xl p-4 border-2 border-purple-500 w-32 flex flex-col items-center">
              <button
                onClick={() => openExternal(webUrl)}
                disabled={!webUrl}
                className="flex flex-col items-center gap-2 disabled:opacity-40"
              >
                <Globe className="w-7 h-7 text-purple-300" />
                <span className="text-sm font-medium">Web</span>
              </button>
            </div>

          </div>

          {/* Cerrar sesión */}
          <Button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            disabled={isLoadingAuth}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Cerrar sesión
          </Button>

          {/* Footer */}
          <div className="text-center pt-4">
            <Logo size="sm" />
            <p className="text-xs text-gray-500 mt-2">Versión 1.0.0</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
```

================================================================
FILE: src/services/alertsSupabase.js
================================================================
```js
/**
 * Servicio de alertas de parking (Supabase).
 * Capa de sustitución para base44.entities.ParkingAlert.
 * Usa schema: parking_alerts (seller_id, price_cents, address_text, geohash, metadata).
 */
import { getSupabase } from '@/lib/supabaseClient';
import { encode } from '@/lib/geohash';
import { haversineKm } from '@/utils/carUtils';
import { NEARBY_RADIUS_KM, RESERVATION_TIMEOUT_MINUTES } from '@/config/alerts';

const TABLE = 'parking_alerts';

/**
 * Normaliza fila de Supabase a formato unificado (compatible con app).
 * Shape estable: id, user_id, seller_id, lat, lng, latitude, longitude, price,
 * vehicle_type, vehicle_color, status, address, user_name, user_photo, ...
 */
function normalizeAlert(row) {
  if (!row) return null;
  const sellerId = row.seller_id ?? row.user_id;
  const price = row.price_cents != null ? row.price_cents / 100 : (row.price ?? 0);
  const meta = row.metadata || {};
  const mins = meta.available_in_minutes ?? row.available_in_minutes;
  const reservedByCar = meta.reserved_by_car ?? '';
  const carParts = String(reservedByCar).trim().split(/\s+/).filter(Boolean);
  return {
    id: row.id,
    user_id: sellerId,
    seller_id: sellerId,
    lat: row.lat,
    lng: row.lng,
    latitude: row.lat,
    longitude: row.lng,
    price,
    price_cents: row.price_cents,
    vehicle_type: row.vehicle_type ?? meta.vehicle_type ?? 'car',
    vehicle_color: row.vehicle_color ?? meta.vehicle_color ?? meta.color ?? 'gray',
    status: row.status,
    reserved_by: row.reserved_by ?? null,
    reserved_by_id: row.reserved_by ?? meta.reserved_by_id ?? null,
    reserved_until: row.reserved_until ?? null,
    brand: meta.brand ?? row.brand ?? (carParts[0] || ''),
    model: meta.model ?? row.model ?? (carParts.slice(1).join(' ') || ''),
    plate: meta.plate ?? meta.reserved_by_plate ?? row.plate ?? null,
    color: meta.color ?? row.color ?? null,
    user_name: meta.user_name ?? meta.reserved_by_name ?? null,
    user_photo: meta.user_photo ?? meta.reserved_by_photo ?? null,
    address: row.address_text ?? meta.address ?? row.address ?? null,
    target_time: meta.target_time ?? row.target_time ?? null,
    created_at: row.created_at,
    created_date: row.created_at,
    expires_at: row.expires_at,
    geohash: row.geohash ?? null,
    address_text: row.address_text,
    available_in_minutes: mins ?? null,
    cancel_reason: meta.cancel_reason ?? row.cancel_reason ?? null,
    metadata: meta,
  };
}

/**
 * Crea una nueva alerta.
 * Acepta payload Supabase-style o Base44-style (user_id, price, latitude/longitude, address).
 * @param {Object} payload - { sellerId|user_id, lat|latitude, lng|longitude, addressText|address?, priceCents|price, expiresAt|wait_until?, metadata? }
 * @returns {{ data, error }}
 */
export async function createAlert(payload) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };

  const sellerId = payload.sellerId ?? payload.user_id;
  const lat = payload.lat ?? payload.latitude;
  const lng = payload.lng ?? payload.longitude;
  const addressText = payload.addressText ?? payload.address;
  const priceCents = payload.priceCents ?? (typeof payload.price === 'number' ? Math.round(payload.price * 100) : null);
  const expiresAt = payload.expiresAt ?? payload.wait_until;
  const metadata = payload.metadata ?? {};
  if (payload.vehicle_type) metadata.vehicle_type = payload.vehicle_type;
  if (payload.available_in_minutes) metadata.available_in_minutes = payload.available_in_minutes;

  const price = priceCents ?? 0;
  const geohash = encode(lat, lng, 7);
  const vehicleType = payload.vehicle_type ?? metadata.vehicle_type ?? 'car';
  const vehicleColor = payload.vehicle_color ?? metadata.vehicle_color ?? metadata.color ?? 'gray';
  if (!metadata.vehicle_type) metadata.vehicle_type = vehicleType;
  if (!metadata.vehicle_color) metadata.vehicle_color = vehicleColor;

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      seller_id: sellerId,
      lat,
      lng,
      address_text: addressText ?? null,
      price_cents: price,
      currency: 'EUR',
      expires_at: expiresAt ?? null,
      geohash,
      status: payload.status ?? 'active',
      vehicle_type: vehicleType,
      vehicle_color: vehicleColor,
      metadata: Object.keys(metadata).length ? metadata : {},
    })
    .select()
    .single();

  if (error) return { data: null, error };
  return { data: normalizeAlert(data), error: null };
}

/**
 * Actualiza una alerta.
 * @param {string} alertId
 * @param {Object} updates - { status?, priceCents?, expiresAt?, addressText?, metadata?, ... }
 * @returns {{ data, error }}
 */
export async function updateAlert(alertId, updates) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };

  const row = {};
  if (updates.status != null) row.status = updates.status;
  if (updates.reserved_by != null) row.reserved_by = updates.reserved_by;
  if (updates.reserved_by_id != null) row.reserved_by = updates.reserved_by_id;
  if (updates.priceCents != null) row.price_cents = updates.priceCents;
  else if (updates.price != null) row.price_cents = Math.round(updates.price * 100);
  if (updates.expiresAt != null) row.expires_at = updates.expiresAt;
  if (updates.addressText != null) row.address_text = updates.addressText;
  if (updates.address != null) row.address_text = updates.address;
  if (updates.metadata != null) row.metadata = updates.metadata;
  const needsMeta = updates.reserved_by_name != null || updates.reserved_by_car != null ||
    updates.reserved_by_plate != null || updates.cancel_reason != null;
  if (needsMeta) {
    const { data: cur } = await supabase.from(TABLE).select('metadata').eq('id', alertId).single();
    const meta = { ...(cur?.metadata || {}) };
    if (updates.reserved_by_name != null) meta.reserved_by_name = updates.reserved_by_name;
    if (updates.reserved_by_car != null) meta.reserved_by_car = updates.reserved_by_car;
    if (updates.reserved_by_plate != null) meta.reserved_by_plate = updates.reserved_by_plate;
    if (updates.reserved_by_car_color != null) meta.reserved_by_car_color = updates.reserved_by_car_color;
    if (updates.reserved_by_vehicle_type != null) meta.reserved_by_vehicle_type = updates.reserved_by_vehicle_type;
    if (updates.cancel_reason != null) meta.cancel_reason = updates.cancel_reason;
    row.metadata = meta;
  }
  if (updates.available_in_minutes != null) {
    const future = new Date(Date.now() + updates.available_in_minutes * 60 * 1000);
    row.expires_at = future.toISOString();
  }

  if (Object.keys(row).length === 0) {
    const { data } = await supabase.from(TABLE).select('*').eq('id', alertId).single();
    return { data: data ? normalizeAlert(data) : null, error: null };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', alertId)
    .select()
    .single();

  if (error) return { data: null, error };
  return { data: normalizeAlert(data), error: null };
}

/**
 * Reserva una alerta activa. Atómico: solo uno puede reservar.
 * @param {string} alertId
 * @param {string} userId - ID del comprador (reservador)
 * @param {Object} [metadata] - metadata del reservador (reserved_by_name, reserved_by_car, etc.)
 * @returns {{ data, error }} - data: alerta actualizada; error: ALREADY_RESERVED si ya está reservada
 */
export async function reserveAlert(alertId, userId, metadata = {}) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };
  if (!alertId || !userId) return { data: null, error: new Error('alertId y userId requeridos') };

  const { data: current, error: fetchErr } = await supabase
    .from(TABLE)
    .select('id, status, seller_id, user_id, metadata')
    .eq('id', alertId)
    .single();

  if (fetchErr || !current) return { data: null, error: fetchErr || new Error('Alerta no encontrada') };
  if (current.status !== 'active') {
    return { data: null, error: Object.assign(new Error('ALREADY_RESERVED'), { code: 'ALREADY_RESERVED' }) };
  }
  const ownerId = current.seller_id ?? current.user_id;
  if (ownerId === userId) {
    return { data: null, error: new Error('No puedes reservar tu propia alerta') };
  }

  const reservedUntil = new Date(Date.now() + RESERVATION_TIMEOUT_MINUTES * 60 * 1000).toISOString();
  const mergedMeta = { ...(current.metadata || {}), ...metadata };
  const updatePayload = {
    status: 'reserved',
    reserved_by: userId,
    reserved_until: reservedUntil,
    metadata: Object.keys(mergedMeta).length ? mergedMeta : (current.metadata || {}),
  };

  const { data, error } = await supabase
    .from(TABLE)
    .update(updatePayload)
    .eq('id', alertId)
    .eq('status', 'active')
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
      return { data: null, error: Object.assign(new Error('ALREADY_RESERVED'), { code: 'ALREADY_RESERVED' }) };
    }
    return { data: null, error };
  }
  return { data: normalizeAlert(data), error: null };
}

/**
 * Elimina una alerta.
 * @param {string} alertId
 * @returns {{ error }}
 */
export async function deleteAlert(alertId) {
  const supabase = getSupabase();
  if (!supabase) return { error: new Error('Supabase no configurado') };

  const { error } = await supabase.from(TABLE).delete().eq('id', alertId);
  return { error };
}

/**
 * Expira reservas que superaron reserved_until.
 * Convierte status reserved → active, limpia reserved_by y reserved_until.
 * @returns {{ count: number, error }}
 */
export async function expireReservations() {
  const supabase = getSupabase();
  if (!supabase) return { count: 0, error: new Error('Supabase no configurado') };

  const { data, error } = await supabase.rpc('expire_reservations');
  if (error) return { count: 0, error };
  return { count: data ?? 0, error: null };
}

/**
 * Obtiene alertas activas cerca de (lat, lng).
 * 0) Expira reservas vencidas.
 * 1) Bounding box rápido en Supabase.
 * 2) Filtro Haversine en memoria para radio real (no cuadrado).
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusKm
 * @returns {{ data: Array, error }}
 */
export async function getNearbyAlerts(lat, lng, radiusKm = NEARBY_RADIUS_KM) {
  const supabase = getSupabase();
  if (!supabase) return { data: [], error: new Error('Supabase no configurado') };

  await expireReservations();

  const degLat = radiusKm / 111;
  const degLng = radiusKm / (111 * Math.max(0.01, Math.cos((lat * Math.PI) / 180)));
  const latMin = lat - degLat;
  const latMax = lat + degLat;
  const lngMin = lng - degLng;
  const lngMax = lng + degLng;

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('status', 'active')
    .gte('lat', latMin)
    .lte('lat', latMax)
    .gte('lng', lngMin)
    .lte('lng', lngMax)
    .order('created_at', { ascending: false });

  if (error) return { data: [], error };

  const normalized = (data ?? []).map(normalizeAlert).filter(Boolean);
  const withinRadius = normalized.filter((a) => {
    const km = haversineKm(lat, lng, a.latitude ?? a.lat, a.longitude ?? a.lng);
    return Number.isFinite(km) && km <= radiusKm;
  });

  return { data: withinRadius, error: null };
}

/**
 * Obtiene alertas del vendedor (mis alertas).
 * @param {string} sellerId
 * @returns {{ data: Array, error }}
 */
export async function getMyAlerts(sellerId) {
  const supabase = getSupabase();
  if (!supabase) return { data: [], error: new Error('Supabase no configurado') };

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) return { data: [], error };
  return { data: (data ?? []).map(normalizeAlert), error: null };
}

/**
 * Obtiene alertas reservadas por el comprador (tus reservas).
 * @param {string} buyerId
 * @returns {{ data: Array, error }}
 */
export async function getAlertsReservedByMe(buyerId) {
  const supabase = getSupabase();
  if (!supabase) return { data: [], error: new Error('Supabase no configurado') };

  const { data: reservations, error: resError } = await supabase
    .from('alert_reservations')
    .select('alert_id')
    .eq('buyer_id', buyerId)
    .in('status', ['requested', 'accepted', 'active']);

  if (resError || !reservations?.length) return { data: [], error: resError };

  const alertIds = reservations.map((r) => r.alert_id).filter(Boolean);
  const { data: alerts, error } = await supabase
    .from(TABLE)
    .select('*')
    .in('id', alertIds)
    .order('created_at', { ascending: false });

  if (error) return { data: [], error };
  const normalized = (alerts ?? []).map((row) => {
    const a = normalizeAlert(row);
    a.reserved_by_id = buyerId;
    return a;
  });
  return { data: normalized, error: null };
}

/**
 * Obtiene alertas para la lista de Chats (donde el usuario es seller o buyer).
 * @param {string} userId
 * @returns {{ data: Array, error }}
 */
export async function getAlertsForChats(userId) {
  const [mine, reserved] = await Promise.all([
    getMyAlerts(userId),
    getAlertsReservedByMe(userId),
  ]);
  const err = mine.error || reserved.error;
  if (err) return { data: [], error: err };
  const seen = new Set();
  const merged = [];
  for (const a of [...(mine.data ?? []), ...(reserved.data ?? [])]) {
    if (a?.id && !seen.has(a.id)) {
      seen.add(a.id);
      merged.push(a);
    }
  }
  return { data: merged, error: null };
}

/**
 * Obtiene una alerta por ID.
 * @param {string} alertId
 * @returns {{ data, error }}
 */
export async function getAlert(alertId) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };

  const { data, error } = await supabase.from(TABLE).select('*').eq('id', alertId).single();
  if (error) return { data: null, error };
  return { data: normalizeAlert(data), error: null };
}

/**
 * Suscripción Realtime a cambios en parking_alerts.
 * @param {Object} opts - { onUpsert?, onDelete? }
 * @returns {() => void} unsubscribe
 */
export function subscribeAlerts({ onUpsert, onDelete } = {}) {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel('alertsSupabase_sub')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: TABLE },
      (payload) => payload.new && onUpsert && onUpsert(normalizeAlert(payload.new))
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: TABLE },
      (payload) => payload.new && onUpsert && onUpsert(normalizeAlert(payload.new))
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: TABLE },
      (payload) => payload.old?.id && onDelete && onDelete(payload.old.id)
    )
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch (_) {}
  };
}

```

================================================================
FILE: src/services/chatSupabase.js
================================================================
```js
/**
 * Servicio de chat (Supabase).
 * Usa tablas: conversations, messages.
 */
import { getSupabase } from '@/lib/supabaseClient';

/**
 * Normaliza conversación para formato esperado por la app.
 */
function normalizeConversation(row, userId) {
  if (!row) return null;
  const isBuyer = row.buyer_id === userId;
  const otherId = isBuyer ? row.seller_id : row.buyer_id;
  const otherProfile = isBuyer ? row.seller : row.buyer;
  return {
    id: row.id,
    alert_id: row.alert_id,
    participant1_id: row.buyer_id,
    participant2_id: row.seller_id,
    participant1_name: row.buyer?.full_name || row.buyer_name || 'Usuario',
    participant2_name: row.seller?.full_name || row.seller_name || 'Usuario',
    participant1_photo: row.buyer?.avatar_url || null,
    participant2_photo: row.seller?.avatar_url || null,
    last_message_text: row.last_message_text || null,
    last_message_at: row.last_message_at || row.created_at,
    created_date: row.created_at,
    updated_date: row.updated_at || row.created_at,
    unread_count_p1: 0,
    unread_count_p2: 0,
  };
}

/**
 * Normaliza mensaje para formato esperado por la app.
 */
function normalizeMessage(row, userId) {
  if (!row) return null;
  const senderProfile = row.sender;
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    sender_name: senderProfile?.full_name || 'Usuario',
    sender_photo: senderProfile?.avatar_url || null,
    message: row.body,
    created_date: row.created_at,
    message_type: 'user',
    attachments: null,
  };
}

/**
 * Obtiene una conversación por ID.
 * @param {string} conversationId
 * @param {string} userId
 * @returns {{ data, error }}
 */
export async function getConversation(conversationId, userId) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };

  const { data: row, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error || !row) return { data: null, error: error || new Error('Conversación no encontrada') };

  const ids = [row.buyer_id, row.seller_id].filter(Boolean);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', ids);
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const enriched = {
    ...row,
    buyer: profileMap[row.buyer_id],
    seller: profileMap[row.seller_id],
  };
  return { data: normalizeConversation(enriched, userId), error: null };
}

/**
 * Obtiene conversaciones del usuario (como buyer o seller).
 * @param {string} userId
 * @returns {{ data: Array, error }}
 */
export async function getConversations(userId) {
  const supabase = getSupabase();
  if (!supabase) return { data: [], error: new Error('Supabase no configurado') };

  const { data: rows, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) return { data: [], error };
  if (!rows?.length) return { data: [], error: null };

  const ids = [...new Set(rows.flatMap((r) => [r.buyer_id, r.seller_id]).filter(Boolean))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', ids);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  const data = rows.map((r) =>
    normalizeConversation(
      {
        ...r,
        buyer: profileMap[r.buyer_id],
        seller: profileMap[r.seller_id],
      },
      userId
    )
  );
  return { data, error: null };
}

/**
 * Obtiene mensajes de una conversación.
 * @param {string} conversationId
 * @param {string} userId - para normalizar
 * @returns {{ data: Array, error }}
 */
export async function getMessages(conversationId, userId) {
  const supabase = getSupabase();
  if (!supabase) return { data: [], error: new Error('Supabase no configurado') };

  const { data: rows, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) return { data: [], error };
  if (!rows?.length) return { data: [], error: null };

  const senderIds = [...new Set(rows.map((r) => r.sender_id).filter(Boolean))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', senderIds);
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const data = rows.map((r) =>
    normalizeMessage({ ...r, sender: profileMap[r.sender_id] }, userId)
  );
  return { data, error: null };
}

/**
 * Crea o obtiene una conversación para buyer+seller+alert.
 * @param {Object} payload - { buyerId, sellerId, alertId }
 * @returns {{ data, error }}
 */
export async function createConversation(payload) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };

  const { buyerId, sellerId, alertId } = payload;
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('alert_id', alertId)
    .eq('buyer_id', buyerId)
    .eq('seller_id', sellerId)
    .maybeSingle();

  if (existing) return { data: existing, error: null };

  const { data, error } = await supabase
    .from('conversations')
    .insert({ buyer_id: buyerId, seller_id: sellerId, alert_id: alertId })
    .select('id')
    .single();

  if (error) return { data: null, error };
  return { data, error: null };
}

/**
 * Envía un mensaje.
 * @param {Object} payload - { conversationId, senderId, body }
 * @returns {{ data, error }}
 */
export async function sendMessage(payload) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };

  const { conversationId, senderId, body } = payload;

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: body || '',
    })
    .select()
    .single();

  if (error) return { data: null, error };
  return { data: normalizeMessage(data, senderId), error: null };
}

/**
 * Suscripción Realtime a mensajes de una conversación.
 * @param {string} conversationId
 * @param {Function} onNewMessage - (message) => void
 * @returns {() => void} unsubscribe
 */
export function subscribeMessages(conversationId, onNewMessage) {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`chat_messages_${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        const row = payload.new;
        if (row && onNewMessage) {
          const { data: sender } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', row.sender_id)
            .single();
          const msg = normalizeMessage({ ...row, sender }, row.sender_id);
          onNewMessage(msg);
        }
      }
    )
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch (_) {}
  };
}

```

================================================================
FILE: src/services/notificationsSupabase.js
================================================================
```js
/**
 * Servicio de notificaciones (Supabase).
 * Sustituye base44.entities.Notification.
 */
import { getSupabase } from '@/lib/supabaseClient';

const TABLE = 'notifications';

/**
 * Normaliza fila a formato esperado por la app.
 */
function normalizeNotification(row) {
  if (!row) return null;
  const meta = row.metadata || {};
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type || 'status_update',
    title: row.title || '',
    message: row.message || '',
    text: row.message || '',
    metadata: meta,
    read: row.is_read ?? false,
    is_read: row.is_read ?? false,
    created_at: row.created_at,
    t: row.created_at ? new Date(row.created_at).getTime() : 0,
    // Campos compatibles con demo (alertId, conversationId, fromName)
    alertId: meta.alert_id ?? meta.alertId ?? null,
    conversationId: meta.conversation_id ?? meta.conversationId ?? null,
    fromName: meta.sender_name ?? meta.fromName ?? null,
  };
}

/**
 * Crea una notificación.
 * @param {Object} payload - { user_id, type, title?, message?, metadata? }
 *   Para extension_request: user_id=recipient_id, metadata={ sender_id, sender_name, alert_id, amount, extension_minutes, status }
 * @returns {{ data, error }}
 */
export async function createNotification(payload) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };

  const row = {
    user_id: payload.user_id,
    type: payload.type || 'status_update',
    title: payload.title ?? '',
    message: payload.message ?? '',
    metadata: payload.metadata ?? {},
    is_read: payload.is_read ?? false,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select()
    .single();

  if (error) return { data: null, error };
  return { data: normalizeNotification(data), error: null };
}

/**
 * Lista notificaciones del usuario.
 * @param {string} userId
 * @param {Object} opts - { unreadOnly?: boolean, limit?: number }
 * @returns {{ data: Array, error }}
 */
export async function listNotifications(userId, opts = {}) {
  const supabase = getSupabase();
  if (!supabase) return { data: [], error: new Error('Supabase no configurado') };

  const limit = opts.limit ?? 100;
  let query = supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (opts.unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data: rows, error } = await query;

  if (error) return { data: [], error };
  if (!rows?.length) return { data: [], error: null };

  const data = rows.map(normalizeNotification);
  return { data, error: null };
}

/**
 * Marca una notificación como leída.
 * @param {string} notificationId
 * @param {string} userId - para RLS
 * @returns {{ data, error }}
 */
export async function markAsRead(notificationId, userId) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };

  const { data, error } = await supabase
    .from(TABLE)
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) return { data: null, error };
  return { data: normalizeNotification(data), error: null };
}

/**
 * Marca todas las notificaciones del usuario como leídas.
 * @param {string} userId
 * @returns {{ data, error }}
 */
export async function markAllAsRead(userId) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };

  const { error } = await supabase
    .from(TABLE)
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) return { data: null, error };
  return { data: { ok: true }, error: null };
}

/**
 * Suscripción Realtime a notificaciones del usuario.
 * @param {string} userId
 * @param {Function} onNotification - (notification) => void
 * @returns {() => void} unsubscribe
 */
export function subscribeNotifications(userId, onNotification) {
  const supabase = getSupabase();
  if (!supabase || !userId) return () => {};

  const channel = supabase
    .channel(`notifications_${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: TABLE,
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new;
        if (row && onNotification) {
          onNotification(normalizeNotification(row));
        }
      }
    )
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch (_) {}
  };
}

```

================================================================
FILE: src/services/profilesSupabase.js
================================================================
```js
/**
 * Servicio de perfiles (Supabase).
 * Sustituye base44.auth.updateMe para preferencias de usuario.
 */
import { getSupabase } from '@/lib/supabaseClient';

/**
 * Actualiza el perfil del usuario.
 * @param {string} userId
 * @param {Object} updates - { notifications_enabled?, notify_reservations?, notify_payments?, notify_proximity?, notify_promotions? }
 * @returns {{ data, error }}
 */
export async function updateProfile(userId, updates) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };

  const row = {};
  if (updates.notifications_enabled != null) row.notifications_enabled = updates.notifications_enabled;
  if (updates.email_notifications != null) row.email_notifications = updates.email_notifications;
  if (updates.notify_reservations != null) row.notify_reservations = updates.notify_reservations;
  if (updates.notify_payments != null) row.notify_payments = updates.notify_payments;
  if (updates.notify_proximity != null) row.notify_proximity = updates.notify_proximity;
  if (updates.notify_promotions != null) row.notify_promotions = updates.notify_promotions;

  if (Object.keys(row).length === 0) return { data: null, error: null };

  const { data, error } = await supabase
    .from('profiles')
    .update(row)
    .eq('id', userId)
    .select()
    .single();

  if (error) return { data: null, error };
  return { data, error: null };
}

```

================================================================
FILE: src/services/realtime/alertsRealtime.js
================================================================
```js
/**
 * Supabase Realtime para public.parking_alerts.
 * Escucha INSERT, UPDATE, DELETE.
 * Soporta esquema nuevo (seller_id, price_cents) y legacy (user_id, price).
 * No explota si la tabla no existe (maneja error).
 */
import { getSupabase } from '@/lib/supabaseClient';
import { useAppStore } from '@/state/appStore';

/**
 * @param {Object} opts
 * @param {Function} [opts.onUpsert] - (alert) => void
 * @param {Function} [opts.onDelete] - (id) => void
 * @returns {() => void} unsubscribe
 */
export function subscribeActiveAlerts({ onUpsert, onDelete } = {}) {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel('parking_alerts_realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'parking_alerts',
      },
      (payload) => {
        const row = payload.new;
        if (row && row.status === 'active' && onUpsert) {
          onUpsert(normalizeAlert(row));
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'parking_alerts',
      },
      (payload) => {
        const row = payload.new;
        if (row && onUpsert) {
          onUpsert(normalizeAlert(row));
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'parking_alerts',
      },
      (payload) => {
        const id = payload.old?.id;
        if (id && onDelete) onDelete(id);
      }
    )
    .subscribe((status, err) => {
      if (err) {
        console.error('Realtime parking_alerts error:', err);
        try {
          useAppStore.getState().setError('realtime_error');
        } catch (_) {}
      }
    });

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch (_) {}
  };
}

function normalizeAlert(row) {
  const sellerId = row.seller_id ?? row.user_id;
  const price = row.price_cents != null ? row.price_cents / 100 : (row.price ?? 0);
  const meta = row.metadata || {};
  return {
    id: row.id,
    user_id: sellerId,
    seller_id: sellerId,
    lat: row.lat,
    lng: row.lng,
    latitude: row.lat,
    longitude: row.lng,
    price,
    price_cents: row.price_cents,
    vehicle_type: row.vehicle_type ?? meta.vehicle_type ?? 'car',
    status: row.status,
    reserved_by: row.reserved_by ?? null,
    created_at: row.created_at,
    expires_at: row.expires_at,
    geohash: row.geohash ?? null,
    address_text: row.address_text,
  };
}

```
