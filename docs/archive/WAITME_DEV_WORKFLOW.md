# WaitMe! — Flujo de desarrollo

Tres carriles: **web rápido** → **validación automática** → **validación nativa final**.

---

## 1. Carril web rápido

```bash
npm run dev
```

- Servidor en `http://localhost:5173`
- Red local: `http://<TU_IP>:5173` (Vite imprime la IP al arrancar)

### Abrir en Safari (Mac)

1. Safari → `http://localhost:5173`
2. O desde red: `http://<TU_IP>:5173`

### Abrir en simulador iOS

1. `npm run dev` en una terminal
2. Otra terminal: `CAPACITOR_USE_DEV_SERVER=true npx cap run ios`
3. El simulador carga la app desde el dev server por IP

**Importante:** Revisa `capacitor.config.ts` — la URL debe coincidir con tu IP local (ej. `192.168.0.15:5173`).

### Abrir en iPhone real

1. iPhone y Mac en la misma red WiFi
2. `npm run dev`
3. En el iPhone: Safari → `http://<IP_DE_TU_MAC>:5173`
4. O con Capacitor: `CAPACITOR_USE_DEV_SERVER=true npx cap run ios` (iPhone conectado por cable)

---

## 2. Validación automática (Playwright)

```bash
npm run test:e2e
```

Ejecuta smoke tests en WebKit (iPhone 14) y Chromium. Arranca el servidor en puerto 5174 si no hay uno activo.

```bash
npm run test:e2e:ui
```

Abre la UI de Playwright para depurar tests.

### Solo smoke tests

```bash
npm run test:e2e tests/smoke/
```

### Geolocation personalizada

```bash
PLAYWRIGHT_GEOLOCATION='{"latitude":40.4168,"longitude":-3.7038}' npm run test:e2e
```

---

## 3. Validación nativa final

### Cuándo usar Capacitor

- Probar en simulador o dispositivo real
- Probar APIs nativas (geolocalización, status bar, etc.)
- Validar el build final antes de publicar

### Cuándo NO usar Capacitor

- Desarrollo rápido de UI
- Cambios de estilos o lógica
- Ejecutar Playwright (usa el navegador web)

### Comandos Capacitor

| Comando | Descripción |
|---------|-------------|
| `npm run ios:run:dev` | Simulador con dev server (hot reload) |
| `npm run ios:sync` | Build + sync a iOS (sin dev server) |
| `npm run ios:open` | Abre Xcode |

---

## Flujo recomendado día a día

1. **Desarrollo:** `npm run dev` → editar código → ver en Safari o simulador
2. **Tras cambios importantes:** `npm run test:e2e tests/smoke/`
3. **Antes de commit:** `npm run check` (lint + build)
4. **Validación nativa:** `npm run ios:run:dev` o `npm run ios:sync` + abrir en simulador

### Preview (build de producción)

```bash
npm run build
npm run preview
```

- Preview en `http://localhost:4173` (o IP de red)
