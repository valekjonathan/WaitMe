# Entregable Final — iPhone Físico Live Reload

**Fecha:** 2025-03-06

---

### 1. Causa raíz más probable

1. **Puerto 5173 ocupado** → Vite podía usar otro puerto (5174, 5175…) por falta de `strictPort`; Capacitor seguía apuntando a 5173.
2. **Config nativa desactualizada** → `capacitor.config.json` en `ios/App/App/` podía tener una IP antigua; no se ejecutaba `cap copy` antes de `cap run`.
3. **Permiso "Red local" denegado** en iPhone (iOS 14+).
4. **`cap run -l` ignora `server.url`** → Usa `--host` y `--port`; si no se pasa `--port`, usa 3000 por defecto (ya se pasaba correctamente).

---

### 2. Causas secundarias descartadas o confirmadas

| Causa | Estado |
|-------|--------|
| App apuntando a localhost | Descartada: el script usa la IP del Mac |
| Puerto por defecto 3000 | Descartada: se pasa `--port 5173` |
| `allowedHosts` en Vite | No aplica; no se ha tocado |
| `hmr.host` hardcodeado | No existía; no se ha tocado |
| Orden de lanzamiento Vite/Capacitor | Correcto: se lanzan en paralelo tras `cap copy` |

---

### 3. Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `vite.config.js` | Añadido `strictPort: true` |
| `scripts/dev-ios.sh` | Comprobación de puerto, `cap copy ios`, mensajes claros, comprobación de `dist` |
| `docs/AUDITORIA_IPHONE_LIVE_RELOAD.md` | Nuevo (auditoría) |
| `docs/FLUJO_IPHONE_FISICO.md` | Nuevo (flujo y comprobaciones) |
| `docs/ENTREGABLE_FINAL_IPHONE_LIVE_RELOAD.md` | Nuevo (este documento) |

---

### 4. Cambios aplicados

1. **Vite:** `strictPort: true` para que falle si 5173 está ocupado.
2. **dev-ios.sh:**
   - Comprobar que 5173 esté libre antes de arrancar.
   - Mostrar IP, puerto y URL exacta para el iPhone.
   - Ejecutar `cap copy ios` antes de `cap run` para actualizar la config nativa.
   - Crear `dist` si no existe (build inicial).
   - Mensajes claros si el puerto está ocupado o no hay IP.

3. **Documentación:**
   - `FLUJO_IPHONE_FISICO.md`: orden oficial, URL, permiso "Red local", misma WiFi, firewall.

---

### 5. URL exacta que debe usar el iPhone

La URL se imprime al ejecutar `npm run dev:ios`, por ejemplo:

```
URL iPhone:     http://192.168.1.42:5173
```

Debe coincidir con la IP mostrada por el script. El iPhone carga la app desde esa URL.

---

### 6. Validación realizada

| Prueba | Resultado |
|--------|-----------|
| `npm run lint` | Warnings previos; sin errores en archivos tocados |
| `npm run build` | OK |
| `npm run test:e2e tests/layout-device-frame.spec.js` | 3 passed |
| Comprobación de puerto ocupado | El script falla con mensaje claro |
| Sintaxis de `dev-ios.sh` | OK |

---

### 7. Confirmación final de que web, simulator e iPhone usan el mismo servidor real

- **Web:** `http://localhost:5173` (mismo proceso Vite).
- **Simulator:** `http://<IP>:5173` (mismo proceso Vite; Simulator en el Mac).
- **iPhone físico:** `http://<IP>:5173` (mismo proceso Vite; iPhone en la misma red).

Los tres usan el mismo servidor Vite en `0.0.0.0:5173`. La IP se obtiene con `get-ip.js` y se pasa a Capacitor mediante `--host` y `--port` en `cap run --live-reload`.
