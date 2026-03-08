# Auditoría Técnica — iPhone Físico Live Reload

**Fecha:** 2025-03-06

---

## 1. VITE

### 1.1 Configuración actual

| Parámetro | Valor | Estado |
|-----------|-------|--------|
| server.host | true | ✓ Correcto (0.0.0.0) |
| server.port | 5173 | ✓ Correcto |
| server.strictPort | — | ❌ Ausente |
| allowedHosts | — | No aplica por defecto |

### 1.2 Riesgos detectados

- **strictPort ausente:** Si el puerto 5173 está ocupado, Vite puede subir automáticamente a 5174, 5175, etc. La URL que usa Capacitor seguiría siendo 5173 → **desconexión total**.
- **Sin comprobación previa:** El script no verifica que 5173 esté libre antes de arrancar.

### 1.3 Acción

- Añadir `strictPort: true` para que Vite falle si 5173 está ocupado.
- Comprobar puerto libre en el script antes de arrancar.

---

## 2. SCRIPTS

### 2.1 package.json

- `dev:ios` → `bash scripts/dev-ios.sh` ✓

### 2.2 scripts/dev-ios.sh

**Flujo actual:**
1. Obtiene IP con get-ip.js
2. Imprime IP y URL
3. Exporta CAPACITOR_USE_DEV_SERVER y CAPACITOR_DEV_SERVER_URL
4. Ejecuta concurrentemente: `vite --host --port 5173` y `npx cap run ios --live-reload --host ${IP} --port 5173`

**Problemas:**
- No comprueba si 5173 está libre.
- No ejecuta `cap copy`/`cap sync` antes de `cap run`; el `capacitor.config.json` en `ios/App/App/` puede estar desactualizado.
- No aborta con error claro si get-ip falla (get-ip.js ya hace exit 1).

### 2.3 scripts/get-ip.js

- Prioriza en0 (WiFi) ✓
- Falla con mensaje si no hay IP ✓
- No imprime la URL completa (solo la IP).

### 2.4 Capacitor y --live-reload

**Importante (GitHub #8303):** `cap run -l` **ignora** `server.url` de `capacitor.config` y usa:
- `--host` si se pasa
- `--port` si se pasa (por defecto **3000** si no)
- Concatena `http://{host}:{port}`

Por tanto, pasar `--host ${IP} --port 5173` es **obligatorio**. Si se omite `--port`, se usaría 3000 y la app no cargaría.

---

## 3. CAPACITOR

### 3.1 capacitor.config.ts

```ts
const useDevServer = process.env.CAPACITOR_USE_DEV_SERVER === 'true';
const serverUrl = process.env.CAPACITOR_DEV_SERVER_URL || 'http://localhost:5173';
...(useDevServer && { server: { url: serverUrl, cleartext: true } })
```

- `cleartext: true` ✓ (HTTP permitido)
- La config se lee al ejecutar `cap sync`/`cap copy`/`cap run`.
- Con `--live-reload`, Capacitor **sobrescribe** esta config con `--host` y `--port`.

### 3.2 Config nativa (ios/App/App/capacitor.config.json)

- Generado por `cap copy`/`cap sync`.
- En `.gitignore`; puede contener una IP antigua si no se ha vuelto a sincronizar.

### 3.3 cap copy / cap sync

- Debe ejecutarse con las env vars correctas para que la config nativa tenga la URL actual.
- Con `--live-reload`, `cap run` usa `--host` y `--port` y puede sobrescribir, pero ejecutar `cap copy ios` antes garantiza una base coherente.

---

## 4. IPHONE FÍSICO — HIPÓTESIS

| Hipótesis | Probabilidad | Comprobación |
|-----------|--------------|--------------|
| App apuntando a localhost | Media | Simulator usa localhost; iPhone no puede. Si la config tuviera localhost, iPhone fallaría. |
| Puerto incorrecto (3000 vs 5173) | Alta | Si no se pasa `--port 5173`, Capacitor usa 3000 por defecto. |
| Puerto ocupado → Vite en 5174 | Alta | Sin strictPort, Vite puede cambiar de puerto. |
| Red local bloqueada en iOS | Alta | iOS 14+ pide permiso "Red local"; si se deniega, no hay conexión. |
| Firewall de macOS | Media | Puede bloquear conexiones entrantes en 5173. |
| iPhone y Mac en distinta red | Media | WiFi distinto, iPhone en datos, etc. |
| Config nativa desactualizada | Media | capacitor.config.json con IP antigua si no se hace sync. |

---

## 5. CAUSA RAÍZ MÁS PROBABLE

1. **Puerto 5173 ocupado** → Vite usa otro puerto; Capacitor sigue en 5173.
2. **Falta de `--port 5173`** en `cap run` (ya está en el script).
3. **Permiso "Red local" denegado** en iPhone.
4. **Config nativa desactualizada** por no ejecutar `cap copy` antes de `cap run`.

---

## 6. ACCIONES CORRECTIVAS

1. Vite: `strictPort: true`.
2. Script: comprobar que 5173 esté libre; abortar si no.
3. Script: ejecutar `cap copy ios` antes de `cap run`.
4. Script: imprimir URL exacta que usará el iPhone.
5. Documentar permiso "Red local" y comprobaciones de red.
