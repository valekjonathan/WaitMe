# Entregable Final — Unificación Total WaitMe

**Fecha:** 2025-03-06

---

## 1. Causa raíz

- **Web vs iOS:** En web la app se estiraba a todo el ancho del viewport; en iPhone/Simulator la geometría era la del dispositivo. No había una referencia visual común.
- **Sin frame móvil:** No existía un wrapper que limitara el ancho en desktop para simular iPhone.
- **Fondo único:** Body y #root con el mismo color; imposible distinguir "marco" de "pantalla" en desktop.

---

## 2. Solución aplicada

1. **AppDeviceFrame** (`src/system/layout/AppDeviceFrame.jsx`):
   - En web: wrapper con max-width 430px, centrado, fondo exterior #1a1a1a
   - En iOS (Capacitor): passthrough sin wrapper
   - Fuente única de verdad para el viewport móvil en web

2. **globals.css**:
   - Body: #1a1a1a (neutro)
   - #root: transparente para que se vea el frame

3. **App.jsx**:
   - Integración de AppDeviceFrame envolviendo el contenido principal

4. **scripts/get-ip.js**:
   - Fallo con mensaje claro si no hay IP válida

5. **docs/FLUJO_UNIFICADO_DESARROLLO.md**:
   - Documentación del flujo con `npm run dev:ios`

---

## 3. Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `src/system/layout/AppDeviceFrame.jsx` | Nuevo |
| `src/system/layout/index.js` | Export AppDeviceFrame |
| `src/App.jsx` | Integrar AppDeviceFrame |
| `src/globals.css` | Body #1a1a1a; #root transparente |
| `scripts/get-ip.js` | Fallo con mensaje si no hay IP |
| `docs/FLUJO_UNIFICADO_DESARROLLO.md` | Nuevo |
| `docs/VALIDACION_VISUAL_UNIFICADA.md` | Nuevo |
| `docs/ENTREGABLE_FINAL_UNIFICACION_TOTAL.md` | Nuevo |
| `tests/layout-device-frame.spec.js` | Nuevo |

---

## 4. Scripts finales recomendados

| Script | Uso |
|--------|-----|
| `npm run dev` | Solo web (localhost:5173) |
| `npm run dev:ios` | Web + iOS (Simulator o físico) con live reload |
| `npm run build` | Build producción |
| `npm run ios:sync` | Sincronizar dist a iOS |
| `npm run ios:open` | Abrir Xcode |

---

## 5. Validación realizada

| Prueba | Resultado |
|--------|-----------|
| `npm run lint` | Warnings pre-existentes |
| `npm run build` | ✓ OK |
| `npm run test:e2e tests/layout-device-frame.spec.js` | 3 passed |
| `npm run test:e2e` | 28 passed, 1 failed (safe-mode, preexistente) |

---

## 6. Confirmación expresa

- **Mismo ancho visual base en web, simulator e iPhone:** Sí. Web usa max-width 430px; iOS usa el ancho nativo (similar a iPhone). La geometría interna es la misma.
- **Mismo shell del mapa:** Sí. MapViewportShell sin cambios; sigue siendo la fuente única.
- **Mismos overlays dentro del mismo viewport:** Sí. CreateMapOverlay y SearchMapOverlay dentro de MapViewportShell; sin duplicación.
- **Live reload automático sin Run manual para cambios web:** Sí. `npm run dev:ios` arranca Vite + Capacitor con live reload; cambios en React/CSS/JS se reflejan automáticamente.
- **Base lista para seguir con cambios visuales sin romper consistencia:** Sí. AppDeviceFrame centraliza el viewport; no hay duplicidad de safe-area ni viewport.
