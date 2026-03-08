/**
 * Acciones del perfil: guardar, subir foto, navegación.
 * @module hooks/profile/useProfileActions
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useLayoutHeader } from '@/lib/LayoutContext';

export function useProfileActions(data) {
  const navigate = useNavigate();
  const { user, profile, setProfile } = useAuth();
  const setHeader = useLayoutHeader();
  const [saving, setSaving] = useState(false);

  const { formData, setFormData } = data;

  const updateField = useCallback(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [setFormData]
  );

  const handleSave = useCallback(async () => {
    if (user?.id === 'dev-user') {
      setProfile({ ...profile, ...formData });
      navigate('/');
      return;
    }
    const supabase = getSupabase();
    if (!supabase) return;
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return;
    setSaving(true);
    try {
      const displayName = (formData.full_name || '').split(' ')[0] || formData.full_name || '';
      const { data: result, error } = await supabase
        .from('profiles')
        .upsert(
          {
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
          },
          { onConflict: 'id' }
        )
        .select()
        .single();
      if (error) {
        console.error('PROFILE SAVE ERROR:', error);
        alert('Error al guardar. Intenta de nuevo.');
        return;
      }
      if (result) setProfile(result);
      navigate('/');
    } catch (err) {
      console.error('PROFILE SAVE ERROR:', err);
      alert('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }, [formData, navigate, setProfile, user?.id, profile]);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    setHeader({ showBackButton: true, onBack: handleBack });
    return () => setHeader({ onBack: null });
  }, [handleBack, setHeader]);

  const handlePhotoUpload = useCallback(
    async (e) => {
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
        setFormData((prev) => ({ ...prev, avatar_url: urlData.publicUrl }));
      } catch (error) {
        console.error('Error subiendo foto:', error);
      }
    },
    [user?.id, setFormData]
  );

  const handlePlateChange = useCallback(
    (raw) => {
      const clean = (raw || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 7);
      setFormData((prev) => ({ ...prev, plate: clean }));
    },
    [setFormData]
  );

  return {
    updateField,
    handleSave,
    handleBack,
    handlePhotoUpload,
    handlePlateChange,
    saving,
  };
}
