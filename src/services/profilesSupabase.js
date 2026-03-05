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
