/**
 * Reverse geocode usando Nominatim (OpenStreetMap).
 * Usado por CreateAlertCard Ubícate para actualizar la dirección.
 */

function formatAddress(road, number, city) {
  let streetFormatted = (road || '').trim();
  if (streetFormatted.toLowerCase().startsWith('calle ')) {
    streetFormatted = 'C/ ' + streetFormatted.slice(6);
  } else if (streetFormatted.toLowerCase().startsWith('avenida ')) {
    streetFormatted = 'Av. ' + streetFormatted.slice(8);
  }
  const parts = [streetFormatted, number, city].filter(Boolean);
  return parts.length ? parts.join(', ') : '';
}

/**
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string>} Dirección formateada o string vacío
 */
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=19&addressdetails=1`
    );
    const data = await res.json();
    if (!data?.address) return '';
    const a = data.address;
    const road = a.road || a.pedestrian || a.footway || a.path || a.street || a.cycleway || '';
    const number = a.house_number || '';
    const city = a.city || a.town || a.village || a.municipality || '';
    return formatAddress(road, number, city) || data.display_name?.split(',')[0] || '';
  } catch {
    return '';
  }
}
