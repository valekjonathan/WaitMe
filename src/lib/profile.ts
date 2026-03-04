export function normalizeProfile(profile = {}) {
  return {
    full_name: String(profile.full_name || profile.name || "").trim(),
    phone: String(profile.phone || profile.phone_number || "").trim(),
    brand: String(profile.brand || profile.car_brand || "").trim(),
    model: String(profile.model || profile.car_model || "").trim(),
    color: String(profile.color || profile.car_color || "").trim(),
    vehicle_type: String(profile.vehicle_type || profile.vehicle || profile.car_type || "").trim(),
    plate: String(profile.plate || profile.license_plate || profile.car_plate || "").trim(),
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
    car_brand: p.brand,
    car_model: p.model,
    car_color: p.color || 'gris',
    vehicle_type: p.vehicle_type || 'car',
    car_plate: p.plate,
    avatar_url: formData?.avatar_url ?? '',
    allow_phone_calls: formData?.allow_phone_calls ?? false,
    notifications_enabled: formData?.notifications_enabled !== false,
    email_notifications: formData?.email_notifications !== false,
    updated_at: new Date().toISOString(),
  };
}
