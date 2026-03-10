# Auditoría de Paridad Visual — Simulador ↔ iPhone Físico

**Fecha:** 2026-03-10  
**Objetivo:** Causa raíz exacta de la diferencia visual entre simulador e iPhone físico, y correcciones aplicadas.

---

## 1. ROOT CAUSE EXACTA — Diferencia Simulador vs iPhone

### Causa raíz verificada

**Safe areas asimétricas.** En iPhone físico con notch/Dynamic Island:
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

- **Simulador:** Suele usar dev server (live reload) o build local. `env(safe-area-inset-*)` depende del dispositivo simulado.
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
| `top` de HistoryFilters | No — se mantiene `var(--header-h)` para paridad en iPhone |
| `pt` del main | No — se mantiene `pt-0`; el espaciador de 59px sigue gestionando el espacio bajo los tabs fijos |

---

## 4. QUÉ SE ARREGLÓ EN HOME / LAYOUT

| Corrección | Descripción |
|------------|-------------|
| Transform compensatorio | `translateY(calc(-0.5 * (var(--header-h) - var(--bottom-nav-h))))` en el contenedor del contenido del overlay Home para centrar visualmente cuando las safe areas son asimétricas |
| MapScreenPanel | Fórmula única `bottom: calc(var(--bottom-nav-h) + 15px)` sin compensaciones duplicadas |
| Layout | Sin cambios; ya usaba `paddingTop: var(--header-h)` correctamente |

---

## 5. FUENTE DE VERDAD VISUAL OFICIAL

**Desde ahora:** `docs/VISUAL_SOURCE_OF_TRUTH.md` + este documento.

### Cómo comprobar que están alineados

1. **Simulador:** `npm run waitme:simulator` — ver Home centrado entre header y bottom nav.
2. **iPhone físico:** Build con `npm run build` + `npx cap run ios` (o Xcode) — ver el mismo centrado.
3. **Alertas:** Sin CTAs en empty states; TabsList/TabsTrigger con estilo anterior.
4. **Criterio:** El bloque central de Home debe quedar visualmente centrado en el espacio entre header y bottom nav en ambos entornos.

---

## 6. RESUMEN DE VALIDACIÓN

- `npm run lint` — OK  
- `npm run typecheck` — OK  
- `npm run build` — OK  
- `npm run waitme:simulator` — Verificar Home y Alertas manualmente  
- `npm run waitme:state` — OK  

---

## 7. ÁREAS NO TOCADAS

- Pagos
- Login Google real de producción
- Nuevas funciones
- "Estoy aparcado aquí" (CreateAlertCard, CreateMapOverlay)
- Infraestructura no necesaria
