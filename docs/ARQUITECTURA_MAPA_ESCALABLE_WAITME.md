# Arquitectura del mapa escalable — WaitMe

**Fecha:** 2026-03-06

---

## 1. Estado actual (auditoría)

| Elemento | Implementación actual |
|----------|------------------------|
| Coches | Markers DOM (`mapboxgl.Marker`) en MapboxMap y ParkingMap |
| Usuario | Marker DOM o CenterPin |
| WaitMe dinámico | SellerLocationTracker + buyerLocations como markers |
| Carga | Todos los coches visibles en el mapa actual |
| Clusters | No implementados |
| vehicleIcons | `getCarWithPriceHtml`, `getCarIconHtml` — HTML para markers |
| mockNavigateCars | Datos de prueba en Navigate |

**Archivos clave:**
- `src/components/MapboxMap.jsx` — mapa principal Home
- `src/components/map/ParkingMap.jsx` — mapa en Create/Navigate
- `src/lib/vehicleIcons.js` — iconos HTML
- `src/components/SellerLocationTracker.jsx` — coche del comprador en ruta

---

## 2. Arquitectura objetivo (sin cambiar UI)

### 2.1 StaticCarsLayer
- Coches estáticos
- Render con source/layer GeoJSON de Mapbox (no markers DOM)
- Carga por viewport: solo coches en radio de interés (ej. 1 km) o área visible
- Migración gradual: si no viable ya, dejar plan y base preparada

### 2.2 WaitMeCarLayer
- Solo 1 coche dinámico
- Visible solo cuando `WAITME_ACTIVE`
- Solo en "Estoy aparcado aquí" (History con alertas reservadas)
- Regla: coches NO se mueven salvo este caso

### 2.3 UserLocationLayer
- Usuario (pin + bolita)
- Posición precisa inicial vía `getPreciseInitialLocation()`

### 2.4 Carga por viewport
- Al entrar en "Dónde quieres aparcar": coches en radio 1 km
- Zoom out: más coches
- Mover mapa: cargar/mostrar coches del área visible
- No renderizar toda la ciudad

### 2.5 Clusters (opcional)
- Solo cuando zoom amplio y mucha densidad
- Al pulsar cluster o coche: tarjeta con datos del coche/usuario

---

## 3. Plan de migración

| Fase | Acción |
|------|--------|
| 1 | Crear `StaticCarsLayer.jsx` con GeoJSON source + symbol layer |
| 2 | Integrar en MapboxMap cuando `alerts` existan |
| 3 | Mantener markers DOM como fallback hasta validar |
| 4 | Añadir carga por viewport (query por bbox) |
| 5 | WaitMeCarLayer separado para coche dinámico |
| 6 | Clusters solo si hace falta |

---

## 4. No duplicar

- Un solo MapboxMap (no ParkingMap duplicado)
- Reutilizar vehicleIcons para símbolos (convertir a imagen/data URL si hace falta)
- mockNavigateCars: mantener para tests; no en producción

---

## 5. Regla fija

**Los coches NO se mueven nunca**, salvo:
1. WaitMe aceptado
2. Usuario en "Estoy aparcado aquí"
3. Ve venir al coche hacia él
