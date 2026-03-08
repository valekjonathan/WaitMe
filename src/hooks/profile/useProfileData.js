/**
 * Datos del perfil: formulario, avatar, hidratación.
 * @module hooks/profile/useProfileData
 */

import { useState, useEffect, useRef } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useLayoutHeader, useSetProfileFormData } from '@/lib/LayoutContext';
import { formatPlate } from '@/utils/carUtils';
import { carColors } from '@/components/profile/VehicleIcons';

function normalizeAvatarPath(p) {
  if (!p) return '';
  const s = String(p).trim();
  if (!s) return '';
  if (s.startsWith('avatars/')) return s.slice('avatars/'.length);
  return s;
}

const INITIAL_FORM = {
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
};

export function useProfileData() {
  const { user, profile } = useAuth();
  const setProfileFormData = useSetProfileFormData();
  const hydratedOnceRef = useRef(false);
  const [_hydrated, setHydrated] = useState(false);

  const [formData, setFormData] = useState(INITIAL_FORM);

  let raw = formData?.avatar_url || profile?.avatar_url || '';
  raw = String(raw || '').trim();

  let avatarSrc = raw;
  if (avatarSrc && !avatarSrc.startsWith('http') && !avatarSrc.startsWith('data:')) {
    const path = normalizeAvatarPath(avatarSrc);
    const sb = getSupabase();
    if (sb) {
      const { data } = sb.storage.from('avatars').getPublicUrl(path);
      avatarSrc = data?.publicUrl || '';
    } else {
      avatarSrc = '';
    }
  }

  const nameForInitial = (formData?.full_name || profile?.full_name || '').trim();
  const initial = (nameForInitial ? nameForInitial[0] : '?').toUpperCase();

  const selectedColor = carColors.find((c) => c.value === formData.color) || carColors[5];

  useEffect(() => {
    if (!user?.id) return;
    if (hydratedOnceRef.current) return;
    hydratedOnceRef.current = true;

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
        console.error('PROFILE LOAD ERROR:', error);
        return;
      }
      if (data) {
        if (import.meta.env.VITE_DEBUG_OAUTH === 'true') {
          console.log('[Profile] datos reales de Supabase:', data.full_name, data.email);
        }
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

  useEffect(() => {
    setProfileFormData(formData);
    return () => setProfileFormData(null);
  }, [formData, setProfileFormData]);

  return {
    user,
    profile,
    formData,
    setFormData,
    avatarSrc,
    initial,
    selectedColor,
    carColors,
    formatPlate,
  };
}
