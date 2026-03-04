export function isProfileComplete(profile) {
  if (!profile) return false;

  const brand = profile.brand ?? profile.car_brand;
  const model = profile.model ?? profile.car_model;
  const color = profile.color ?? profile.car_color;
  const plate = profile.plate ?? profile.car_plate;

  return (
    !!profile.full_name?.trim() &&
    !!profile.phone?.trim() &&
    !!brand?.trim() &&
    !!model?.trim() &&
    !!color?.trim() &&
    !!profile.vehicle_type?.trim() &&
    !!plate?.trim()
  );
}
