/**
 * Servicio de transacciones (Supabase).
 * Sustituye base44.entities.Transaction.
 */
import { getSupabase } from '@/lib/supabaseClient';

const TABLE = 'transactions';

/**
 * Normaliza fila a formato esperado por History/HistoryBuyerView/HistorySellerView.
 */
function normalizeTransaction(row, { buyerProfile, sellerProfile, alert } = {}) {
  if (!row) return null;
  const meta = row.metadata || {};
  const alertMeta = alert?.metadata || {};
  return {
    id: row.id,
    buyer_id: row.buyer_id,
    seller_id: row.seller_id,
    alert_id: row.alert_id,
    amount: Number(row.amount) ?? 0,
    status: row.status || 'pending',
    address: row.address ?? meta.address ?? alert?.address ?? alert?.address_text ?? null,
    created_date: row.created_at,
    seller_name: meta.seller_name ?? sellerProfile?.full_name ?? 'Usuario',
    seller_photo_url: meta.seller_photo_url ?? sellerProfile?.avatar_url ?? null,
    buyer_name: meta.buyer_name ?? buyerProfile?.full_name ?? 'Usuario',
    buyer_photo_url: meta.buyer_photo_url ?? buyerProfile?.avatar_url ?? null,
    seller_car: meta.seller_car ?? ((`${alert?.brand || ''} ${alert?.model || ''}`.trim()) || null),
    seller_brand: meta.seller_brand ?? alert?.brand ?? null,
    seller_model: meta.seller_model ?? alert?.model ?? null,
    seller_plate: meta.seller_plate ?? alert?.plate ?? alertMeta?.reserved_by_plate ?? null,
    seller_color: meta.seller_color ?? alert?.color ?? null,
    buyer_car: meta.buyer_car ?? alertMeta?.reserved_by_car ?? null,
    buyer_brand: meta.buyer_brand ?? null,
    buyer_model: meta.buyer_model ?? null,
    buyer_plate: meta.buyer_plate ?? alertMeta?.reserved_by_plate ?? null,
    buyer_color: meta.buyer_color ?? null,
  };
}

/**
 * Crea una transacción.
 * @param {Object} payload - { buyer_id, seller_id, alert_id, amount, status?, seller_name?, buyer_name?, seller_earnings?, platform_fee?, address? }
 * @returns {{ data, error }}
 */
export async function createTransaction(payload) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };

  const row = {
    buyer_id: payload.buyer_id,
    seller_id: payload.seller_id,
    alert_id: payload.alert_id ?? null,
    amount: Number(payload.amount) ?? 0,
    status: payload.status || 'pending',
    seller_earnings: payload.seller_earnings != null ? Number(payload.seller_earnings) : null,
    platform_fee: payload.platform_fee != null ? Number(payload.platform_fee) : null,
    address: payload.address ?? null,
    metadata: {},
  };
  if (payload.seller_name) row.metadata.seller_name = payload.seller_name;
  if (payload.buyer_name) row.metadata.buyer_name = payload.buyer_name;
  if (payload.seller_photo_url) row.metadata.seller_photo_url = payload.seller_photo_url;
  if (payload.buyer_photo_url) row.metadata.buyer_photo_url = payload.buyer_photo_url;
  if (payload.seller_car) row.metadata.seller_car = payload.seller_car;
  if (payload.buyer_car) row.metadata.buyer_car = payload.buyer_car;
  if (payload.seller_plate) row.metadata.seller_plate = payload.seller_plate;
  if (payload.buyer_plate) row.metadata.buyer_plate = payload.buyer_plate;

  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select()
    .single();

  if (error) return { data: null, error };
  return { data: normalizeTransaction(data), error: null };
}

/**
 * Lista transacciones del usuario (como buyer o seller).
 * @param {string} userId
 * @param {Object} opts - { limit?: number }
 * @returns {{ data: Array, error }}
 */
export async function listTransactions(userId, opts = {}) {
  const supabase = getSupabase();
  if (!supabase) return { data: [], error: new Error('Supabase no configurado') };

  const limit = opts.limit ?? 5000;

  const { data: rows, error } = await supabase
    .from(TABLE)
    .select('*')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return { data: [], error };
  if (!rows?.length) return { data: [], error: null };

  const buyerIds = [...new Set(rows.map((r) => r.buyer_id).filter(Boolean))];
  const sellerIds = [...new Set(rows.map((r) => r.seller_id).filter(Boolean))];
  const alertIds = [...new Set(rows.map((r) => r.alert_id).filter(Boolean))];

  const [profilesRes, alertsRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, avatar_url').in('id', [...buyerIds, ...sellerIds]),
    alertIds.length
      ? supabase.from('parking_alerts').select('id, metadata, address_text').in('id', alertIds)
      : { data: [] },
  ]);

  const profileMap = Object.fromEntries((profilesRes?.data ?? []).map((p) => [p.id, p]));
  const alertMap = Object.fromEntries((alertsRes?.data ?? []).map((a) => [a.id, a]));

  const data = rows.map((r) =>
    normalizeTransaction(r, {
      buyerProfile: profileMap[r.buyer_id],
      sellerProfile: profileMap[r.seller_id],
      alert: alertMap[r.alert_id],
    })
  );
  return { data, error: null };
}
