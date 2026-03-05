/**
 * Servicio de alertas de parking (Supabase).
 * Capa de sustitución para base44.entities.ParkingAlert.
 * Usa schema: parking_alerts (seller_id, price_cents, address_text, geohash, metadata).
 */
import { getSupabase } from '@/lib/supabaseClient';
import { encode, getNeighborPrefixes } from '@/lib/geohash';

const TABLE = 'parking_alerts';

/**
 * Normaliza fila de Supabase a formato unificado (compatible con app).
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
    status: row.status,
    reserved_by: row.reserved_by ?? null,
    reserved_by_id: row.reserved_by ?? meta.reserved_by_id ?? null,
    brand: meta.brand ?? row.brand ?? (carParts[0] || ''),
    model: meta.model ?? row.model ?? (carParts.slice(1).join(' ') || ''),
    plate: meta.plate ?? meta.reserved_by_plate ?? row.plate ?? null,
    color: meta.color ?? row.color ?? null,
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
 * Obtiene alertas activas cerca de (lat, lng) usando geohash.
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusKm
 * @returns {{ data: Array, error }}
 */
export async function getNearbyAlerts(lat, lng, radiusKm = 2) {
  const supabase = getSupabase();
  if (!supabase) return { data: [], error: new Error('Supabase no configurado') };

  const geohash = encode(lat, lng, 7);
  const prefixes = getNeighborPrefixes(geohash, radiusKm);
  const orFilter = prefixes.map((p) => `geohash.ilike.${p}%`).join(',');

  let query = supabase.from(TABLE).select('*').eq('status', 'active');
  if (orFilter) {
    query = query.or(orFilter);
  }
  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) return { data: [], error };
  return { data: (data ?? []).map(normalizeAlert), error: null };
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
