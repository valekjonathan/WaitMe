const ALIASES = {
  full_name: ["full_name", "name", "nombre"],
  phone: ["phone", "telefono", "teléfono"],
  car_brand: ["car_brand", "brand", "marca"],
  car_model: ["car_model", "model", "modelo"],
  car_color: ["car_color", "color"],
  car_type: ["car_type", "vehicle_type", "vehiculo", "vehículo", "vehicle"],
  car_plate: ["car_plate", "plate", "matricula", "matrícula"],
  avatar_url: ["avatar_url", "avatar", "photo_url", "picture"],
};

export function getProfileField(profile, keysArray) {
  if (!profile) return "";
  for (const key of keysArray) {
    const v = profile[key];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

export function normalizeProfile(profile) {
  if (!profile) {
    return {
      full_name: "",
      phone: "",
      car_brand: "",
      car_model: "",
      car_color: "",
      car_type: "",
      car_plate: "",
      avatar_url: "",
    };
  }
  return {
    full_name: getProfileField(profile, ALIASES.full_name),
    phone: getProfileField(profile, ALIASES.phone),
    car_brand: getProfileField(profile, ALIASES.car_brand),
    car_model: getProfileField(profile, ALIASES.car_model),
    car_color: getProfileField(profile, ALIASES.car_color),
    car_type: getProfileField(profile, ALIASES.car_type),
    car_plate: getProfileField(profile, ALIASES.car_plate),
    avatar_url: getProfileField(profile, ALIASES.avatar_url),
  };
}

export function isProfileComplete(profile) {
  const n = normalizeProfile(profile);
  return (
    n.full_name !== "" &&
    n.phone !== "" &&
    n.car_brand !== "" &&
    n.car_model !== "" &&
    n.car_color !== "" &&
    n.car_type !== "" &&
    n.car_plate !== ""
  );
}
