# WaitMe Layout Map

Auditoría de layout para el sistema de capas centralizado.

---

## 1. Jerarquía visual actual

```
Layout (flex min-h-[100dvh])
├── Header (fixed top-0 z-50)
├── main (pt-[69px] pb-24)
│   └── Outlet → Home | Chat | History | ...
└── BottomNav (fixed bottom-0 z-[2147483647])

Home (relative min-h-[100dvh])
├── MapboxMap (absolute inset-0 z-0)
│   ├── CreateMapOverlay (absolute inset-0 z-10) [mode=create]
│   │   ├── Tarjeta (absolute bottom: calc(safe-area + 90px) z-20)
│   │   ├── CenterPin (absolute z-10)
│   │   └── MapZoomControls (absolute z-20)
│   └── SearchMapOverlay (fixed top-[60px] paddingBottom: calc(safe-area + 88px)) [mode=search]
│       ├── Filtros (absolute top-3 right-3 z-[1000])
│       ├── StreetSearch
│       ├── UserAlertCard
│       ├── CenterPin
│       └── MapZoomControls
└── Content div (relative z-10, pointer-events-none cuando mode)
    └── Hero / main content
```

---

## 2. Overlays existentes

| Overlay | Ubicación | Posición | z-index | Uso |
|---------|-----------|----------|---------|-----|
| CreateMapOverlay | Home → MapboxMap | absolute inset-0 | 10 (wrapper), 20 (tarjeta) | Modo "Estoy aparcado aquí" |
| SearchMapOverlay | Home → MapboxMap | fixed top-[60px] | - | Modo "¿Dónde quieres aparcar?" |
| MapFilters | SearchMapOverlay / Home | absolute top-4 left-4 | 1000 | Filtros de búsqueda |
| MapFilters backdrop | Home | fixed inset-0 | 999 | Overlay oscuro al abrir filtros |
| BottomNav | Layout | fixed bottom-0 | 2147483647 | Navegación inferior |
| Header | Layout | fixed top-0 | 50 | Cabecera global |
| SellerLocationTracker | Navigate | fixed bottom-24 | 40 | Tarjeta de ubicación vendedor |
| Dialogs/Modals | Varios | fixed inset-0 | 50–9999 | Modales y confirmaciones |

---

## 3. Contenedores que controlan posición

| Archivo | Elemento | Propiedades clave |
|---------|----------|-------------------|
| **MapScreenPanel.jsx** | **FUENTE ÚNICA** | padding-bottom: calc(safe-area + 86px), w-[92%] max-w-[460px] |
| MapScreenShell.jsx | shell | MapLayer + OverlayLayer |
| Home.jsx | root | relative, min-h-[100dvh], overflow-hidden |
| CreateMapOverlay.jsx | overlay | usa MapScreenPanel para tarjeta |
| SearchMapOverlay.jsx | wrapper | fixed inset-0 top-[60px], paddingBottom: calc(safe-area + 88px) |
| BottomNav.jsx | nav | fixed bottom-0 left-0 right-0 z-[2147483647] |
| globals.css | --bottom-nav-h | calc(64px + env(safe-area-inset-bottom)) |

---

## 4. z-index usados

| Valor | Componente |
|-------|------------|
| 0 | MapboxMap |
| 10 | CreateMapOverlay wrapper, CenterPin, hero-block |
| 20 | CreateAlertCard tarjeta, MapZoomControls |
| 30 | Chat header secundario |
| 40 | Navigate overlays, SellerLocationTracker, History sticky |
| 50 | Header, dialogs, Navigate bottom bar |
| 150 | Navigate modales |
| 200 | Navigate fullscreen, IncomingRequestModal |
| 999 | MapFilters backdrop |
| 1000 | SearchMapOverlay filtros, MapFilters, ParkingMap |
| 9999 | Home confirm publish, History fullscreen |
| 2147483647 | BottomNav |

---

## 5. Conflictos potenciales

1. **BottomNav z-index extremo (2147483647)**: Garantiza que siempre esté encima. Ningún overlay debe superarlo para evitar tapar la navegación.

2. **CreateMapOverlay vs SearchMapOverlay**: Estructuras distintas (absolute vs fixed). CreateMapOverlay usa bottom en la tarjeta; SearchMapOverlay usa paddingBottom en el contenedor.

3. **MapFilters**: z-[999] y z-[1000] pueden solaparse con otros modales (z-50, z-[9999]). Orden actual: MapFilters < confirm publish.

4. **Content area en Home**: En modo create/search, display:none en el content y pointer-events-none permiten que los gestos lleguen al mapa. La capa z-10 queda "transparente" a eventos.
