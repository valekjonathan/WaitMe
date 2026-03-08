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

  const { data, error } = await supabase.from(TABLE).insert(row).select().single();

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
    } catch (error) {
      console.error('[WaitMe Error]', error);
    }
  };
}
