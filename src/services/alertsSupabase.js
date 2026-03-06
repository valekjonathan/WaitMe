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
