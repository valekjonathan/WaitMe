# Auditoría quirúrgica mapas y ubicación — WaitMe

**Fecha:** 2026-03-07

---

## 1. Por qué la ubicación sigue siendo mala

| Causa | Detalle |
|-------|---------|
| **Dos flujos de ubicación** | MapboxMap tiene su propio `watchPosition` + `getPreciseInitialLocation`; además recibe `locationFromEngine`. Si `locationFromEngine` llega tarde, el mapa usa posición interna (Oviedo o GPS inicial). |
| **Orden de prioridad** | `effectiveCenter = initialCenter ?? engineCenter ?? location`. Si `initialLocation` viene de CreateAlertCard (getPreciseInitialLocation), puede ser correcto. Si `locationFromEngine` domina después, puede ser posición suavizada (Kalman). |
| **Primera posición** | MapboxMap usa `getPreciseInitialLocation` en un efecto cuando `locationFromEngine == null`. Correcto. Pero si Home pasa `locationFromEngine` desde LocationEngineStarter, el engine puede no haber emitido aún. |
| **Ubícate** | CreateAlertCard llama `getPreciseInitialLocation` y pasa a MapboxMap vía `onRecenterRef`/`initialLocation`. El mapa hace `flyTo`. Puede haber race si el mapa no está listo. |
| **Smoothing/Kalman** | La primera posición del pipeline NO debería usarse para el centro inicial. `getPreciseInitialLocation` es la fuente correcta. El pipeline entra después con `startLocationEngine({ pipeline: true })`. |
| **Map matching** | Con `VITE_USE_MAP_MATCHING=true`, el pipeline proyecta sobre carretera. Puede mejorar o empeorar según la API. Por defecto identity. |

---

## 2. Validación de flujos

| Flujo | Fuente correcta | Estado |
|-------|-----------------|--------|
| Home inicial | getPreciseInitialLocation (MapboxMap effect) | OK si locationFromEngine null al inicio |
| Create / Ubícate | getPreciseInitialLocation (CreateAlertCard) | OK |
| Navigate | useLocationEngine (locationEngine) | OK |
| Pago por proximidad | transactionEngine con distanceEngine | OK |

---

## 3. Race conditions

- **Home:** LocationEngineStarter arranca el engine. Home pasa `locationFromEngine` a MapboxMap. Si el engine emite antes de que MapboxMap monte, puede perderse. Si MapboxMap monta antes, usa su propio getPreciseInitialLocation hasta que locationFromEngine llegue.
- **MapboxMap effect:** Cuando `locationFromEngine != null`, no usa getPreciseInitialLocation. Usa engineCenter. El engine puede estar emitiendo posiciones suavizadas.

---

## 4. Recomendaciones

1. **Primera posición:** Siempre usar getPreciseInitialLocation para el centro inicial del mapa. No usar locationFromEngine para el primer frame.
2. **Ubícate:** Mantener getPreciseInitialLocation; asegurar que onRecenterRef se llama con la posición correcta.
3. **Un solo watcher:** El locationEngine debe ser la fuente única para actualizaciones en tiempo real. MapboxMap no debería tener su propio watchPosition si locationFromEngine está activo. Revisar: cuando locationFromEngine existe, el efecto de watchPosition no corre (early return). Correcto.
4. **Pin y centro:** CenterPin y effectiveCenter deben representar la misma posición. Validar que initialLocation/engineCenter se propagan bien.

---

## 5. MapboxMap vs ParkingMap

- **MapboxMap:** Home, Create (CreateMapOverlay), Search (SearchMapOverlay). Un solo mapa base.
- **ParkingMap:** Navigate. Componente distinto, también usa Mapbox. No duplicar; unificar en el futuro con capas (StaticCarsLayer, etc.).
