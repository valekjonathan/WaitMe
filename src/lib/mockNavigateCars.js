/**
 * 20 coches mock para modo "Dónde quieres aparcar" (navigate/search).
 * Dispersos en radio pequeño alrededor del usuario.
 * Datos nunca vacíos: foto, nombre, coche, matrícula mock obligatorios.
 */

const OVIEDO_CENTER = { lat: 43.3619, lng: -5.8494 };

const NAMES = [
  'Sofía',
  'Hugo',
  'Nuria',
  'Iván',
  'Marco',
  'Laura',
  'Dani',
  'Paula',
  'Álvaro',
  'Claudia',
  'Carlos',
  'Elena',
  'Miguel',
  'Ana',
  'Pablo',
  'Lucía',
  'David',
  'Carmen',
  'Javier',
  'Isabel',
];
const COLORS = ['white', 'black', 'blue', 'red', 'gray', 'green', 'purple', 'orange'];
const VEHICLE_TYPES = ['car', 'car', 'car', 'suv', 'van'];
const BRANDS = ['Seat', 'Volkswagen', 'Renault', 'Peugeot', 'Ford', 'Opel', 'Toyota', 'Hyundai'];
const MODELS = ['León', 'Golf', 'Clio', '208', 'Focus', 'Corsa', 'Corolla', 'i20'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function spanishPlate() {
  const digits = String(randomInt(1000, 9999));
  const letters = 'BCDFGHJKLMNPRSTVWXYZ';
  const L = letters[randomInt(0, letters.length - 1)];
  const L2 = letters[randomInt(0, letters.length - 1)];
  const L3 = letters[randomInt(0, letters.length - 1)];
  return `${digits} ${L}${L2}${L3}`;
}

function avatarUrl(name) {
  const encoded = encodeURIComponent(name || 'U');
  return `https://ui-avatars.com/api/?name=${encoded}&background=8b5cf6&color=fff&size=128`;
}

/**
 * Genera 20 coches mock dispersos en radio pequeño (~200m) alrededor del usuario.
 * @param {number[]|{lat:number,lng:number}[]} userLocation - [lat, lng] o {lat, lng}
 * @returns {Array} 20 alertas con id, nombre, precio, distancia, tiempo restante
 */
export function getMockNavigateCars(userLocation) {
  const baseLat = Array.isArray(userLocation)
    ? userLocation[0]
    : (userLocation?.lat ?? OVIEDO_CENTER.lat);
  const baseLng = Array.isArray(userLocation)
    ? userLocation[1]
    : (userLocation?.lng ?? OVIEDO_CENTER.lng);

  const now = Date.now();
  const result = [];

  // Radio inicial 1 km (0.009° ≈ 1 km en latitud a 43°N)
  const RADIUS = 0.009;

  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * 2 * Math.PI + Math.random() * 0.5;
    const r = RADIUS * (0.3 + Math.random() * 0.7);
    const dLat = r * Math.cos(angle);
    const dLng = r * Math.sin(angle);
    const lat = baseLat + dLat;
    const lng = baseLng + dLng;

    const price = randomInt(2, 8);
    const available_in_minutes = [5, 10, 15, 20][i % 4];
    const created = now - (i + 1) * 30 * 1000;
    const waitUntil = new Date(created + available_in_minutes * 60 * 1000);

    const name = NAMES[i % NAMES.length];

    result.push({
      id: `mock_nav_${i}`,
      user_id: `mock_u${i + 1}`,
      user_name: name,
      user_photo: avatarUrl(name),

      vehicle_type: pick(VEHICLE_TYPES),
      vehicle_color: pick(COLORS),
      color: pick(COLORS),
      brand: pick(BRANDS),
      model: pick(MODELS),
      plate: spanishPlate(),

      address: `Calle ${name}, ${randomInt(1, 30)}, Oviedo`,

      latitude: lat,
      longitude: lng,
      lat,
      lng,

      price,
      available_in_minutes,
      availableInMinutes: available_in_minutes,
      created_date: created,
      wait_until: waitUntil.toISOString(),
      status: 'active',

      is_mock: true,
    });
  }

  return result;
}
