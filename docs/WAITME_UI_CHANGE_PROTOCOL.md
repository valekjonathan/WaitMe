# WaitMe — Protocolo obligatorio para cambios UI

**Objetivo:** Que los cambios visuales se hagan en el archivo correcto y se validen automáticamente. No más cambios "a ojo".

---

## 1. Antes de tocar UI — Identificar

Antes de aplicar cualquier cambio visual, documentar:

| Campo | Descripción |
|-------|-------------|
| **Componente visual real** | El componente React que renderiza el elemento (ej: CreateAlertCard) |
| **Wrapper que controla posición** | El contenedor DOM que aplica position, bottom, margin, transform |
| **Archivo fuente de layout** | Archivo donde está el wrapper (ej: CreateMapOverlay.jsx, OverlayLayer.jsx) |
| **z-index** | Valor de z-index del elemento y su stacking context |
| **Propiedades activas** | bottom, margin-bottom, padding-bottom, transform, etc. |

**Herramienta:** Usar `window.__WAITME_LAYOUT_INSPECTOR__` en consola (solo DEV) para inspeccionar elementos.

---

## 2. Plan previo

Generar un plan con:

- **Archivo exacto a tocar** — ruta completa
- **Por qué ese archivo controla el cambio** — justificación
- **Qué NO se tocará** — lista de archivos excluidos

Ejemplo:

```
Archivo: src/components/CreateMapOverlay.jsx
Razón: El wrapper directo de CreateAlertCard controla la posición vertical con -translate-y-[10px]
NO tocar: OverlayLayer.jsx, CreateAlertCard.jsx, Home.jsx
```

---

## 3. Aplicar cambio solo en la fuente de verdad

- Modificar **solo** el archivo identificado como fuente de verdad
- No duplicar lógica de posición en varios sitios
- Si el cambio afecta a varios overlays, considerar OverlayLayer.jsx como fuente única

---

## 4. Validar visualmente

| Si el componente tiene story | Validar en Storybook |
|-----------------------------|----------------------|
| Si no tiene story            | Validar con Playwright screenshot |

- **No marcar como hecho** si el cambio no se ve realmente
- Ejecutar: `npm run build-storybook` y revisar la story
- Ejecutar: `npm run test:e2e tests/visual/create-card-position.spec.js` para la tarjeta create

---

## 5. Checklist final

- [ ] Plan previo documentado
- [ ] Cambio aplicado en archivo correcto
- [ ] Build OK (`npm run build`)
- [ ] Validación visual (Storybook o Playwright)
- [ ] No se modificaron archivos no planificados

---

## Referencias

- `docs/WAITME_LAYOUT_MAP.md` — jerarquía y z-index
- `docs/WAITME_CODE_AUDIT.md` — estructura del proyecto
- `window.__WAITME_LAYOUT_INSPECTOR__` — inspector de layout (DEV)
