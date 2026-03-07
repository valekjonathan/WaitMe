# Arquitectura mapa tipo Uber — WaitMe

**Fecha:** 2026-03-07

---

## 1. Estado actual

- **MapboxMap:** Home, Create, Search. Markers DOM (mapboxgl.Marker).
- **ParkingMap:** Navigate. Markers DOM.
- **Coches:** getCarWithPriceHtml, getCarIconHtml → HTML en markers.
- **Usuario:** Marker o CenterPin.
- **WaitMe dinámico:** SellerLocationTracker + buyerLocations.

---

## 2. Arquitectura objetivo

| Capa | Función |
|------|---------|
| **StaticCarsLayer** | Coches estáticos. GeoJSON source + symbol layer. Carga por viewport/radio 1 km. |
| **WaitMeCarLayer** | 1 coche dinámico. Solo cuando WAITME_ACTIVE en "Estoy aparcado aquí". |
| **UserLocationLayer** | Usuario (pin + bolita). Posición de getPreciseInitialLocation o locationEngine. |
| **Clusters** | Opcional. Solo si zoom amplio y densidad alta. Al pulsar, mostrar tarjeta. |

---

## 3. Reglas fijas

- Mismo mapa base en HOME / CREATE / NAVIGATE
- Mismo zoom base (16.5)
- HOME no se mueve
- CREATE / NAVIGATE solo mueven el mapa
- Coches estáticos siempre; solo 1 dinámico en WaitMe activo
- Radio 1 km al entrar en "Dónde quieres aparcar"
- Viewport query al mover mapa / zoom

---

## 4. Plan de migración

1. Crear StaticCarsLayer con GeoJSON source
2. Integrar en MapboxMap
3. Mantener markers DOM como fallback hasta validar
4. WaitMeCarLayer separado
5. Clusters solo si aporta

---

## 5. Referencia

Ver `docs/ARQUITECTURA_MAPA_ESCALABLE_WAITME.md`.
