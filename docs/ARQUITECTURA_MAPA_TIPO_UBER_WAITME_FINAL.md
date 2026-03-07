# Arquitectura Mapa Tipo Uber — WaitMe (Estado Final)

**Fecha:** 2026-03-07

---

## 1. Estado actual

| Capa | Implementación | Uso |
|------|----------------|-----|
| StaticCarsLayer | `addStaticCarsLayer()` en layers.js | **Activa** — MapboxMap.jsx líneas 416-422 |
| UserLocationLayer | `addUserLocationLayer()` en layers.js | **Activa** — MapboxMap.jsx líneas 424-434 (cuando !useCenterPin) |
| WaitMeCarLayer | No implementada | Solo 1 coche dinámico con WAITME_ACTIVE; actualmente no hay capa separada |

---

## 2. Reglas fijas (no cambiar)

- Los coches **NO** se mueven nunca
- Solo se mueve un coche cuando: WaitMe aceptado + "Estoy aparcado aquí" + usuario viendo venir al coche
- No duplicar MapboxMap
- No tocar Home.jsx salvo imprescindible

---

## 3. Arquitectura objetivo (referencia)

### 3.1 StaticCarsLayer
- GeoJSON source + circle/symbol layer
- Coches estáticos en navigate
- Radio inicial ~1 km
- Más coches al mover mapa/zoom según viewport
- **Todos quietos**

### 3.2 UserLocationLayer
- Ubicación usuario (GeoJSON point)
- Ya existe `addUserLocationLayer` en layers.js

### 3.3 WaitMeCarLayer
- Un solo coche dinámico
- Solo con WAITME_ACTIVE
- Solo en "Estoy aparcado aquí"

### 3.4 Interacción
- Click en coche → tarjeta actual (selectedAlert)
- nearest user por defecto
- No romper flujo existente

### 3.5 Clusters
- Solo si aportan con zoom amplio
- Actualmente: no implementados; justificado posponer

---

## 4. Código existente

**`src/lib/mapLayers/layers.js`:**
- `addStaticCarsLayer(map, alerts, onAlertClick)` — listo
- `addUserLocationLayer(map, userLoc)` — listo

**`src/lib/mapLayers/geojsonUtils.js`:**
- `alertsToGeoJSON(alerts)` — listo
- `userLocationToFeature(loc)` — listo

**MapboxMap.jsx:** Usa `addStaticCarsLayer` y `addUserLocationLayer` en useEffects (líneas 416-434). DOM markers legacy eliminados; markersRef se mantiene vacío por compatibilidad.

---

## 5. Migración completada

- StaticCarsLayer y UserLocationLayer ya activas en MapboxMap
- Click handlers sobre layers en layers.js (onAlertClick)
- markersRef legacy: limpiado, sin uso

**Pendiente opcional:** WaitMeCarLayer para el coche dinámico (WAITME_ACTIVE + "Estoy aparcado aquí"). Actualmente el flujo de coche en movimiento se gestiona por otro camino; no bloquea 10/10.
