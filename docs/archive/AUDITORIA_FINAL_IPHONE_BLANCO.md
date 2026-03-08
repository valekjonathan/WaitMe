# Auditoría Final — iPhone Físico en Blanco

**Fecha:** 2025-03-06

---

## 1. VITE — Verificación real

| Parámetro | Valor | Verificado |
|-----------|-------|------------|
| host | true | ✓ |
| port | 5173 | ✓ |
| strictPort | true | ✓ |
| hmr.host | — | ✓ No hardcodeado |

**Prueba real:** Con puerto 5173 ocupado, Vite falla con:
```
Error: Port 5173 is already in use
```
No cambia a otro puerto.

---

## 2. PACKAGE.JSON

- `dev:ios` → `bash scripts/dev-ios.sh` ✓

---

## 3. SCRIPTS

### get-ip.js
- Prioriza en0 (WiFi) ✓
- Falla con mensaje si no hay IP ✓
- Prueba real: devuelve IP válida (ej. 192.168.0.15)

### dev-ios.sh
- Comprueba puerto 5173 libre ✓
- Obtiene IP ✓
- Imprime IP, puerto, URL exacta ✓
- Aborta si no hay IP ✓
- Aborta si 5173 ocupado ✓
- Ejecuta `cap copy ios` antes de `cap run` ✓
- Usa `exec npx concurrently` (no deja procesos huérfanos; Ctrl+C mata ambos)

---

## 4. CAPACITOR

### capacitor.config.ts
- `server.url` = `CAPACITOR_DEV_SERVER_URL` o `http://localhost:5173` ✓
- `cleartext: true` en dev ✓

### Config nativa
- `cap copy ios` crea `ios/App/App/capacitor.config.json` con `server.url` correcta ✓
- Prueba real: `CAPACITOR_DEV_SERVER_URL="http://192.168.0.15:5173" cap copy ios` → config con URL correcta

### cap run vs cap sync
- `cap run ios --live-reload` usa `--host` y `--port` para sobrescribir la URL
- `cap copy` antes de `cap run` asegura que la config base esté actualizada

---

## 5. FLUJO NATIVO iOS

- `dev:ios` ejecuta `cap copy ios` antes de `cap run` ✓
- `cap run` no hace sync completo; `cap copy` es suficiente para la config

---

## 6. DIAGNÓSTICO iPhone FÍSICO — CAUSA RAÍZ

| Hipótesis | Estado | Evidencia |
|-----------|--------|-----------|
| localhost en vez de IP | Descartada | Script usa IP de get-ip.js |
| Puerto incorrecto | Descartada | Se pasa --port 5173 |
| Config nativa desactualizada | Mitigada | cap copy antes de cap run |
| Misma WiFi no garantizada | Posible | Requiere verificación manual |
| Firewall macOS | Posible | Requiere verificación manual |
| **Permiso Red local nunca disparado** | **Causa raíz más probable** | **Info.plist sin NSLocalNetworkUsageDescription** |

### NSLocalNetworkUsageDescription

En iOS 14+, cuando la app intenta conectar a la red local (ej. `http://192.168.x.x:5173`), el sistema pide permiso. **Si falta `NSLocalNetworkUsageDescription` en Info.plist**, iOS puede bloquear la conexión de forma silenciosa → **pantalla en blanco**.

El proyecto **no tenía** esta clave en `ios/App/App/Info.plist`.

---

## 7. ACCIÓN CORRECTIVA

Añadir a `ios/App/App/Info.plist`:

```xml
<key>NSLocalNetworkUsageDescription</key>
<string>WaitMe necesita acceso a la red local para cargar la app desde el servidor de desarrollo.</string>
```

Esto permite que iOS muestre el diálogo de permiso y que la conexión al Mac funcione.
