# Fuente de Verdad Visual — WaitMe

## Regla oficial

**Para cambios visuales:** usar siempre `npm run waitme:simulator`.

**Para validar comportamiento real:** usar siempre `npm run waitme:iphone`.

---

## Flujo de trabajo visual

1. **Desarrollo UI / layout:** `npm run waitme:simulator`
   - Simulador abre la app con live reload
   - Auto-login con usuario dev
   - Ajusta estilos, posiciones, centrado
   - Guarda → la app recarga sola

2. **Confirmación en dispositivo real:** `npm run waitme:iphone`
   - Build de producción
   - Abre Xcode
   - Selecciona iPhone físico y Run
   - Verifica que el resultado coincida con el simulador

---

## Paridad simulador / iPhone

- **Layout:** `--header-h` y `--bottom-nav-h` usan `env(safe-area-inset-*)` para paridad.
- **Header:** `paddingTop: env(safe-area-inset-top)` para respetar notch/Dynamic Island.
- **Main:** `paddingTop: var(--header-h)` para espacio consistente bajo el header.
- **Home overlay:** centrado entre header y bottom nav en ambos entornos.

---

## Si el simulador queda en blanco

- **Causa raíz:** `localhost` puede fallar en WKWebView del simulador. La URL debe ser `http://127.0.0.1:5173`.
- **Solución:** `waitme:simulator` usa `CAPACITOR_DEV_SERVER_URL="http://127.0.0.1:5173"` y parchea `capacitor.config.json` tras `cap copy` (porque `cap run --live-reload` puede sobrescribir con la IP de red).
- Si persiste: `npm run waitme:stop` y volver a ejecutar `npm run waitme:simulator`.

---

## Si Home se ve mal en iPhone

- Verificar que `--header-h` en `globals.css` incluya safe area.
- El Header debe tener `paddingTop: env(safe-area-inset-top)`.
- El main debe usar `paddingTop: var(--header-h)`.
