# Fuente de Verdad Visual — WaitMe

## Regla oficial

**Para paridad simulador ↔ iPhone en tiempo real:** `npm run waitme:visual`

**Para validar Google login real:** `npm run waitme:iphone`

---

## Flujo de trabajo visual

1. **Desarrollo UI / layout:** `npm run waitme:visual`
   - Abre selector de dispositivos: elige simulador O iPhone físico
   - Ambos usan la misma app con live reload
   - Auto-login con usuario dev
   - Ajusta estilos, posiciones, centrado
   - Guarda → la app recarga en el dispositivo elegido
   - **Paridad real:** simulador e iPhone físico ven lo mismo

2. **Confirmación Google real:** `npm run waitme:iphone`
   - Build de producción
   - Abre Xcode
   - Selecciona iPhone físico y Run
   - Verifica OAuth en dispositivo real

---

## Paridad simulador / iPhone

- **Layout:** `--header-h` y `--bottom-nav-h` usan `env(safe-area-inset-*)` para paridad.
- **Header:** `paddingTop: env(safe-area-inset-top)` para respetar notch/Dynamic Island.
- **Main:** `paddingTop: 0` — el contenido usa `position: absolute` con `top: var(--header-h)` y `bottom: var(--bottom-nav-h)`.
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
- El contenido principal usa `top: var(--header-h)` y `bottom: var(--bottom-nav-h)` (sin padding en main).
