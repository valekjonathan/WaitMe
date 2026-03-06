/**
 * Dataset mock temporal para probar UI en Oviedo.
 * ~50 alertas distribuidas alrededor del usuario y por Oviedo.
 * Solo se usa cuando la base de datos devuelve pocas alertas.
 */

const OVIEDO_CENTER = { lat: 43.3619, lng: -5.8494 };

const VEHICLE_TYPES = ['car', 'van', 'suv'];
const COLORS = ['white', 'black', 'blue', 'red', 'gray', 'green', 'yellow', 'purple', 'orange'];
const STREETS = [
  'Calle Uría', 'Calle Cervantes', 'Calle Campoamor', 'Calle Rosal', 'Calle Jovellanos',
  'Avenida de Galicia', 'Calle Milicias Nacionales', 'Calle San Francisco', 'Calle Martínez Marina',
  'Calle Independencia', 'Calle Fruela', 'Calle Mon', 'Calle Toreno', 'Calle Asturias',
  'Plaza Escandalera', 'Calle Gil de Jaz', 'Calle Gascona', 'Plaza de la Catedral',
  'Calle Palacio Valdés', 'Calle Magdalena', 'Calle Caveda', 'Calle Posada Herrera',
  'Calle Santa Cruz', 'Calle San Juan', 'Calle Rúa', 'Calle Canóniga', 'Calle Altamirano',
];

const NAMES = ['Sofía', 'Hugo', 'Nuria', 'Iván', 'Marco', 'Laura', 'Dani', 'Paula', 'Álvaro', 'Claudia', 'Carlos', 'Elena', 'Miguel', 'Ana', 'Pablo'];

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function randomInt(min, max) {
  return Math.floor(randomInRange(min, max + 1));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Genera ~50 alertas mock en Oviedo.
 * @param {Object} userLocation - { lat, lng } o [lat, lng]
 * @returns {Array} alertas con estructura compatible con MapboxMap
 */
export function getMockOviedoAlerts(userLocation) {
  const baseLat = Array.isArray(userLocation) ? userLocation[0] : userLocation?.lat ?? OVIEDO_CENTER.lat;
  const baseLng = Array.isArray(userLocation) ? userLocation[1] : userLocation?.lng ?? OVIEDO_CENTER.lng;

  const now = Date.now();
  const result = [];
  const count = 50;

  // Offsets para distribuir: algunos cerca del usuario, otros repartidos por Oviedo
  const offsets = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI * 3 + Math.random() * 0.5;
    const r = 0.0015 * (0.2 + (i % 5) * 0.2) + Math.random() * 0.003;
    offsets.push([r * Math.cos(angle), r * Math.sin(angle)]);
  }

  for (let i = 0; i < count; i++) {
    const [dLat, dLng] = offsets[i];
    const lat = baseLat + dLat;
    const lng = baseLng + dLng;

    const price = randomInt(2, 10);
    const available_in_minutes = [5, 10, 15, 20, 25, 30][i % 6];
    const created = now - (i + 1) * 45 * 1000;

    result.push({
      id: `mock_oviedo_${i}_${Date.now()}`,
      user_id: `mock_u${(i % 10) + 1}`,
      user_name: pick(NAMES),
      user_photo: null,

      vehicle_type: pick(VEHICLE_TYPES),
      vehicle_color: pick(COLORS),
      color: pick(COLORS),

      address: `${pick(STREETS)}, ${randomInt(1, 50)}, Oviedo`,

      latitude: lat,
      longitude: lng,
      lat,
      lng,

      price,
      available_in_minutes,
      availableInMinutes: available_in_minutes,
      created_date: created,
      wait_until: new Date(created + available_in_minutes * 60 * 1000).toISOString(),
      status: 'active',

      is_mock: true,
    });
  }

  return result;
}
