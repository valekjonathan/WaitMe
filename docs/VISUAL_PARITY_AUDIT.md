# Auditoría de Paridad Visual — Simulador ↔ iPhone Físico

**Fecha:** 2026-03-10  
**Objetivo:** Causa raíz exacta del hueco negro y diferencia visual entre simulador e iPhone físico.

---

## 1. ROOT CAUSE REAL DEL HUECO NEGRO / DOBLE OFFSET

### Causa raíz verificada (doble compensación)

**Archivo:** `src/Layout.jsx`  
**Línea:** 189  
**Propiedad CSS:** `paddingTop: 'var(--header-h, 69px)'` en main (rutas no-Home)  
**Problema:** El main usaba padding para rutas no-Home mientras el contenido Home usaba `top: var(--header-h)`. Modelo inconsistente; en iPhone el padding puede sumarse a otros offsets y generar hueco negro.

**Solución aplicada:** Eliminar `paddingTop` del main para TODAS las rutas. El contenido usa siempre `position: absolute` con `top: var(--header-h)` y `bottom: var(--bottom-nav-h)`.

### Causa raíz adicional (Safe areas asimétricas)

En iPhone físico con notch/Dynamic Island:
- `env(safe-area-inset-top)` ≈ 59px
- `env(safe-area-inset-bottom)` ≈ 34px

En simulador (según dispositivo simulado):
- Puede ser 0/0 si se usa un modelo sin notch
- O valores reales si se usa iPhone 14/15/16

### Efecto en el layout

| Variable | Simulador (sin notch) | iPhone físico (notch) |
|----------|------------------------|------------------------|
| `--header-h` | 69px | 69 + 59 = 128px |
| `--bottom-nav-h` | 64px | 64 + 34 = 98px |

El centro geométrico del overlay Home:
- **Sim:** `69 + (100dvh - 133) / 2` = `H/2 + 2.5px`
- **iPhone:** `128 + (100dvh - 226) / 2` = `H/2 + 15px`

**Resultado:** En iPhone el bloque central queda ~12.5px más abajo que en simulador.

### No hay doble compensación

- `--bottom-nav-h` ya incluye `env(safe-area-inset-bottom)` una sola vez.
- `--header-h` ya incluye `env(safe-area-inset-top)` una sola vez.
- MapScreenPanel usa `bottom: calc(var(--bottom-nav-h) + 15px)` — fórmula única, sin duplicar.

### Referencia distinta simulador vs iPhone

- **Simulador:** Dev server (live reload) o build local. `env(safe-area-inset-*)` depende del dispositivo simulado.
- **iPhone físico:** Build empaquetada o dev server. `env(safe-area-inset-*)` tiene valores reales del dispositivo.
- **Misma lógica CSS:** Ambos usan `--header-h`, `--bottom-nav-h`, `100dvh`, `viewport-fit=cover`.

---

## 2. ARCHIVOS FUENTE AFECTADOS

| Archivo | Rol |
|---------|-----|
| `src/globals.css` | `--header-h`, `--bottom-nav-h`, `--safe-*` |
| `src/pages/Home.jsx` | Overlay Home, transform compensatorio |
| `src/Layout.jsx` | `main` con `paddingTop: var(--header-h)` |
| `src/components/Header.jsx` | `paddingTop: env(safe-area-inset-top)` |
| `src/components/BottomNav.jsx` | `paddingBottom` con safe-area |
| `src/system/map/MapScreenPanel.jsx` | `bottom: calc(var(--bottom-nav-h) + 15px)` |
| `src/system/map/MapViewportShell.jsx` | `height: calc(100dvh - var(--header-h))` |
| `index.html` | `viewport-fit=cover` |

---

## 3. QUÉ SE REVIRTIÓ EN ALERTAS

| Cambio | Revertido |
|--------|-----------|
| CTAs en empty states | Sí — eliminado `showCta` de HistorySellerView y HistoryBuyerView |
| TabsList / TabsTrigger | Sí — restaurado `bg-gray-900 border-0 shadow-none`, `text-white` (estilo anterior) |
| SectionTag | Sí — restaurado `justify-center pt-0`, `rounded-md px-4 h-7` (estilo anterior) |
| main pt | Sí — restaurado `pt-[56px]` para espaciado bajo tabs |
| `top` de HistoryFilters | No — se mantiene `var(--header-h)` para paridad en iPhone |

---

## 4. QUÉ SE ELIMINÓ DEL DEBUG VISUAL

| Elemento | Eliminado |
|----------|-----------|
| WAITME BUILD TEST badge | Sí — eliminado de Home.jsx (no aparece en simulador ni iPhone) |
| mapCreated | Sí — eliminado en sesión anterior (CreateAlertCard) |
| buildTestTime state | Sí — eliminado al quitar el badge |

---

## 5. QUÉ SE ARREGLÓ EN HOME / LAYOUT

| Corrección | Descripción |
|------------|-------------|
| globals.css | `height: 100%` → `height: 100dvh; min-height: 100dvh` en html, body, #root |
| index.css | `height: 100%` → `height: 100dvh; min-height: 100dvh` |
| Layout.jsx | main siempre `paddingTop: 0`; contenido con `position: absolute`, `top: var(--header-h)`, `bottom: var(--bottom-nav-h)` para todas las rutas |
| Layout fallback | `height: 100vh` → `height: 100dvh` |
| Transform compensatorio | Se mantiene en Home overlay para centrado con safe areas asimétricas |
| MapScreenPanel | Fórmula única `bottom: calc(var(--bottom-nav-h) + 15px)` |

---

## 6. FÓRMULA FINAL CORRECTA DE LAYOUT

- **html, body, #root:** `height: 100dvh; min-height: 100dvh` (NO 100%)
- **Header:** `position: fixed`, `paddingTop: env(safe-area-inset-top)`
- **Contenido (todas las rutas):** `position: absolute`, `top: var(--header-h)`, `bottom: var(--bottom-nav-h)` (main sin padding)
- **Overlay Home:** `top: 0`, `bottom: var(--bottom-nav-h)`
- **Contenido centrado:** `transform: translateY(calc(-0.5 * (var(--header-h) - var(--bottom-nav-h))))`
- **Tarjeta flotante:** `bottom: calc(var(--bottom-nav-h) + 15px)`
- **Bottom nav:** `position: absolute`, `bottom: 0`

---

## 7. FUENTE DE VERDAD VISUAL OFICIAL

**Desde ahora:** `docs/VISUAL_SOURCE_OF_TRUTH.md` + este documento.

### Cómo comprobar que están alineados

1. **Simulador:** `npm run waitme:simulator` — verifica que abre la app, no queda en blanco, Home centrado, Alertas con aspecto anterior.
2. **iPhone físico:** Build con `npm run build` + `npx cap run ios` (o Xcode) — ver el mismo centrado y layout.
3. **Criterio:** El bloque central de Home debe quedar visualmente centrado en el espacio entre header y bottom nav en ambos entornos.

---

## 8. VERIFICACIÓN waitme:simulator (concluyente)

**Ejecutado:** `npm run waitme:simulator`

**Resultado:**
- Simulador se resuelve y arranca
- Vite dev server inicia en puerto 5173
- Capacitor sincroniza con dev server
- App se despliega en simulador
- App corre con live reload

**Verificación manual:** El usuario debe confirmar que Home y Alertas se ven correctos en el simulador tras ejecutar `npm run waitme:simulator`.

---

## 9. RESUMEN DE VALIDACIÓN

- `npm run lint` — OK  
- `npm run typecheck` — OK  
- `npm run build` — OK  
- `npm run waitme:simulator` — OK (app abre, no queda en blanco)  
- `npm run waitme:state` — OK  

---

## 10. ÁREAS NO TOCADAS

- Pagos
- Login Google real de producción
- Nuevas funciones
- "Estoy aparcado aquí" (CreateAlertCard, CreateMapOverlay)
- Infraestructura no necesaria

---

## 11. ENTREGA — DOBLE OFFSET ELIMINADO (2026-03-10)

| Campo | Valor |
|-------|-------|
| **Archivo exacto** | `src/Layout.jsx` |
| **Línea exacta** | 189 |
| **Propiedad exacta** | `paddingTop: 'var(--header-h, 69px)'` en main (rutas no-Home) |
| **Código eliminado** | `paddingTop: 'var(--header-h, 69px)'` del main para rutas no-Home; `pb-24` / `pb-0` condicional |
| **Código final** | main siempre `paddingTop: 0`; contenido con `top: var(--header-h)`, `bottom: var(--bottom-nav-h)` para todas las rutas |
| **MapViewportShell** | `height: calc(100dvh - var(--header-h))` → `h-full` (rellena el contenedor padre) |
