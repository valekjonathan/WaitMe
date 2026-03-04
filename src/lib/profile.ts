export function normalizeProfile(profile = {}) {
  return {
    full_name:
      profile.full_name ||
      profile.name ||
      "",

    phone:
      profile.phone ||
      profile.phone_number ||
      "",

    brand:
      profile.brand ||
      profile.car_brand ||
      "",

    model:
      profile.model ||
      profile.car_model ||
      "",

    color:
      profile.color ||
      profile.car_color ||
      "",

    vehicle_type:
      profile.vehicle_type ||
      profile.vehicle ||
      profile.car_type ||
      "",

    plate:
      profile.plate ||
      profile.license_plate ||
      profile.car_plate ||
      "",
  };
}

export function isProfileComplete(profile) {
  const p = normalizeProfile(profile);

  return (
    p.full_name &&
    p.phone &&
    p.brand &&
    p.model &&
    p.color &&
    p.vehicle_type &&
    p.plate
  );
}
