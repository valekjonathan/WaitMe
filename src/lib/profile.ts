export function normalizeProfile(profile) {
  const p = profile ?? {};
  return {
    full_name: String(p.full_name || p.name || "").trim(),
    phone: String(p.phone || p.phone_number || "").trim(),
    brand: String(p.brand || "").trim(),
    model: String(p.model || "").trim(),
    color: String(p.color || "").trim(),
    vehicle_type: String(p.vehicle_type || p.vehicle || "").trim(),
    plate: String(p.plate || "").trim(),
  };
}

export function getMissingProfileFields(profile) {
  const p = normalizeProfile(profile);
  const missing = [];
  if (!p.full_name) missing.push("Nombre");
  if (!p.phone) missing.push("Teléfono");
  if (!p.brand) missing.push("Marca");
  if (!p.model) missing.push("Modelo");
  if (!p.color) missing.push("Color");
  if (!p.vehicle_type) missing.push("Vehículo");
  if (!p.plate) missing.push("Matrícula");
  return missing;
}

export function isProfileComplete(profile) {
  return getMissingProfileFields(profile).length === 0;
}

/** Crea payload para Supabase profiles desde formData */
export function toProfilePayload(formData) {
  const p = normalizeProfile(formData);
  return {
    full_name: p.full_name,
    phone: p.phone,
    brand: p.brand,
    model: p.model,
    color: p.color || 'gris',
    vehicle_type: p.vehicle_type || 'car',
    plate: p.plate,
    avatar_url: formData?.avatar_url ?? '',
    allow_phone_calls: formData?.allow_phone_calls ?? false,
    notifications_enabled: formData?.notifications_enabled !== false,
    email_notifications: formData?.email_notifications !== false,
  };
}
