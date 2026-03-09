# WaitMe — Flujo de desarrollo iOS

Documentación del flujo profesional de desarrollo para Simulador e iPhone físico.

---

## 1. Simulador — Reinstalación automática

**Comando:** `npm run start`

**Qué hace:**
- Levanta Vite en `http://0.0.0.0:5173`
- Ejecuta watcher (chokidar) que vigila:
  - `src/**/*`
  - `src/pages/**/*`
  - `src/components/**/*`
  - `src/lib/**/*`
  - `src/system/**/*`
  - `capacitor.config.ts`
  - `package.json`
- Al detectar cambio → ejecuta `npm run ios:refresh`

**ios:refresh:**
1. Cierra app en simulador
2. Desinstala app
3. Limpia `dist/`
4. `npm run build`
5. `npx cap sync ios`
6. `npx cap run ios --target="iPhone 16e"`

**Resultado:** El simulador SIEMPRE muestra la última build real.

---

## 2. iPhone físico — Live Reload

**Comando:** `npm run ios:auto`

**Qué hace:**
- Detecta IP local (`scripts/setDevServer.js`)
- Exporta `CAPACITOR_USE_DEV_SERVER=true` y `CAPACITOR_DEV_SERVER_URL=http://IP:5173`
- Levanta Vite con `--host`
- Ejecuta `cap run ios --live-reload --host IP --port 5173`

**Requisitos:**
- iPhone y Mac en la misma WiFi
- Permiso "Red local" en iPhone
- Mac encendido (el servidor Vite corre en el Mac)

**Límite real:**
- **Mac encendido:** Live reload funciona. Los cambios se ven en tiempo real.
- **Mac apagado:** No hay servidor local. No puede haber live reload local.

---

## 3. Opción futura: Mac apagado

Para ver cambios cuando el Mac esté apagado:

**Enfoque profesional documentado (sin implementar):**
- Entorno staging remoto / preview estable
- Ejemplo: deploy automático a Vercel/Netlify en cada push a `develop`
- La app iOS apuntaría a `https://preview.waitme.app` en modo dev
- Requiere: build de Capacitor con `server.url` dinámico según entorno

---

## 4. Scripts activos

| Script | Comando | Uso |
|--------|---------|-----|
| `start` | `npm run start` | Simulador: Vite + watcher → ios:refresh al cambiar |
| `ios:refresh` | `npm run ios:refresh` | Reinstalación completa en simulador |
| `ios:auto` | `npm run ios:auto` | iPhone físico: Live reload con IP local |
| `dev:ios` | `npm run dev:ios` | Solo Vite (usado por start) |
| `dev:auto` | `npm run dev:auto` | Solo watcher (usado por start) |

---

## 5. Archivos clave

- `scripts/ios-refresh.sh` — Reinstalación completa
- `scripts/dev-ios.sh` — Live reload iPhone (usa setDevServer.js)
- `scripts/setDevServer.js` — Detecta IP y devuelve URL
- `capacitor.config.ts` — `server.url` cuando `CAPACITOR_USE_DEV_SERVER=true`
