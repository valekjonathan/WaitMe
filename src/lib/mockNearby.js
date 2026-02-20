// ================================
// FILE: src/lib/mockNearby.js
// ================================

const OVIEDO_LAT = 43.3623;
const OVIEDO_LNG = -5.8489;

// 10 usuarios fijos (fotos realistas) + datos completos
export const MOCK_USERS = [
  {
    id: 'mock_u1',
    name: 'Sofía',
    photo: 'https://randomuser.me/api/portraits/women/68.jpg',
    vehicle_type: 'car',
    car_model: 'SEAT León',
    car_color: 'blanco',
    plate: '1234 JKL',
    phone: '+34 612 345 901'
  },
  {
    id: 'mock_u2',
    name: 'Hugo',
    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
    vehicle_type: 'suv',
    car_model: 'Nissan Qashqai',
    car_color: 'gris',
    plate: '5678 MNP',
    phone: '+34 611 224 872'
  },
  {
    id: 'mock_u3',
    name: 'Nuria',
    photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    vehicle_type: 'van',
    car_model: 'Volkswagen Transporter',
    car_color: 'negro',
    plate: '9012 BCD',
    phone: '+34 613 908 771'
  },
  {
    id: 'mock_u4',
    name: 'Iván',
    photo: 'https://randomuser.me/api/portraits/men/75.jpg',
    vehicle_type: 'car',
    car_model: 'Renault Clio',
    car_color: 'rojo',
    plate: '3456 FGH',
    phone: '+34 610 552 330'
  },
  {
    id: 'mock_u5',
    name: 'Marco',
    photo: 'https://randomuser.me/api/portraits/men/12.jpg',
    vehicle_type: 'car',
    car_model: 'Peugeot 208',
    car_color: 'azul',
    plate: '7890 QRS',
    phone: '+34 614 401 992'
  },
  {
    id: 'mock_u6',
    name: 'Laura',
    photo: 'https://randomuser.me/api/portraits/women/12.jpg',
    vehicle_type: 'suv',
    car_model: 'Kia Sportage',
    car_color: 'verde',
    plate: '2468 TUV',
    phone: '+34 615 993 120'
  },
  {
    id: 'mock_u7',
    name: 'Dani',
    photo: 'https://randomuser.me/api/portraits/men/46.jpg',
    vehicle_type: 'car',
    car_model: 'Toyota Corolla',
    car_color: 'negro',
    plate: '1357 WXY',
    phone: '+34 616 220 415'
  },
  {
    id: 'mock_u8',
    name: 'Paula',
    photo: 'https://randomuser.me/api/portraits/women/25.jpg',
    vehicle_type: 'van',
    car_model: 'Mercedes Vito',
    car_color: 'gris',
    plate: '8642 ZAB',
    phone: '+34 617 882 064'
  },
  {
    id: 'mock_u9',
    name: 'Álvaro',
    photo: 'https://randomuser.me/api/portraits/men/19.jpg',
    vehicle_type: 'car',
    car_model: 'Volkswagen Golf',
    car_color: 'blanco',
    plate: '9753 CDE',
    phone: '+34 618 771 203'
  },
  {
    id: 'mock_u10',
    name: 'Claudia',
    photo: 'https://randomuser.me/api/portraits/women/55.jpg',
    vehicle_type: 'suv',
    car_model: 'Hyundai Tucson',
    car_color: 'morado',
    plate: '1122 FJK',
    phone: '+34 619 330 778'
  }
];

export function getMockNearbyAlerts(userLocation) {
  const baseLat = Array.isArray(userLocation) ? Number(userLocation[0]) : Number(userLocation?.latitude ?? userLocation?.lat);
  const baseLng = Array.isArray(userLocation) ? Number(userLocation[1]) : Number(userLocation?.longitude ?? userLocation?.lng);

  const lat0 = Number.isFinite(baseLat) ? baseLat : OVIEDO_LAT;
  const lng0 = Number.isFinite(baseLng) ? baseLng : OVIEDO_LNG;

  // offsets fijos (no aleatorios) para que siempre estén “cerca alrededor”
  const offsets = [
    [ 0.0010,  0.0015],
    [ 0.0018, -0.0008],
    [-0.0012,  0.0011],
    [-0.0020, -0.0016],
    [ 0.0006, -0.0022],
    [ 0.0024,  0.0009],
    [-0.0007,  0.0026],
    [-0.0026,  0.0004],
    [ 0.0013, -0.0019],
    [-0.0016, -0.0003]
  ];

  const now = Date.now();
  const streets = [
    'Calle Uría, n18, Oviedo',
    'Calle Cervantes, n7, Oviedo',
    'Calle Campoamor, n12, Oviedo',
    'Calle Rosal, n3, Oviedo',
    'Calle Jovellanos, n9, Oviedo',
    'Avenida de Galicia, n22, Oviedo',
    'Calle Milicias Nacionales, n5, Oviedo',
    'Calle San Francisco, n14, Oviedo',
    'Calle Martínez Marina, n6, Oviedo',
    'Calle Independencia, n11, Oviedo'
  ];

  const minutes = [8, 12, 15, 18, 10, 22, 14, 9, 16, 20];
  const prices  = [6, 8, 7, 9, 5, 10, 6, 7, 8, 9];

  return MOCK_USERS.map((u, i) => {
    const [dLat, dLng] = offsets[i] || [0, 0];
    const available = minutes[i] || 15;
    const created = now - (i + 1) * 60 * 1000;

    return {
      id: `mock_alert_${u.id}`,
      user_id: u.id,
      user_name: u.name,
      user_photo: u.photo,

      // “todos los datos”
      car_model: u.car_model,
      plate: u.plate,
      phone: u.phone,

      vehicle_type: u.vehicle_type,
      car_color: u.car_color,

      address: streets[i] || 'Calle Gran Vía, n1, Oviedo',

      latitude: lat0 + dLat,
      longitude: lng0 + dLng,

      price: prices[i] || 8,
      available_in_minutes: available,
      created_date: created,
      wait_until: created + available * 60 * 1000,
      status: 'active'
    };
  });
}
