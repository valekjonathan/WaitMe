# Arquitectura Mapa Tipo Uber — WaitMe Aplicada

**Fecha:** 2026-03-07

---

## 1. Estado actual

- **MapboxMap:** DOM markers (getCarWithPriceHtml) para coches
- **User pin:** DOM marker cuando !useCenterPin
- **Base GeoJSON:** lib/mapLayers/geojsonUtils.js

---

## 2. Capas objetivo

| Capa | Función | Estado |
|------|---------|--------|
| StaticCarsLayer | Coches estáticos, GeoJSON source + layers | Base en geojsonUtils |
| WaitMeCarLayer | 1 coche dinámico (WAITME_ACTIVE) | Pendiente |
| UserLocationLayer | Ubicación usuario | Base en userLocationToFeature |

---

## 3. Regla fija

- Coches estáticos siempre
- Solo 1 coche dinámico si: WaitMe aceptado + usuario en "Estoy aparcado aquí" + viendo venir al coche

---

## 4. Migración

- **geojsonUtils:** alertsToGeoJSON(), userLocationToFeature()
- **MapboxMap:** mantiene DOM markers (apariencia actual)
- **Próximo paso:** Añadir GeoJSON source + circle/symbol layer en MapboxMap; switch opcional useGeoJsonLayers
