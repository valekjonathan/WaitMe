# Informe — Automatización Completa del Entorno

**Fecha:** 2025-03-06

---

## 1. Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `vite.config.js` | Verificado: `host: true`, `port: 5173`, sin `hmr.host` |
| `package.json` | Añadido `dev:auto`; `dev:ios` usa `scripts/dev-ios.sh` |
| `scripts/get-ip.js` | **Nuevo** — detecta IP local automáticamente |
| `scripts/dev-ios.sh` | **Nuevo** — arranca Vite + Capacitor con IP automática |
| `docs/FLUJO_DESARROLLO_IOS.md` | Actualizado para flujo automatizado |
| `.vscode/extensions.json` | Verificado (sin cambios) |

---

## 2. Scripts creados

| Script | Descripción |
|--------|-------------|
| `dev:auto` | `vite --host --port 5173` (alias de `dev`) |
| `dev:ios` | Vite + Capacitor iOS con live reload e IP automática |
| `scripts/get-ip.js` | Detecta IP local (prioriza en0, WiFi en macOS) |
| `scripts/dev-ios.sh` | Orquesta: IP → Vite + cap run |

---

## 3. Confirmación de live reload en iPhone

- **Simulator:** `npm run dev:ios` → Vite + cap run con `--live-reload --host IP --port 5173`
- **iPhone real:** Mismo comando. iPhone y Mac en la misma WiFi. La IP se detecta automáticamente.
- **Sin pasos manuales:** No hace falta configurar `CAPACITOR_DEV_SERVER_URL` a mano.

---

## 4. Confirmación de entorno automatizado

| Cliente | URL | Mismo servidor |
|---------|-----|----------------|
| Web | `http://localhost:5173` | Sí |
| iOS Simulator | `http://localhost:5173` o `http://IP:5173` | Sí |
| iPhone real | `http://IP:5173` | Sí |

---

## Uso

```bash
npm run dev:ios
```

- Detecta IP
- Inicia Vite en `0.0.0.0:5173`
- Lanza Capacitor con live reload
- Web, Simulator e iPhone usan el mismo servidor
