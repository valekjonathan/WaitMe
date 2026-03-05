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
