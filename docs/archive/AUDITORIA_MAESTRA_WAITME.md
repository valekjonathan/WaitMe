# Auditoría Maestra — WaitMe

**Fecha:** 2025-03-07  
**Objetivo:** Arquitectura profesional tipo Uber/Cabify/Bolt para mapa, overlays, scroll, CI y precisión.

---

## 1. ESTRUCTURA

### Árbol real
Ver `docs/ARBOL_REAL_PROYECTO_ACTUAL.md`.

### Pantallas principales
| Pantalla | Archivo | Ruta | Modo |
|----------|---------|------|------|
| HOME | Home.jsx | / | mode=null |
| CREATE (Estoy aparcado aquí) | Home.jsx | / | mode='create' |
| NAVIGATE (Dónde quieres aparcar) | Home.jsx | / | mode='search' |
| History | History.jsx | /history, /alertas | — |
| Navigate (ruta reservada) | Navigate.jsx | /navigate | — |
| Chats, Chat, Profile, Settings, etc. | — | — | — |

### Componentes de mapa (base compartida)
- **MapboxMap:** Un único mapa, `interactive={!!mode}`
- **MapViewportShell:** Viewport unificado
- **MapLayer / OverlayLayer:** Capas absolutas
- **CreateMapOverlay / SearchMapOverlay:** Misma estructura
- **MapScreenPanel:** Tarjeta flotante
- **CenterPin:** Palito + bolita
- **MapZoomControls:** Botones +/-

---

## 2. QUÉ ESTÁ BIEN

- **Un solo MapboxMap** en las 3 pantallas (HOME, CREATE, NAVIGATE)
- **Mismo zoom base** (16.5), pitch (30), estilo dark-v11
- **CreateMapOverlay y SearchMapOverlay** comparten estructura (MapScreenPanel, CenterPin, MapZoomControls)
- **MapScreenPanel** como fuente única de verdad para tarjeta
- **20 coches** en navigate (mockNavigateCars)
- **Usuario más cercano** seleccionado por defecto (useEffect en Home)
- **Bloqueo scroll** en Layout (html, body, #root overflow hidden, touch-action cuando ruta home)
- **touch-action** por zonas: MapboxMap pan-x pan-y cuando interactive, MapScreenPanel contain/none
- **Data layer** limpio: data/* → services/*Supabase
- **Tests de contratos** (mockNavigateCars, alerts, chat, etc.)

---

## 3. QUÉ ESTÁ MAL

### Scroll / drag
- **Gap card-nav = -56px** en CI: tarjeta solapa el nav (cardBottom > navTop)
- **Geometría inestable** en viewports variables (iPhone 14, safe-area)
- **main pb-24** (96px) + MapScreenPanel paddingBottom no alineados con BottomNavLayer

### CI / tests
- **8 tests con test.skip(!!process.env.CI)** ocultando fallos de gap y screenshot
- **Gap objetivo 15px**; main pb-0 en home para corregir -56px
- **Emails de CI failed** y Vercel failed preview

### Código
- **29 warnings** de lint (unused vars)
- **mockOviedoAlerts** no usado
- **getMockNearbyAlerts** no usado (solo MOCK_USERS de mockNearby)

---

## 4. QUÉ SOBRA

- **quarantine/** — Código desactivado (hooks, components, lib, services)
- **mockOviedoAlerts.js** — No importado
- **getMockNearbyAlerts** — No usado
- **Docs obsoletos** — Múltiples auditorías antiguas (CODEBASE_EXPORT_PART_*, etc.)
- **tmp/codebase_export/** — Export legacy

---

## 5. QUÉ ESTÁ DUPLICADO

- **Geolocation:** Home.jsx y MapboxMap.jsx ambos usan watchPosition/getCurrentPosition
- **CenterPin logic:** CreateMapOverlay y SearchMapOverlay calculan pinTop con el mismo patrón
- **mapLayoutPadding:** Usado por MapboxMap y mapLayoutPadding.js; lógica de padding dispersa

---

## 6. QUÉ ES FRÁGIL

- **Geometría card-nav:** main pb-0 en home (mapa hasta viewport bottom), MapScreenPanel paddingBottom 15+nav, BottomNavLayer. Corregido FASE 3.
- **Tests de gap:** Expectativas 14-16px (15±1); skip en CI hasta validar geometría
- **Home div min-h-[100dvh]:** Puede hacer crecer el contenido y generar scroll
- **Layout useEffect:** Estilos inline en html/body/root; si hay race condition, puede no aplicarse a tiempo

---

## 7. QUÉ DEBE UNIFICARSE

- **Gap objetivo:** 15px (según FASE 3) entre tarjeta y nav
- **Base compartida:** MapViewportShell unificado; geometría gap 15px aplicada (main pb-0 home)
- **Motor de ubicación:** Actualmente disperso (Home, MapboxMap, CreateAlertCard); preparar arquitectura seria

---

## 8. OFFSETS ARTIFICIALES

- **main pt-[69px]:** pb-24 en rutas no-home; pb-0 en home (mapa hasta viewport bottom)
- **MapScreenPanel gapPx = 15:** Aplicado FASE 3
- **--bottom-nav-h:** 64px + safe-area
- **CenterPin HEADER_BOTTOM = 69:** Alineado con --header-h

---

## 9. WRAPPERS FRÁGILES

- **AppDeviceFrame:** Solo en web, max-width 430px; en iOS passthrough
- **LayoutShell:** Condicional h-[100dvh] vs min-h-[100dvh] por ruta
- **Home content div:** `h-0 overflow-hidden` cuando mode; `absolute inset-0` cuando no

---

## 10. ASSETS

- **d2ae993d3_WaitMe.png:** Logo principal, usado en Home
- **react.svg:** Posiblemente no usado en prod
- **apple-touch-icon.png:** PWA

---

## 11. RESUMEN EJECUTIVO

| Área | Estado | Acción |
|------|--------|--------|
| Mapa único | ✓ | Mantener |
| Overlays consistentes | ✓ | Mantener |
| Scroll blindado | Parcial | Reforzar; gap -56 indica contenido que se extiende |
| CI estable | ✗ | 8 tests skip; corregir geometría y quitar skip |
| Base ubicación | Parcial | Auditar y planear motor serio |
| Geometría 15px | ✓ | MapScreenPanel gapPx=15; main pb-0 en home |
| Código muerto | Pendiente | Eliminar mockOviedoAlerts, getMockNearbyAlerts no usado |
