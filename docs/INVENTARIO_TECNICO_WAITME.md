# Inventario Técnico — WaitMe

**Fecha:** 2026-03-09  
**Actualizado tras auditoría forense.**

---

## 1. SCRIPTS REALES (package.json)

### Flujo diario recomendado

| Script | Comando | Uso real |
|--------|---------|----------|
| **start** | `concurrently "npm run dev:ios" "npm run dev:auto"` | Simulador: Vite + watcher que dispara ios:refresh al cambiar archivos |
| **ios:refresh** | `bash scripts/ios-refresh.sh` | Reinstalación completa en Simulator (terminate, uninstall, build, sync, run) |
| **ios:auto** | `bash scripts/dev-ios.sh` | iPhone físico: Vite + cap run con live reload (IP local) |

### Scripts secundarios

| Script | Comando | Uso |
|--------|---------|-----|
| dev:ios | vite --host --port 5173 | Solo Vite (usado por start) |
| dev:auto | chokidar ... -c "npm run ios:refresh" | Solo watcher (usado por start) |
| ios:fresh | bash scripts/ios-fresh.sh | Build limpio + sync + instalar |
| ios:live | bash scripts/ios-live.sh | Dev + live reload (alternativa a ios:auto) |
| ios:watch | bash scripts/ios-watch.sh | chokidar + rebuild + sync (sin full reinstall) |
| ios:clean | rm -rf dist ... | Limpieza |
| ios:open | npx cap open ios | Abrir Xcode |

### Build / validación

| Script | Comando |
|--------|---------|
| build | vite build |
| dev | vite --host --port 5173 |
| lint | eslint . |
| typecheck | tsc --noEmit |
| ship | bash scripts/ship.sh |

---

## 2. HERRAMIENTAS ACTIVAS

| Herramienta | Versión | Uso |
|-------------|---------|-----|
| Vite | 6.x | Build y dev server |
| React | 18.x | UI |
| Capacitor | 8.x | iOS native |
| Supabase | 2.x | Auth, DB |
| Mapbox GL | 3.x | Mapas |
| chokidar-cli | 3.x | Watcher para dev:auto |
| concurrently | 9.x | Ejecutar Vite + watcher en paralelo |

---

## 3. QUÉ USA EL FLUJO DIARIO

**Para desarrollo en Simulador:**
- `npm run start` (dejar abierto)
- Al editar: watcher detecta → ios:refresh → simulador reinstala

**Para desarrollo en iPhone físico:**
- `npm run ios:auto` (en otra terminal)
- Vite + cap run con live reload
- iPhone en misma WiFi, permiso Red local

**Para build de producción:**
- `npm run build`
- `npx cap sync ios`
- Abrir Xcode, archivar, distribuir

---

## 4. QUÉ SOBRA

| Elemento | Motivo |
|----------|--------|
| ios:watch | Solapado con dev:auto (chokidar); hace rebuild+sync pero no full reinstall |
| ios:run, ios:run:dev | Redundantes con ios:auto, ios:live |
| ios:reload (en package.json) | Similar a ios:refresh pero sin terminate/uninstall |
| Múltiples variantes ios: | Confusión; consolidar |

---

## 5. QUÉ FALTA

| Elemento | Motivo |
|----------|--------|
| Debounce en chokidar | Varios cambios rápidos → múltiples ios:refresh |
| Timeout en exchangeCodeForSession | Evitar bloqueo si nunca resuelve |
| Test E2E OAuth | Validar flujo login automáticamente |
| Documentación clara start vs ios:auto | Usuario no sabe cuál usar |

---

## 6. AUTOMATIZACIÓN QUE SÍ FUNCIONA

- **chokidar** detecta cambios (verificado con touch + echo)
- **ios:refresh** hace el flujo completo (verificado con salida real)
- **concurrently** ejecuta Vite y chokidar en paralelo
- **dev-ios.sh** usa setDevServer.js para IP correcta

---

## 7. AUTOMATIZACIÓN QUE NO FUNCIONA REALMENTE

- **"Simulador siempre última build"**: Solo si el usuario ejecuta `npm run start` y deja la terminal abierta. Si cierra o no ejecuta start, no hay watcher.
- **"Home muestra logo"**: Depende de auth. Si auth falla, no se llega a Home.
- **"Login estable"**: Sigue inestable por race conditions y headers Supabase.
