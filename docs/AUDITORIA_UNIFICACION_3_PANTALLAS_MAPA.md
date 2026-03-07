# Auditoría: Unificación de las 3 pantallas principales del mapa

**Fecha:** 2025-03-06  
**Pantallas:** HOME, ESTOY APARCADO AQUÍ (create), DÓNDE QUIERES APARCAR (navigate)

---

## 1. Cadena de layout

```
Layout.jsx (LayoutShell)
├── Header (fixed)
├── main (flex-1 min-h-0 pt-[69px] pb-24)
│   └── Outlet → Home
│       └── Home.jsx
│           ├── MapViewportShell (mode: null | 'create' | 'search')
│           │   ├── MapLayer (absolute inset-0 z-0)
│           │   │   ├── MapboxMap
│           │   │   └── [Home] capa amoratada
│           │   └── OverlayLayer (absolute inset-0 z-20)
│           │       └── CreateMapOverlay | SearchMapOverlay | null
│           └── content div (absolute inset-0 en home, h-0 en create/search)
└── BottomNavLayer
```

---

## 2. Comparativa Create vs Navigate

| Elemento | CreateMapOverlay | SearchMapOverlay |
|----------|------------------|------------------|
| Wrapper | `absolute inset-0 z-10 pointer-events-none` | `absolute inset-0 z-10 pointer-events-none` ✓ |
| MapScreenPanel | `<MapScreenPanel measureLabel="create">` | `<MapScreenPanel overflowHidden measureLabel="navigate">` |
| cardShiftUp | 0 (default) | 0 ✓ |
| overflowHidden | false (CreateAlertCard puede scroll) | true (UserAlertCard sin scroll) |
| CenterPin | Sí, mismo cálculo | Sí, mismo cálculo ✓ |
| MapZoomControls | `className="left-[4%]"` style top:75 | `className="left-[4%]"` style top:75 ✓ |
| Extra | — | Buscador/filtros absolute top-0 |

**Diferencia clave:** SearchMapOverlay tiene `overflowHidden` en MapScreenPanel; Create no. Create usa `overflow-y: auto` en el inner, lo que puede generar scroll y propagación al body.

---

## 3. Contenedores que generan scroll

1. **MapScreenPanel inner** (`data-map-screen-panel-inner`): `overflowY: auto` cuando overflowHidden=false (create). Permite scroll interno y puede propagar al body (scroll chaining).
2. **body**: Layout aplica `overflow: hidden` solo en ruta home. En create/navigate el body puede tener overflow si el contenido excede.
3. **LayoutShell**: En home usa `h-[100dvh] overflow-hidden`. En otras rutas usa `min-h-[100dvh]` (permite crecimiento).

---

## 4. Arrastre de pantalla desde la tarjeta

**Causa:** El `data-map-screen-panel-inner` tiene `overflow-y: auto`. Cuando el usuario arrastra dentro de la tarjeta:
- Si el contenido no desborda, el gesto puede propagarse al contenedor padre
- El body/html pueden recibir el scroll por cadena (overscroll-behavior por defecto)
- Falta `overscroll-behavior: contain` en el panel inner
- Falta `touch-action: pan-y` para aislar el gesto

**Solución:** Añadir `overscroll-behavior: contain` y `touch-action: pan-y` al panel inner para que el scroll no se propague.

---

## 5. MapViewportShell: diferencias por modo

| Modo | height | minHeight |
|------|--------|-----------|
| create | `calc(100dvh - 69px - 7px)` | undefined |
| home/search | `100%` | `100dvh` |

Create tiene altura explícita distinta. Home y search usan 100%.

---

## 6. Wrappers distintos

- **Create:** No tiene bloque superior (buscador). MapScreenPanel directo.
- **Navigate:** Tiene bloque absolute (buscador/filtros) que NO empuja. MapScreenPanel igual.
- **Create MapScreenPanel:** Sin overflowHidden → overflow-y: auto en inner.
- **Navigate MapScreenPanel:** overflowHidden → overflow-y: hidden en inner.

---

## 7. Zoom controls

Ambos usan `MapZoomControls` con `className="left-[4%]"` y `style={{ top: 75 }}`. Misma posición.

---

## 8. CenterPin (palito + bolita)

- Create: Sí, entre header y tarjeta.
- Navigate: Sí, mismo cálculo (header + panel inner).
- Home: No se muestra CenterPin (panel es null, no hay overlay).

---

## 9. Cantidad de coches en navigate

Actualmente: **10 coches** (mockNavigateCars). Requerido: **20 coches**.

---

## 10. Usuario más cercano por defecto

Home.jsx tiene useEffect que selecciona el coche más cercano al entrar en search. ✓

---

## 11. Resumen de correcciones aplicadas

1. **Scroll/drag:** Añadido `overscroll-behavior: contain` y `touch-action: pan-y` a MapScreenPanel inner.
2. **20 coches:** mockNavigateCars cambiado de 10 a 20.
3. **body overflow:** Ya aplicado en Layout para ruta home (create/search son submodos de Home, path sigue siendo '/').
4. **Validación:** Añadida medición de zoomTop en MapZoomControls (measureLabel create/navigate).
5. **MapViewportShell unificado:** Eliminada altura distinta para create; todas las pantallas usan `height: 100%` y `minHeight: 100dvh`.
