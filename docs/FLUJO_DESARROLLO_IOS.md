# Flujo de desarrollo iOS — WaitMe

**Objetivo:** Ver cambios de React/CSS/JS en iOS Simulator sin pulsar Run en Xcode cada vez.

---

## 1. Comando exacto para arrancar todo

```bash
npm run dev:ios
```

Esto ejecuta en paralelo:
- `npm run dev` (Vite en http://localhost:5173)
- `CAPACITOR_USE_DEV_SERVER=true npx cap run ios` (Simulator con live reload)

**Requisito:** Tener Xcode instalado y al menos un simulador disponible.

---

## 2. Cuándo hace falta sync

| Cambio | ¿Sync? |
|--------|--------|
| React, CSS, JS, assets en `src/` | No (live reload) |
| `capacitor.config.*` | Sí: `npm run ios:sync:dev` |
| Plugins nativos nuevos | Sí: `npm run ios:sync` + recompilar |
| `package.json` (deps) | Sí si afecta a Capacitor |

---

## 3. Cuándo NO hace falta Run

- Cambios en componentes React
- Cambios en estilos (Tailwind, CSS)
- Cambios en lógica de negocio
- Cambios en rutas

El servidor de desarrollo sirve el bundle y el WebView recarga automáticamente.

---

## 4. Cuándo sí hace falta recompilar nativo

- Cambios en `ios/` (Swift, Info.plist, etc.)
- Nuevos plugins de Capacitor
- Cambios en `capacitor.config.*` que afectan al proyecto nativo
- Cambios en permisos (ej. geolocalización)

En esos casos: `npm run ios:run` o abrir Xcode y Run.

---

## 5. Flujo recomendado

1. **Desarrollo diario:**  
   `npm run dev:ios` → editar código → ver cambios en Simulator sin Run.

2. **Primera vez o tras cambios nativos:**  
   `npm run ios:run` (build + sync + launch).

3. **Solo sync (sin Run):**  
   `npm run ios:sync:dev` si cambias config de Capacitor.

4. **Probar en iPhone real:**  
   - Web y Simulator usan el mismo servidor Vite (`npm run dev`).
   - Para iPhone físico en la misma red: `CAPACITOR_DEV_SERVER_URL=http://TU_IP:5173 npm run dev:ios`
   - Sustituir `TU_IP` por la IP de tu Mac (ej. `192.168.0.11`).
   - Conectar dispositivo, seleccionar en Xcode, Run.

---

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `dev` | Vite dev server (web) |
| `dev:ios` | Vite + Capacitor iOS con live reload |
| `ios:sync:dev` | Build + sync con dev server |
| `ios:sync` | Build + sync producción |
| `ios:open` | Abre Xcode |
| `ios:run` | Build + sync + compilar + instalar + launch |
