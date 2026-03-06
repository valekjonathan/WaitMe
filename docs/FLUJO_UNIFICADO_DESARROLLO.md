# Flujo Unificado de Desarrollo — WaitMe

**Objetivo:** Un único comando para arrancar todo. Cambios de React/CSS/JS se reflejan automáticamente en web, Simulator e iPhone físico sin Run manual.

---

## 1. Comando recomendado

```bash
npm run dev:ios
```

**Qué hace:**
1. Detecta la IP local (en0/WiFi en macOS)
2. Arranca Vite en `0.0.0.0:5173` (accesible desde red local)
3. Configura `CAPACITOR_DEV_SERVER_URL` con esa IP
4. Lanza Capacitor iOS con live reload
5. Sirve tanto para Simulator como para iPhone físico

**No hace falta:**
- Configurar `CAPACITOR_DEV_SERVER_URL` manualmente
- Ejecutar `npm run dev` y `npx cap run ios` por separado
- Hacer Run manual para ver cambios en web

---

## 2. Cuándo NO hace falta Run manual

| Cambio | Acción |
|--------|--------|
| React (JSX, componentes) | HMR automático |
| CSS / Tailwind | HMR automático |
| JS / utilidades | HMR automático |
| Rutas, estado | HMR automático |

Los cambios se reflejan al guardar en:
- **Web:** http://localhost:5173
- **Simulator:** recarga automática
- **iPhone físico:** recarga automática (misma red WiFi)

---

## 3. Cuándo SÍ hace falta recompilar nativo

| Cambio | Acción |
|--------|--------|
| `capacitor.config.ts` | `npm run ios:sync` + reabrir app |
| Plugins Capacitor nuevos | `npm run ios:sync` |
| `package.json` (deps nativas) | `npm run ios:sync` |
| Permisos iOS (Info.plist) | `npx cap sync ios` |
| Assets nativos (iconos, splash) | `npx cap sync ios` |

---

## 4. Comandos de referencia

| Comando | Uso |
|---------|-----|
| `npm run dev` | Solo web (localhost:5173) |
| `npm run dev:ios` | Web + iOS (Simulator o físico) con live reload |
| `npm run build` | Build producción |
| `npm run ios:sync` | Sincronizar dist a iOS |
| `npm run ios:open` | Abrir Xcode |
| `npm run ios:run:dev` | Ejecutar app con dev server (sin arrancar Vite) |

---

## 5. Requisitos

- macOS
- Xcode
- iPhone y Mac en la misma red WiFi (para iPhone físico)
- Node.js y dependencias instaladas (`npm install`)

---

## 6. Fallos frecuentes

| Problema | Solución |
|----------|----------|
| "No se encontró IP local" | Conecta a WiFi (en0) o verifica interfaces de red |
| "Puerto 5173 ocupado" | Cierra el proceso que lo usa: `lsof -i :5173` |
| Simulator no carga | Verifica que Vite esté en 0.0.0.0:5173 (`--host`) |
| iPhone físico no carga | Ver **docs/FLUJO_IPHONE_FISICO.md** (permiso Red local, misma WiFi, firewall) |
| Cambios no se ven | Live reload activo; si no, recarga manual en el dispositivo |
