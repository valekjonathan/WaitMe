# Validación Visual Unificada — WaitMe

**Fecha:** 2025-03-06

---

## 1. Qué se verificó

| Elemento | Verificación |
|----------|--------------|
| AppDeviceFrame | max-width 430px en web desktop |
| Shell del mapa | MapViewportShell presente en Home |
| Bottom nav | data-waitme-nav visible |
| Build | Vite build sin errores |
| Tests E2E | layout-device-frame.spec.js (3 tests) |
| Lint | Warnings pre-existentes; sin errores nuevos |

---

## 2. Cómo se verificó

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | Warnings (pre-existentes); sin errores en archivos tocados |
| `npm run build` | ✓ OK |
| `npm run test:e2e tests/layout-device-frame.spec.js` | 3 passed |
| `npm run test:e2e` | 28 passed, 1 failed (safe-mode, preexistente) |

---

## 3. Diferencias antes

| Aspecto | Antes |
|----------|-------|
| Web desktop | App a ancho completo; sin límite visual |
| Body background | #0B0B0F en toda la pantalla |
| Frame móvil | No existía |
| Centrado | No |

---

## 4. Qué quedó unificado ahora

| Aspecto | Después |
|----------|---------|
| Web desktop | max-width 430px; centrado; fondo exterior #1a1a1a |
| iPhone / Simulator | Sin cambios (passthrough); misma geometría |
| AppDeviceFrame | Fuente única para viewport móvil en web |
| Body | #1a1a1a (neutro); #root transparente |
| MapViewportShell | Sin cambios; sigue siendo fuente del mapa |
| Overlays | Dentro del mismo viewport base |

---

## 5. Tests añadidos

- `tests/layout-device-frame.spec.js`:
  - max-width 430px en contenedor principal
  - shell del mapa presente
  - bottom nav presente
