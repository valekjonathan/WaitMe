# Auditoría total de raíz — WaitMe

**Fecha:** 2025-03-07  
**Objetivo:** Cerrar de raíz scroll/arrastre y diferencias entre HOME / CREATE / NAVIGATE.

---

## 1. ESTRUCTURA

### Árbol real
Ver `docs/ARBOL_REAL_PROYECTO_ACTUAL.md`.

### Cadena de layout (HOME, CREATE, NAVIGATE)

Las 3 pantallas viven en **Home.jsx** (path `/`):
- **HOME:** mode=null, logo + botones sobre mapa
- **CREATE:** mode='create', CreateMapOverlay + CreateAlertCard
- **NAVIGATE:** mode='search', SearchMapOverlay + UserAlertCard

```
index.html
└── body
    └── #root (min-height: 100dvh, flex col)
        └── App
            └── AppDeviceFrame (max-width 430px en web)
                └── div (min-h-[100dvh], pt safe-area)
                    └── AuthRouter
                        └── Layout
                            └── LayoutShell (h-[100dvh] overflow-hidden cuando isHomeRoute)
                                ├── Header (fixed)
                                ├── main (flex-1 min-h-0 pt-[69px] pb-24)
                                │   └── Outlet → Home
                                │       └── Home.jsx
                                │           ├── MapViewportShell (height: 100%, minHeight: 100dvh)
                                │           │   ├── MapLayer (absolute inset-0)
                                │           │   │   ├── MapboxMap
                                │           │   │   └── [Home] capa amoratada
                                │           │   └── OverlayLayer (absolute inset-0)
                                │           │       └── CreateMapOverlay | SearchMapOverlay | null
                                │           └── div content (h-0 overflow-hidden cuando mode)
                                └── BottomNavLayer
```

### Componentes de mapa
- **MapboxMap:** Un único mapa, `interactive={!!mode}` (HOME=no, CREATE/NAVIGATE=sí)
- **MapViewportShell:** Viewport unificado (height: 100%, minHeight: 100dvh)
- **CreateMapOverlay / SearchMapOverlay:** Misma estructura, MapScreenPanel + CenterPin + MapZoomControls
- **MapScreenPanel:** Tarjeta abajo, paddingBottom con --bottom-nav-h

---

## 2. LAYOUT / SCROLL / DRAG — Diagnóstico

### html
- **globals.css:** `height: 100%`, sin overflow-y
- **Layout:** Solo modifica `body.style.overflow`, NO html
- **Riesgo:** Si html permite scroll, puede haber scroll chaining

### body
- **globals.css:** `overflow-x: hidden`, `height: 100%`, `min-height: 100dvh`
- **Layout useEffect:** `body.style.overflow = 'hidden'` cuando path home
- **Riesgo:** Al salir de home, cleanup pone `overflow = ''`; correcto

### #root
- **globals.css:** `min-height: 100dvh`, `display: flex`, `flex-direction: column`
- Sin overflow explícito
- **Riesgo:** Si contenido excede, puede crecer y generar scroll

### LayoutShell
- **Home:** `h-[100dvh] overflow-hidden` ✓
- **Otras rutas:** `min-h-[100dvh]` (permite crecimiento)
- **Falta:** `overscroll-behavior: none` para bloquear propagación

### MapScreenPanel inner
- **overflowY:** auto (create) / hidden (navigate)
- **overscroll-behavior:** contain ✓
- **touch-action:** pan-y ✓
- **Riesgo:** En create, overflow-y: auto permite scroll interno; si el contenido no desborda, el gesto puede propagarse. overscroll-behavior: contain debería contenerlo.

### Contenedor que puede generar arrastre de pantalla
1. **MapScreenPanel inner** con overflow-y: auto — si el usuario arrastra y el contenido no tiene scroll, el gesto puede "rebotar" y propagarse
2. **body** — si en algún momento overflow no es hidden
3. **html** — nunca se bloquea explícitamente

### Diferencia exacta CREATE vs NAVIGATE
- **Create:** MapScreenPanel sin overflowHidden → overflow-y: auto (CreateAlertCard puede tener contenido scrolleable)
- **Navigate:** MapScreenPanel overflowHidden → overflow-y: hidden
- **Estructura:** Idéntica (mismo MapScreenPanel, mismo CenterPin, mismo MapZoomControls)
- **SearchMapOverlay:** Tiene bloque absolute (buscador) arriba que NO empuja; Create no tiene ese bloque

---

## 3. MAPBOX

### Mismo mapa en las 3
- Un único MapboxMap en MapViewportShell
- Mismo zoom (DEFAULT_ZOOM 16.5), pitch 30, estilo dark-v11

### Interacción por modo
- **HOME:** `interactive={false}` → dragPan, touchZoomRotate, scrollZoom = false ✓
- **CREATE/NAVIGATE:** `interactive={true}` → mapa arrastrable ✓

### HOME no debe moverse
- MapboxMap recibe `interactive={!!mode}` → cuando mode=null, interactive=false ✓

---

## 4. GEO / PIN

### CenterPin (palito + bolita)
- CreateMapOverlay y SearchMapOverlay usan CenterPin
- Cálculo: midPoint entre headerBottom y cardRect.top, pinTop = midPoint - PIN_HEIGHT
- **HOME:** No hay CenterPin (panel=null)
- **CREATE/NAVIGATE:** Sí, mismo cálculo

### Ubicación actual
- Home.jsx: useEffect con watchPosition, setUserLocation, setSelectedPosition
- MapboxMap: location desde geolocation
- CenterPin: no depende de lat/lng directamente; posición visual entre header y tarjeta

---

## 5. NAVIGATE (mode search)

- **Usuario más cercano:** useEffect en Home ordena por haversine, setSelectedAlert(sorted[0]) ✓
- **20 coches:** getMockNavigateCars genera 20 ✓
- **Datos mock:** NAMES, COLORS, BRANDS, MODELS, spanishPlate(), avatarUrl() ✓

---

## 6. CÓDIGO MUERTO / DUPLICADO / FRÁGIL

- **mapLayoutPadding.js:** Usado por MapboxMap para padding
- **lib/mockOviedoAlerts, mockNearby:** Posible uso en otros flujos
- **quarantine:** Código desactivado, no afecta
- **Offsets artificiales:** MapViewportShell ya unificado (sin calc distinto para create)

---

## 7. CORRECCIONES APLICADAS

### Bloqueo real scroll/drag
1. **Layout:** html, body, #root con overflow hidden cuando isHome; body.overscrollBehavior = 'none'
2. **LayoutShell:** overscroll-behavior: none cuando isHomeRoute
3. **MapScreenPanel:** overscroll-behavior: contain, touch-action: pan-y ✓

### Validación
- Medidas zoom/card en MapZoomControls y MapScreenPanel (DEV)
- `window.__WAITME_VALIDATE_SCROLL()` en consola cuando en Home
- tests/contracts/mockNavigateCars.test.js: 20 coches, datos no vacíos
