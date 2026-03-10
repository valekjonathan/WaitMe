# Cursor Last Response

**timestamp:** 2026-03-10 15:58

---

## task_objective

Cerrar paridad visual real entre simulador e iPhone en Home. Eliminar debug visual mapCreated. Unificar fórmula de posicionamiento de la tarjeta flotante.

---

## root_cause_bloque_bajo_iphone

- **Causa:** Safe areas asimétricas (notch/Dynamic Island): `--header-h` > `--bottom-nav-h` en iPhone → el centro geométrico del overlay queda ~12px más abajo que en simulador.
- **Solución:** `transform: translateY(calc(-0.5 * (var(--header-h) - var(--bottom-nav-h))))` en el contenedor del contenido del overlay Home para compensar y centrar visualmente en el viewport.

---

## files_modified

- src/components/cards/CreateAlertCard.jsx — eliminado bloque debug visual (mapCreated, etc.)
- src/system/map/MapScreenPanel.jsx — fórmula única `bottom: calc(var(--bottom-nav-h) + 15px)`, eliminado cardShiftUp y paddingBottom duplicado
- src/components/CreateMapOverlay.jsx — eliminado prop cardShiftUp
- src/components/SearchMapOverlay.jsx — eliminado prop cardShiftUp
- src/pages/Home.jsx — añadido transform compensatorio para paridad simulador/iPhone

---

## debug_visual_eliminado

- Bloque JSX completo que mostraba: mapCreated, mapLoadedEvent, styleLoaded, controllerReady, locateFailureReason, lastFlyToResult
- Estado setDiagRefresh (ya no necesario)
- El diagnóstico por consola (handleLocate) se mantiene para depuración; no se renderiza nada en pantalla

---

## layout_arreglado

- MapScreenPanel: una sola fórmula `bottom: calc(var(--bottom-nav-h) + 15px)` sin padding/margin/translate extra
- Tarjeta flotante anclada de forma coherente
- Home overlay: transform compensatorio para centrado visual real con safe areas asimétricas

---

## paridad_simulador_iphone

- Misma fórmula de posicionamiento en ambos
- Mismo centrado visual del bloque central
- La única diferencia es el safe area nativo del dispositivo

---

## validation_result

- lint: OK
- typecheck: OK
- build: OK
- waitme:simulator: OK (app iniciada con live reload)
- waitme:state: OK

---

## blocked_areas_respected

- Pagos: NO tocado
- Login Google real: NO tocado
- Infraestructura: NO tocada
- Nuevas funciones: NO añadidas

---

## next_recommended_task

Verificar en iPhone físico que Home queda centrado y la tarjeta correctamente posicionada.
